import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import fs from "fs";
import path from "path";

const postsDir = path.join(process.cwd(), "content/posts");
const metaPath = path.join(postsDir, "meta.json");

interface PostData {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  content: string;
}

interface MetaEntry {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
}

function readMeta(): MetaEntry[] {
  const raw = fs.readFileSync(metaPath, "utf-8");
  return JSON.parse(raw);
}

function writeMeta(entries: MetaEntry[]) {
  fs.writeFileSync(metaPath, JSON.stringify(entries, null, 2), "utf-8");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

// Create post
async function createPost(data: PostData) {
  // Auto-generate slug from title if empty
  const slug = data.slug || slugify(data.title);

  // Check if slug already exists
  const mdxPath = path.join(postsDir, `${slug}.mdx`);
  if (fs.existsSync(mdxPath)) {
    return { error: "Slug already exists" };
  }

  // Write .mdx file
  fs.writeFileSync(mdxPath, data.content, "utf-8");

  // Update meta.json
  const meta = readMeta();
  meta.push({
    slug,
    title: data.title,
    date: data.date,
    tags: data.tags,
    excerpt: data.excerpt,
  });
  writeMeta(meta);

  return { ok: true, slug };
}

// Update post
async function updatePost(data: PostData) {
  const mdxPath = path.join(postsDir, `${data.slug}.mdx`);
  if (!fs.existsSync(mdxPath)) {
    return { error: "Post not found" };
  }

  // Write .mdx file
  fs.writeFileSync(mdxPath, data.content, "utf-8");

  // Update meta.json
  const meta = readMeta();
  const idx = meta.findIndex((m) => m.slug === data.slug);
  if (idx === -1) {
    return { error: "Meta entry not found" };
  }

  meta[idx] = {
    slug: data.slug,
    title: data.title,
    date: data.date,
    tags: data.tags,
    excerpt: data.excerpt,
  };
  writeMeta(meta);

  return { ok: true };
}

// Delete post
async function deletePost(slug: string) {
  const mdxPath = path.join(postsDir, `${slug}.mdx`);
  if (fs.existsSync(mdxPath)) {
    fs.unlinkSync(mdxPath);
  }

  const meta = readMeta();
  const filtered = meta.filter((m) => m.slug !== slug);
  writeMeta(filtered);

  return { ok: true };
}

export async function POST(req: NextRequest) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = await createPost(body);
  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = await updatePost(body);
  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await req.json();
  const result = await deletePost(slug);
  return NextResponse.json(result);
}

// List all posts (for admin panel)
export async function GET(req: NextRequest) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  // Fetch single post with content
  if (slug) {
    const meta = readMeta();
    const entry = meta.find((m) => m.slug === slug);
    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const mdxPath = path.join(postsDir, `${slug}.mdx`);
    const content = fs.readFileSync(mdxPath, "utf-8");
    return NextResponse.json({ ...entry, content });
  }

  // List all
  const meta = readMeta();
  return NextResponse.json(meta);
}
