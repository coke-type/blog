import { getStore } from "@netlify/blobs";
import fs from "fs";
import path from "path";

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
}

const postsDirectory = path.join(process.cwd(), "content/posts");

// Detect if running on Netlify (serverless functions)
const isNetlify = !!process.env.NETLIFY;

// ---- Blob-based storage (Netlify) ----

function getPostsStore() {
  try {
    return getStore("posts");
  } catch {
    // Fallback: manually configure if env vars are available
    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_BLOBS_TOKEN;
    if (siteID && token) {
      return getStore({ siteID, token, name: "posts" });
    }
    throw new Error("Blobs not configured: set NETLIFY_SITE_ID and NETLIFY_BLOBS_TOKEN");
  }
}

async function readMetaBlob(): Promise<PostMeta[]> {
  const store = getPostsStore();
  const raw = await store.get("meta", { type: "text" });
  if (raw) return JSON.parse(raw);

  // First run: seed blobs from filesystem
  const fsMeta = readMetaFs();
  if (fsMeta.length > 0) {
    await writeMetaBlob(fsMeta);
    // Also seed all content blobs
    for (const post of fsMeta) {
      const content = readContentFs(post.slug);
      if (content) await writeContentBlob(post.slug, content);
    }
  }
  return fsMeta;
}

async function writeMetaBlob(entries: PostMeta[]) {
  const store = getPostsStore();
  await store.set("meta", JSON.stringify(entries, null, 2));
}

async function readContentBlob(slug: string): Promise<string> {
  const store = getPostsStore();
  const raw = await store.get(`content:${slug}`, { type: "text" });
  return raw || "";
}

async function writeContentBlob(slug: string, content: string) {
  const store = getPostsStore();
  await store.set(`content:${slug}`, content);
}

async function deleteContentBlob(slug: string) {
  const store = getPostsStore();
  await store.delete(`content:${slug}`);
}

// ---- Filesystem-based storage (local dev) ----

function readMetaFs(): PostMeta[] {
  const metaPath = path.join(postsDirectory, "meta.json");
  if (!fs.existsSync(metaPath)) return [];
  const raw = fs.readFileSync(metaPath, "utf-8");
  return JSON.parse(raw);
}

function writeMetaFs(entries: PostMeta[]) {
  const metaPath = path.join(postsDirectory, "meta.json");
  fs.writeFileSync(metaPath, JSON.stringify(entries, null, 2), "utf-8");
}

function readContentFs(slug: string): string {
  const mdxPath = path.join(postsDirectory, `${slug}.mdx`);
  if (!fs.existsSync(mdxPath)) return "";
  return fs.readFileSync(mdxPath, "utf-8");
}

function writeContentFs(slug: string, content: string) {
  const mdxPath = path.join(postsDirectory, `${slug}.mdx`);
  fs.writeFileSync(mdxPath, content, "utf-8");
}

function deleteContentFs(slug: string) {
  const mdxPath = path.join(postsDirectory, `${slug}.mdx`);
  if (fs.existsSync(mdxPath)) fs.unlinkSync(mdxPath);
}

// ---- Unified API ----

export function getAllPosts(): PostMeta[] {
  // This runs at build time (SSG), always use fs
  return readMetaFs().sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tagSet = new Set<string>();
  posts.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}

export function getPostBySlug(slug: string): PostMeta | null {
  return getAllPosts().find((p) => p.slug === slug) || null;
}

// ---- Runtime API (used by route handlers) ----

export async function apiGetAllPosts(): Promise<PostMeta[]> {
  if (isNetlify) {
    const meta = await readMetaBlob();
    return meta.sort((a, b) => (a.date > b.date ? -1 : 1));
  }
  return getAllPosts();
}

export async function apiGetPostContent(slug: string): Promise<string> {
  if (isNetlify) return readContentBlob(slug);
  return readContentFs(slug);
}

export async function apiCreatePost(data: PostMeta & { content: string }) {
  const slug = data.slug || slugify(data.title);

  if (isNetlify) {
    const meta = await readMetaBlob();
    if (meta.find((m) => m.slug === slug)) return { error: "Slug already exists" };
    meta.push({ slug, title: data.title, date: data.date, tags: data.tags, excerpt: data.excerpt });
    await writeMetaBlob(meta);
    await writeContentBlob(slug, data.content);
  } else {
    const mdxPath = path.join(postsDirectory, `${slug}.mdx`);
    if (fs.existsSync(mdxPath)) return { error: "Slug already exists" };
    writeContentFs(slug, data.content);
    const meta = readMetaFs();
    meta.push({ slug, title: data.title, date: data.date, tags: data.tags, excerpt: data.excerpt });
    writeMetaFs(meta);
  }

  return { ok: true, slug };
}

export async function apiUpdatePost(data: PostMeta & { content: string }) {
  if (isNetlify) {
    const meta = await readMetaBlob();
    const idx = meta.findIndex((m) => m.slug === data.slug);
    if (idx === -1) return { error: "Post not found" };
    meta[idx] = { slug: data.slug, title: data.title, date: data.date, tags: data.tags, excerpt: data.excerpt };
    await writeMetaBlob(meta);
    await writeContentBlob(data.slug, data.content);
  } else {
    const mdxPath = path.join(postsDirectory, `${data.slug}.mdx`);
    if (!fs.existsSync(mdxPath)) return { error: "Post not found" };
    writeContentFs(data.slug, data.content);
    const meta = readMetaFs();
    const idx = meta.findIndex((m) => m.slug === data.slug);
    if (idx === -1) return { error: "Meta entry not found" };
    meta[idx] = { slug: data.slug, title: data.title, date: data.date, tags: data.tags, excerpt: data.excerpt };
    writeMetaFs(meta);
  }

  return { ok: true };
}

export async function apiDeletePost(slug: string) {
  if (isNetlify) {
    const meta = await readMetaBlob();
    await writeMetaBlob(meta.filter((m) => m.slug !== slug));
    await deleteContentBlob(slug);
  } else {
    const mdxPath = path.join(postsDirectory, `${slug}.mdx`);
    if (fs.existsSync(mdxPath)) fs.unlinkSync(mdxPath);
    const meta = readMetaFs();
    writeMetaFs(meta.filter((m) => m.slug !== slug));
  }

  return { ok: true };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
