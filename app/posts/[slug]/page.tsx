import { getAllPosts, getPostBySlug, apiGetAllPosts, apiGetPostContentHtml } from "@/lib/posts";
import { notFound } from "next/navigation";
import Link from "next/link";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Try filesystem meta first, then API
  let post = getPostBySlug(slug);
  if (!post) {
    const all = await apiGetAllPosts();
    post = all.find((p) => p.slug === slug) || null;
  }
  if (!post) notFound();

  const formattedDate = new Date(post.date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Check if MDX file exists (build-time post)
  const mdxPath = path.join(process.cwd(), "content/posts", `${slug}.mdx`);
  const hasMdx = fs.existsSync(mdxPath);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-cyan-400 transition-colors mb-8"
      >
        <span>&larr;</span> Back
      </Link>

      <header className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mb-3">
          {post.title}
        </h1>
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <time dateTime={post.date}>{formattedDate}</time>
          {post.tags.length > 0 && (
            <div className="flex gap-1.5">
              {post.tags.map((tag) => (
                <span key={tag} className="tag-pill text-xs cursor-default">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <article className="prose">
        {hasMdx ? (
          // Build-time MDX import
          <MdxContent slug={slug} />
        ) : (
          // Runtime: render markdown via API
          <RuntimeContent slug={slug} />
        )}
      </article>

      <hr className="mt-12 mb-8" />

      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors"
      >
        &larr; All posts
      </Link>
    </div>
  );
}

async function MdxContent({ slug }: { slug: string }) {
  const { default: Content } = await import(`@/content/posts/${slug}.mdx`);
  return <Content />;
}

async function RuntimeContent({ slug }: { slug: string }) {
  const html = await apiGetPostContentHtml(slug);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
