import type { MetadataRoute } from "next";
import { siteConfig } from "@/site.config";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/faq", "/report"];
  return routes.map((path) => ({
    url: `${siteConfig.canonicalUrl}${path}`,
    lastModified: new Date(),
  }));
}
