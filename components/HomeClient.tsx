"use client";

import { useState } from "react";
import { PostMeta } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";

export function HomeClient({
  posts,
  tags,
}: {
  posts: PostMeta[];
  tags: string[];
}) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filteredPosts = activeTag
    ? posts.filter((p) => p.tags.includes(activeTag))
    : posts;

  return (
    <>
      {/* Tag filter */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          <button
            onClick={() => setActiveTag(null)}
            className={`tag-pill ${activeTag === null ? "active" : ""}`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`tag-pill ${activeTag === tag ? "active" : ""}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Post list */}
      {filteredPosts.length > 0 ? (
        <div className="flex flex-col gap-4">
          {filteredPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="text-base">还没有文章，写点什么吧</p>
        </div>
      )}
    </>
  );
}
