import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-cyan-400 transition-colors mb-8"
      >
        <span>&larr;</span> Back
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mb-8">
        About
      </h1>

      <div className="space-y-5 text-zinc-300 leading-relaxed">
        <p>
          Hey, welcome to my corner of the internet.
        </p>

        <p>
          This is where I write about things I&apos;m learning, building, and thinking about.
          No particular agenda — just a place to think out loud.
        </p>

        <p>
          Built with{" "}
          <span className="text-cyan-400 font-mono text-sm">Next.js</span>
          {" "}+{" "}
          <span className="text-cyan-400 font-mono text-sm">MDX</span>.
          Designed using principles from the{" "}
          <em>Designing Beautiful Websites</em> skill.
        </p>

        <div className="card p-5 mt-6">
          <h2 className="text-sm font-semibold text-zinc-200 mb-3">
            Contact
          </h2>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li>
              GitHub:{" "}
              <a href="#" className="text-cyan-400 hover:text-cyan-300">
                @yourname
              </a>
            </li>
            <li>
              Email:{" "}
              <a
                href="mailto:me@example.com"
                className="text-cyan-400 hover:text-cyan-300"
              >
                me@example.com
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
