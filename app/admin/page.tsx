"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Post {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
}

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loggedIn) return;
    fetch("/api/posts")
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => setPosts(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      setLoggedIn(true);
    } else {
      setError("Wrong password");
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`Delete "${slug}"?`)) return;

    const res = await fetch("/api/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });

    if (res.ok) {
      setPosts(posts.filter((p) => p.slug !== slug));
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setLoggedIn(false);
  };

  // Login screen
  if (!loggedIn) {
    return (
      <div className="max-w-sm mx-auto px-6 py-24">
        <h1 className="text-xl font-bold text-zinc-100 mb-6 text-center">
          Admin Login
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
            autoFocus
          />
          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-cyan-600 text-white font-medium text-sm hover:bg-cyan-500 transition-colors"
          >
            Sign in
          </button>
        </form>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold text-zinc-100">Posts</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/edit"
            className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-500 transition-colors"
          >
            + New Post
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 text-sm font-medium hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm">Loading...</p>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <p className="text-base">No posts yet. Write your first one!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {posts.map((post) => (
            <div
              key={post.slug}
              className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-zinc-900 transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-200 truncate">
                  {post.title}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {post.date} &middot; {post.tags.join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/admin/edit?slug=${post.slug}`}
                  className="px-3 py-1.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(post.slug)}
                  className="px-3 py-1.5 rounded text-xs font-medium bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
