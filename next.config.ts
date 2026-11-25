import type { NextConfig } from "next";

// The blog editor is staging-only. `NEXT_PUBLIC_BLOG_EDITOR` is set by
// .github/workflows/deploy.yml and by nothing else.
//
// The alias below is what actually keeps it out of production. A build-time
// flag alone is not enough: an ES import - static or dynamic - puts the module
// in the graph before any flag can be folded, so the editor and a ~524 KB
// Tiptap chunk were emitted into the production build even though nothing
// rendered them (tests recorded in docs/BLOG_EDITOR_PLAN.md, section 6.2).
// Aliasing the page's import to a no-op stub removes it at resolve time, which
// is the only point at which it can be removed.
const blogEditor = process.env.NEXT_PUBLIC_BLOG_EDITOR === "1";

const nextConfig: NextConfig = {
  // GitHub Pages serves static files only - no Node/SSR runtime available there.
  // aijwerkingen.github.io is a user/org Pages repo, so it deploys at the root
  // (no basePath needed, unlike project pages at <user>.github.io/<repo>/).
  output: "export",
  images: {
    unoptimized: true, // next/image's optimizer needs a server; static export has none.
  },
  turbopack: blogEditor
    ? undefined
    : {
        resolveAlias: {
          "@/admin/blog-editor/EditPostButton": "./src/admin/blog-editor/disabled.tsx",
        },
      },
};

export default nextConfig;
