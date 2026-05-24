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

const postsDir = path.join(process.cwd(), "content/posts");

// ---- Check if blobs are available ----
let _blobsAvailable: boolean | null = null;
async function blobsAvailable(): Promise<boolean> {
  if (_blobsAvailable !== null) return _blobsAvailable;
  try {
    await getStore("posts").get("meta", { type: "text" });
    _blobsAvailable = true;
  } catch {
    _blobsAvailable = false;
  }
  return _blobsAvailable;
}

// ---- Blob storage ----

async function readMetaBlob(): Promise<PostMeta[]> {
  const raw = await getStore("posts").get("meta", { type: "text" });
  if (raw) return JSON.parse(raw);
  // Seed from filesystem
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
  await getStore("posts").set("meta", JSON.stringify(entries, null, 2));
}

async function readContentBlob(slug: string): Promise<string> {
  const raw = await getStore("posts").get(`content:${slug}`, { type: "text" });
  return raw || "";
}

async function writeContentBlob(slug: string, content: string) {
  await getStore("posts").set(`content:${slug}`, content);
}

async function deleteContentBlob(slug: string) {
  await getStore("posts").delete(`content:${slug}`);
}

// ---- Filesystem storage ----

function metaPath() { return path.join(postsDir, "meta.json"); }
function mdxPath(slug: string) { return path.join(postsDir, `${slug}.mdx`); }

function readMetaFs(): PostMeta[] {
  const mp = metaPath();
  if (!fs.existsSync(mp)) return [];
  return JSON.parse(fs.readFileSync(mp, "utf-8"));
}

function writeMetaFs(entries: PostMeta[]) {
  fs.writeFileSync(metaPath(), JSON.stringify(entries, null, 2), "utf-8");
}

function readContentFs(slug: string): string {
  const fp = mdxPath(slug);
  return fs.existsSync(fp) ? fs.readFileSync(fp, "utf-8") : "";
}

function writeContentFs(slug: string, content: string) {
  fs.writeFileSync(mdxPath(slug), content, "utf-8");
}

function deleteContentFs(slug: string) {
  const fp = mdxPath(slug);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

// ---- Build-time (SSG, uses fs) ----

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

// ---- Runtime API ----

export async function apiGetAllPosts(): Promise<PostMeta[]> {
  if (await blobsAvailable()) {
    const meta = await readMetaBlob();
    return meta.sort((a, b) => (a.date > b.date ? -1 : 1));
  }
  return getAllPosts();
}

export async function apiGetPostContent(slug: string): Promise<string> {
  if (await blobsAvailable()) return readContentBlob(slug);
  return readContentFs(slug);
}

export async function apiGetPostContentHtml(slug: string): Promise<string> {
  const md = await apiGetPostContent(slug);
  return marked(md);
}

export async function apiCreatePost(data: PostMeta & { content: string }) {
  const slug = data.slug || slugify(data.title);
  if (await blobsAvailable()) {
    const meta = await readMetaBlob();
    if (meta.find((m) => m.slug === slug)) return { error: "Slug exists" };
    meta.push({ slug, title: data.title, date: data.date, tags: data.tags, excerpt: data.excerpt });
    await writeMetaBlob(meta);
    await writeContentBlob(slug, data.content);
  } else {
    if (fs.existsSync(mdxPath(slug))) return { error: "Slug exists" };
    writeContentFs(slug, data.content);
    const meta = readMetaFs();
    meta.push({ slug, title: data.title, date: data.date, tags: data.tags, excerpt: data.excerpt });
    writeMetaFs(meta);
  }
  return { ok: true, slug };
}

export async function apiUpdatePost(data: PostMeta & { content: string }) {
  if (await blobsAvailable()) {
    const meta = await readMetaBlob();
    const idx = meta.findIndex((m) => m.slug === data.slug);
    if (idx === -1) return { error: "Not found" };
    meta[idx] = { slug: data.slug, title: data.title, date: data.date, tags: data.tags, excerpt: data.excerpt };
    await writeMetaBlob(meta);
    await writeContentBlob(data.slug, data.content);
  } else {
    if (!fs.existsSync(mdxPath(data.slug))) return { error: "Not found" };
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
  if (await blobsAvailable()) {
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
  return text.toLowerCase().replace(/[^a-z0-9一-鿿]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "post";
}
