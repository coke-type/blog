"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface PostData {
  slug: string;
  title: string;
  date: string;
  tags: string;
  excerpt: string;
  content: string;
}

function EditPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSlug = searchParams.get("slug");
  const isEditing = !!editSlug;

  const [form, setForm] = useState<PostData>({
    slug: "",
    title: "",
    date: new Date().toISOString().slice(0, 10),
    tags: "",
    excerpt: "",
    content: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(isEditing);
  const [preview, setPreview] = useState(false);

  // Load existing post data
  useEffect(() => {
    if (!editSlug) return;

    fetch(`/api/posts?slug=${editSlug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setForm({
          slug: data.slug,
          title: data.title,
          date: data.date,
          tags: data.tags.join(", "),
          excerpt: data.excerpt,
          content: data.content,
        });
        setLoading(false);
      })
      .catch(() => {
        setMessage("Failed to load post.");
        setLoading(false);
      });
  }, [editSlug]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setMessage("Title is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    const method = isEditing ? "PUT" : "POST";
    const body = {
      slug: form.slug || undefined,
      title: form.title.trim(),
      date: form.date,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      excerpt: form.excerpt.trim(),
      content: form.content,
    };

    try {
      const res = await fetch("/api/posts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Saved!");
        if (!isEditing && data.slug) {
          router.push(`/admin/edit?slug=${data.slug}`);
        }
      } else {
        setMessage(data.error || "Save failed.");
      }
    } catch {
      setMessage("Network error.");
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-zinc-500 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors"
          >
            &larr; Back
          </Link>
          <h1 className="text-lg font-bold text-zinc-100">
            {isEditing ? "Edit Post" : "New Post"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreview(!preview)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              preview
                ? "bg-cyan-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {preview ? "Edit" : "Preview"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-500 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 px-4 py-2.5 rounded-lg text-sm ${
            message === "Saved!"
              ? "bg-green-900/30 text-green-400 border border-green-800/30"
              : "bg-red-900/30 text-red-400 border border-red-800/30"
          }`}
        >
          {message}
        </div>
      )}

      {preview ? (
        /* Preview mode */
        <div className="card p-6 prose max-w-none">
          <h1>{form.title || "Untitled"}</h1>
          <p className="text-zinc-500 text-sm">
            {form.date}
            {form.tags && ` · ${form.tags}`}
          </p>
          {form.excerpt && (
            <blockquote>{form.excerpt}</blockquote>
          )}
          <div
            className="mt-6 prose"
            dangerouslySetInnerHTML={{
              __html: form.content
                .replace(/\n/g, "<br>")
                .replace(/^### (.+)$/gm, "<h3>$1</h3>")
                .replace(/^## (.+)$/gm, "<h2>$1</h2>")
                .replace(/^# (.+)$/gm, "<h1>$1</h1>")
                .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.+?)\*/g, "<em>$1</em>")
                .replace(/`(.+?)`/g, "<code>$1</code>")
                .replace(
                  /^```(\w*)\n([\s\S]*?)```$/gm,
                  "<pre><code>$2</code></pre>"
                ),
            }}
          />
        </div>
      ) : (
        /* Edit mode */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: metadata */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Post title"
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Slug
                </label>
                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="auto-generated"
                  disabled={isEditing}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition-colors text-sm disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Tags
              </label>
              <input
                type="text"
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="tech, life, design"
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Excerpt
              </label>
              <input
                type="text"
                name="excerpt"
                value={form.excerpt}
                onChange={handleChange}
                placeholder="A short description..."
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
              />
            </div>
          </div>

          {/* Right: content */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Content (Markdown)
            </label>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="## Start writing..."
              rows={28}
              className="w-full px-3 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition-colors text-sm font-mono leading-relaxed resize-y"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-6 py-12">
          <p className="text-zinc-500 text-sm">Loading...</p>
        </div>
      }
    >
      <EditPageInner />
    </Suspense>
  );
}
