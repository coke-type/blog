import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  apiGetAllPosts,
  apiGetPostContent,
  apiCreatePost,
  apiUpdatePost,
  apiDeletePost,
} from "@/lib/posts";

// Create post
export async function POST(req: NextRequest) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = await apiCreatePost(body);
    if (result.error) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Update post
export async function PUT(req: NextRequest) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = await apiUpdatePost(body);
  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}

// Delete post
export async function DELETE(req: NextRequest) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await req.json();
  const result = await apiDeletePost(slug);
  return NextResponse.json(result);
}

// List all posts or get single post with content
export async function GET(req: NextRequest) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (slug) {
    const meta = await apiGetAllPosts();
    const entry = meta.find((m) => m.slug === slug);
    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const content = await apiGetPostContent(slug);
    return NextResponse.json({ ...entry, content });
  }

  const meta = await apiGetAllPosts();
  return NextResponse.json(meta);
}
