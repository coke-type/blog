import type { MDXComponents } from "mdx/types";

export function useMDXComponents(): MDXComponents {
  return {
    // Most styling is handled by .prose classes in globals.css.
    // These overrides are for elements that need special treatment.
    h2: ({ children }) => (
      <h2 className="text-cyan-400">{children}</h2>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-cyan-400 underline decoration-cyan-500/30 underline-offset-[3px] hover:decoration-cyan-400 transition-colors"
      >
        {children}
      </a>
    ),
  };
}
