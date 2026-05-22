import Link from "next/link";

export function Navbar() {
  return (
    <nav className="navbar">
      <div className="max-w-2xl mx-auto flex items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-zinc-100 hover:text-cyan-400 transition-colors"
        >
          ~/blog
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link
            href="/"
            className="font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Posts
          </Link>
          <Link
            href="/about"
            className="font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            About
          </Link>
        </div>
      </div>
    </nav>
  );
}
