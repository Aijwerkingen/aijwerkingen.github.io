import type { MetadataRoute } from "next";
import { siteConfig } from "@/site.config";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  // Derives from siteConfig.indexable so this can never drift from the
  // per-page `noindex` meta tag (spec §5.1, ADR-008; PENDING-FIXES.md P1-5).
  if (!siteConfig.indexable) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  // AI-crawler policy (D5, spec §11.6) is not yet decided - leave the
  // default allow-all here rather than inventing a policy.
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteConfig.canonicalUrl}/sitemap.xml`,
  };
}
