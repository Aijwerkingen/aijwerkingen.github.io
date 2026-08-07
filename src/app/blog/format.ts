import { siteConfig } from "@/site.config";

/**
 * Human date for display, derived from the site locale so it stays consistent
 * with the rest of the site. Parsed as UTC noon to avoid an off-by-one day when
 * the build machine's timezone is behind UTC.
 */
export function formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString(siteConfig.defaultLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
