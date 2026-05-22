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
const metaPath = path.join(postsDirectory, "meta.json");

function readMeta(): PostMeta[] {
  const raw = fs.readFileSync(metaPath, "utf-8");
  return JSON.parse(raw) as PostMeta[];
}

export function getAllPosts(): PostMeta[] {
  const posts = readMeta();
  return posts.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tagSet = new Set<string>();
  posts.forEach((post) => {
    post.tags.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

export function getPostBySlug(slug: string): PostMeta | null {
  const posts = getAllPosts();
  return posts.find((post) => post.slug === slug) || null;
}
