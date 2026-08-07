import type { MetadataRoute } from "next";
import { siteConfig } from "@/site.config";
import { getAllPosts, getAllTagSlugs } from "@/lib/blog";

export const dynamic = "force-static";

// Public pages, always listed.
const routes = ["", "/about", "/how-it-works", "/faq", "/report", "/contact", "/helplines", "/blog"];

// The legal documents are forced `noindex` until the DPO/legal owner signs off
// (site.config `legal.approved`), so listing them here would ask crawlers to
// index pages that refuse to be indexed. They join the sitemap on approval —
// driven by the same flag, so the two can't drift apart.
const legalRoutes = ["/privacy", "/terms", "/accessibility"];

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = siteConfig.legal.approved ? [...routes, ...legalRoutes] : routes;

  const staticEntries: MetadataRoute.Sitemap = paths.map((path) => ({
    url: `${siteConfig.canonicalUrl}${path}`,
    lastModified: new Date(),
  }));

  // One entry per published post. `getAllPosts` already drops drafts, so the
  // sitemap can never list a page that isn't in the build. `lastModified` uses
  // the post's own `updated`/`date` rather than build time, so crawlers see a
  // truthful change signal.
  const postEntries: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${siteConfig.canonicalUrl}/blog/${post.slug}`,
    lastModified: new Date(`${post.updated ?? post.date}T12:00:00Z`),
  }));

  // Tag hubs. Derived from the same published posts, so they can't list a tag
  // that no live post uses.
  const tagEntries: MetadataRoute.Sitemap = getAllTagSlugs().map(({ slug }) => ({
    url: `${siteConfig.canonicalUrl}/blog/tags/${slug}`,
    lastModified: new Date(),
  }));

  return [...staticEntries, ...postEntries, ...tagEntries];
}
