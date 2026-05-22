import { getAllPosts, getAllTags } from "@/lib/posts";
import { HomeClient } from "@/components/HomeClient";

export default function Home() {
  const posts = getAllPosts();
  const tags = getAllTags();

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <header className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mb-1">
          ~/blog
        </h1>
        <p className="text-sm text-zinc-500">
          日常记录 · 技术随想
        </p>
      </header>

      <HomeClient posts={posts} tags={tags} />
    </div>
  );
}
