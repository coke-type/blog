import { PostMeta } from "@/lib/posts";
import Link from "next/link";

export function PostCard({ post }: { post: PostMeta }) {
  const formattedDate = new Date(post.date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link href={`/posts/${post.slug}`}>
      <article className="card p-5 group cursor-pointer">
        <time
          dateTime={post.date}
          className="text-xs font-medium text-zinc-500 mb-3 block"
        >
          {formattedDate}
        </time>

        <h2 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-cyan-400 transition-colors leading-snug">
          {post.title}
        </h2>

        {post.excerpt && (
          <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2 mb-3">
            {post.excerpt}
          </p>
        )}

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span key={tag} className="tag-pill">
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </Link>
  );
}
