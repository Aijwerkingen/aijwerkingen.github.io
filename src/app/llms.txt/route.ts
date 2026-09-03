import { getAllPosts } from "@/lib/blog";
import { siteConfig } from "@/site.config";
import { content } from "@/content.config";

// Emitted to a static /llms.txt at build time (no server under `output: export`).
// Like robots.ts / sitemap.ts, every value derives from site.config.ts, so the
// URLs, brand name, and page map can never drift from the rest of the site
// (spec §5.1, ADR-008). The blog list is generated from the same source as the
// sitemap and feed, so it can't reference a post that isn't in the build.
export const dynamic = "force-static";

// How many of the most recent posts to surface. The full set is always at
// /blog; this is a hand-hold for assistants, not a mirror of the archive.
const RECENT_POSTS = 10;

export function GET(): Response {
  const base = siteConfig.canonicalUrl;

  // Core, always-public pages — mirrors the always-listed routes in sitemap.ts.
  const corePages = content.llms.corePages;

  // Legal documents are draft/noindex until DPO sign-off (site.config
  // `legal.approved`), exactly as in sitemap.ts. Listing them here before
  // approval would point assistants at statements nobody has approved, so they
  // join the map on the same flag that lets them into the sitemap.
  const legalPages: Array<[string, string, string]> = siteConfig.legal.approved
    ? content.llms.legalPages
    : [];

  const link = ([path, label, note]: [string, string, string]) =>
    `- [${label}](${base}${path === "/" ? "/" : path}): ${note}`;

  const recent = getAllPosts()
    .slice(0, RECENT_POSTS)
    .map(
      (post) =>
        `- [${post.title}](${base}/blog/${post.slug}): ${post.description}`,
    );

  // The summary blurb: first line is prefixed with the brand name, the rest
  // continue it. Both name and prose come from config.
  const summary = content.llms.summary.map((line, i) =>
    i === 0 ? `> ${siteConfig.name} ${line}` : `> ${line}`,
  );

  const sections: string[] = [
    `# ${siteConfig.name}`,
    "",
    ...summary,
    "",
    "## Core pages",
    ...corePages.map(link),
  ];

  if (legalPages.length) {
    sections.push("", "## Trust & legal", ...legalPages.map(link));
  }

  if (recent.length) {
    sections.push("", "## Recent articles", ...recent);
  }

  sections.push(
    "",
    "## Key facts",
    ...content.llms.keyFacts.map((fact) => `- ${fact}`),
    "",
  );

  return new Response(sections.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
