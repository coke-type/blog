import { apiGetAllPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { HomeClient } from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await apiGetAllPosts();
  const tagSet = new Set<string>();
  posts.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
  const tags = Array.from(tagSet).sort();

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <header className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mb-1">
          ~/blog
        </h1>
        <p className="text-sm text-zinc-500">日常记录 · 技术随想</p>
      </header>

      <HomeClient posts={posts} tags={tags} />
    </div>
  );
}
