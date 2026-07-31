import type { MetadataRoute } from "next";
import { siteConfig } from "@/site.config";

export const dynamic = "force-static";

// Public pages, always listed.
const routes = ["", "/about", "/how-it-works", "/faq", "/report", "/contact", "/helplines"];

// The legal documents are forced `noindex` until the DPO/legal owner signs off
// (site.config `legal.approved`), so listing them here would ask crawlers to
// index pages that refuse to be indexed. They join the sitemap on approval —
// driven by the same flag, so the two can't drift apart.
const legalRoutes = ["/privacy", "/terms", "/accessibility"];

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = siteConfig.legal.approved ? [...routes, ...legalRoutes] : routes;

  return paths.map((path) => ({
    url: `${siteConfig.canonicalUrl}${path}`,
    lastModified: new Date(),
  }));
}
