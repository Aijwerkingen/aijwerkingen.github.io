// site.config.ts — the ONLY place brand name, domain, and NAP are defined.
// Every SEO/AEO artifact (titles, meta, canonical, JSON-LD, sitemap, robots.txt,
// llms.txt) must derive from this file. See TECHNICAL_SPEC.md §5.1 (ADR-008).
//
// STATUS: placeholder identity + placeholder domain (D1, D9 — spec §22, both open).
// canonicalUrl points at the GitHub Pages deploy, which stays noindex (ADR-010)
// until a final domain is chosen. Swapping either value later is a one-file edit —
// see TECHNICAL_SPEC.md §0.1 / §5.2 and the "▶ RESUME HERE" block in CHANGELOG.md.

export const siteConfig = {
  name: "AIjwerkingen",
  shortName: "AIjwerkingen",
  canonicalUrl: "https://aijwerkingen.github.io",
  defaultLocale: "en",
  locales: ["en"],
  logo: "", // TODO: D11 — no logo asset exists yet; don't emit `logo` into JSON-LD until it does.
  organization: {
    legalName: "AIjwerkingen (placeholder legal name — TODO)",
    email: "contact@example.org",
    phone: "",
    address: {
      street: "",
      locality: "",
      region: "",
      postalCode: "",
      country: "NL",
    },
    sameAs: [] as string[],
  },
  // ADR-010: this deploy is a public but non-indexed staging tier until the
  // final domain is verified in Search Console (spec §5.2, AC-DOMAIN).
  indexable: false,
} as const;

export type SiteConfig = typeof siteConfig;
