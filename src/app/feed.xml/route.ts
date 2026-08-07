import { getAllPosts } from "@/lib/blog";
import { siteConfig } from "@/site.config";

// Emitted to a static /feed.xml at build time (no server under `output: export`).
export const dynamic = "force-static";

/** Minimal XML text escaping for values placed inside elements/CDATA-free text. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET(): Response {
  const posts = getAllPosts();
  const base = siteConfig.canonicalUrl;
  const self = `${base}/feed.xml`;

  const items = posts
    .map((post) => {
      const url = `${base}/blog/${post.slug}`;
      // Noon UTC keeps the date stable regardless of the build machine's zone.
      const pubDate = new Date(`${post.date}T12:00:00Z`).toUTCString();
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <description>${escapeXml(post.description)}</description>`,
        ...(post.tags ?? []).map(
          (tag) => `      <category>${escapeXml(tag)}</category>`,
        ),
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)} — Blog</title>
    <link>${base}/blog</link>
    <description>${escapeXml(siteConfig.tagline)}</description>
    <language>${siteConfig.defaultLocale}</language>
    <atom:link href="${self}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
