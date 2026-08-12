import { getAllPosts } from "@/lib/blog";
import { siteConfig } from "@/site.config";

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
  const corePages: Array<[string, string, string]> = [
    ["/", "Home", "what the service is and how to report an experience."],
    ["/report", "Report a side effect", "the reporting form — the main action."],
    ["/how-it-works", "How reporting works", "step-by-step of what happens to a report."],
    ["/about", "About us", "who we are, our mission, and governance."],
    ["/faq", "FAQ", "common questions with direct answers."],
    ["/blog", "Blog", "Articles, in the public interest, on distress linked to AI tools and social media, and what the reports reveal."],
    ["/helplines", "Crisis helplines", "immediate support lines — this site is not itself a crisis service."],
    ["/contact", "Contact", "how to reach us (not for emergencies)."],
  ];

  // Legal documents are draft/noindex until DPO sign-off (site.config
  // `legal.approved`), exactly as in sitemap.ts. Listing them here before
  // approval would point assistants at statements nobody has approved, so they
  // join the map on the same flag that lets them into the sitemap.
  const legalPages: Array<[string, string, string]> = siteConfig.legal.approved
    ? [
      ["/privacy", "Privacy statement", "how personal and health data is handled (GDPR)."],
      ["/accessibility", "Accessibility statement", "WCAG 2.2 AA conformance."],
      ["/terms", "Terms & disclaimer", "not a crisis service; emergency guidance."],
    ]
    : [];

  const link = ([path, label, note]: [string, string, string]) =>
    `- [${label}](${base}${path === "/" ? "/" : path}): ${note}`;

  const recent = getAllPosts()
    .slice(0, RECENT_POSTS)
    .map(
      (post) =>
        `- [${post.title}](${base}/blog/${post.slug}): ${post.description}`,
    );

  const sections: string[] = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.name} is a public service for reporting perceived adverse`,
    "> effects of conversational AI tools and digital/social media. Anyone",
    "> affected — and parents, carers, and professionals supporting someone",
    "> else — can submit reports to help identify patterns of harm. This is not",
    "> a crisis or emergency service; in an emergency, contact your local",
    "> emergency number.",
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
    "- Purpose: collect perceived adverse-effect reports about conversational AI tools and digital/social media platforms, from the public and professionals.",
    "- Audience: people affected, plus the parents, carers, and professionals supporting them.",
    "- Reports can be submitted anonymously.",
    "- Not a diagnosis, treatment, crisis, or moderation-enforcement service.",
    "",
  );

  return new Response(sections.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
