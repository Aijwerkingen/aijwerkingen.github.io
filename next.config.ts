import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages serves static files only — no Node/SSR runtime available there.
  // aijwerkingen.github.io is a user/org Pages repo, so it deploys at the root
  // (no basePath needed, unlike project pages at <user>.github.io/<repo>/).
  output: "export",
  images: {
    unoptimized: true, // next/image's optimizer needs a server; static export has none.
  },
};

export default nextConfig;
