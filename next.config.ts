import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  ...(isStaticExport && {
    output: "export",
    // Exclude admin and API from static export
    // They'll 404 on the public site, but work locally
  }),
};

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-mdx-frontmatter"],
  },
});

export default withMDX(nextConfig);
