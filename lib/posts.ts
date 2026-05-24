import { getStore } from "@netlify/blobs";
import fs from "fs";
import path from "path";
import { marked } from "marked";

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
}

const postsDirectory = path.join(process.cwd(), "content/posts");

// Detect Netlify: try env var, then try to detect read-only fs
let _checkIsNetlify(): boolean | null = null;
function checkIsNetlify(): boolean {
  if (_checkIsNetlify() !== null) return _checkIsNetlify();
  if (process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT) { _checkIsNetlify() = true; return true; }
  try {
    const testPath = path.join(postsDirectory, ".write_test");
    fs.writeFileSync(testPath, "test");
    fs.unlinkSync(testPath);
    _checkIsNetlify() = false;
  } catch {
    _checkIsNetlify() = true;
  }
  return _checkIsNetlify();
}

// ---- Storage abstraction ----

function getPostsStore() {
  return getStore("posts");
}

// ---- Blob storage ----

async function readMetaBlob(): Promise<PostMeta[]> {
  const store = getPostsStore();
  const raw = await store.get("meta", { type: "text" });
  if (raw) return JSON.parse(raw);

  // Seed from filesystem on first run
  const fsMeta = readMetaFs();
  if (fsMeta.length > 0) {
    await writeMetaBlob(fsMeta);
    for (const p of fsMeta) {
      const c = readContentFs(p.slug);
      if (c) await writeContentBlob(p.slug, c);
    }
  }
  return fsMeta;
}

async function writeMetaBlob(entries: PostMeta[]) {
  await getPostsStore().set("meta", JSON.stringify(entries, null, 2));
}

async function readContentBlob(slug: string): Promise<string> {
  const raw = await getPostsStore().get(`content:${slug}`, { type: "text" });
  return raw || "";
}

async function writeContentBlob(slug: string, content: string) {
  await getPostsStore().set(`content:${slug}`, content);
}

async function deleteContentBlob(slug: string) {
  await getPostsStore().delete(`content:${slug}`);
}

// ---- Filesystem storage ----

function readMetaFs(): PostMeta[] {
  const mp = path.join(postsDirectory, "meta.json");
  if (!fs.existsSync(mp)) return [];
  return JSON.parse(fs.readFileSync(mp, "utf-8"));
}

function writeMetaFs(entries: PostMeta[]) {
  fs.writeFileSync(path.join(postsDirectory, "meta.json"), JSON.stringify(entries, null, 2), "utf-8");
}

function readContentFs(slug: string): string {
  const fp = path.join(postsDirectory, `${slug}.mdx`);
  return fs.existsSync(fp) ? fs.readFileSync(fp, "utf-8") : "";
}

function writeContentFs(slug: string, content: string) {
  fs.writeFileSync(path.join(postsDirectory, `${slug}.mdx`), content, "utf-8");
}

function deleteContentFs(slug: string) {
  const fp = path.join(postsDirectory, `${slug}.mdx`);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

// ---- Build-time (SSG) ----

export function getAllPosts(): PostMeta[] {
  return readMetaFs().sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getAllTags(): string[] {
  const s = new Set<string>();
  getAllPosts().forEach((p) => p.tags.forEach((t) => s.add(t)));
  return Array.from(s).sort();
}

export function getPostBySlug(slug: string): PostMeta | null {
  return getAllPosts().find((p) => p.slug === slug) || null;
}

// ---- Runtime API (for route handlers and dynamic pages) ----

export async function apiGetAllPosts(): Promise<PostMeta[]> {
  const meta = checkIsNetlify() ? await readMetaBlob() : readMetaFs();
  return meta.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export async function apiGetPostContent(slug: string): Promise<string> {
  if (checkIsNetlify()) return readContentBlob(slug);
  return readContentFs(slug);
}

export async function apiGetPostContentHtml(slug: string): Promise<string> {
  const md = await apiGetPostContent(slug);
  return marked(md);
}

export async function apiCreatePost(data: PostMeta & { content: string }) {
  const slug = data.slug || slugify(data.title);

  if (checkIsNetlify()) {
    const meta = await readMetaBlob();
    if (meta.find((m) => m.slug === slug)) return { error: "Slug exists" };
    meta.push({ slug, title: data.title, date: data.date, tags: data.tags, excerpt: data.excerpt });
    await writeMetaBlob(meta);
    await writeContentBlob(slug, data.content);
  } else {
    if (fs.existsSync(path.join(postsDirectory, `${slug}.mdx`))) return { error: "Slug exists" };
    writeContentFs(slug, data.content);
    const meta = readMetaFs();
    meta.push({ slug, title: data.title, date: data.date, tags: data.tags, excerpt: data.excerpt });
    writeMetaFs(meta);
  }
  return { ok: true, slug };
}

export async function apiUpdatePost(data: PostMeta & { content: string }) {
  if (checkIsNetlify()) {
    const meta = await readMetaBlob();
    const idx = meta.findIndex((m) => m.slug === data.slug);
    if (idx === -1) return { error: "Not found" };
    meta[idx] = { slug: data.slug, title: data.title, date: data.date, tags: data.tags, excerpt: data.excerpt };
    await writeMetaBlob(meta);
    await writeContentBlob(data.slug, data.content);
  } else {
    if (!fs.existsSync(path.join(postsDirectory, `${data.slug}.mdx`))) return { error: "Not found" };
    writeContentFs(data.slug, data.content);
    const meta = readMetaFs();
    const idx = meta.findIndex((m) => m.slug === data.slug);
    if (idx === -1) return { error: "Not found" };
    meta[idx] = { slug: data.slug, title: data.title, date: data.date, tags: data.tags, excerpt: data.excerpt };
    writeMetaFs(meta);
  }
  return { ok: true };
}

export async function apiDeletePost(slug: string) {
  if (checkIsNetlify()) {
    const meta = await readMetaBlob();
    await writeMetaBlob(meta.filter((m) => m.slug !== slug));
    await deleteContentBlob(slug);
  } else {
    deleteContentFs(slug);
    writeMetaFs(readMetaFs().filter((m) => m.slug !== slug));
  }
  return { ok: true };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "post";
}
