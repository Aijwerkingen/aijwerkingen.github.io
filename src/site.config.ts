// site.config.ts — the ONLY place brand name, domain, and NAP are defined.
// Every SEO/AEO artifact (titles, meta, canonical, JSON-LD, sitemap, robots.txt,
// llms.txt) must derive from this file. See TECHNICAL_SPEC.md §5.1 (ADR-008).
//
// STATUS: placeholder identity + placeholder domain (D1, D9 — spec §22, both open).
// canonicalUrl points at the GitHub Pages deploy, which stays noindex (ADR-010)
// until a final domain is chosen. Swapping either value later is a one-file edit —
// see TECHNICAL_SPEC.md §0.1 / §5.2 and the "▶ RESUME HERE" block in CHANGELOG.md.

/** Colour-way of the icon set. Only the accent colour differs; neutrals are shared. */
export const brandThemes = ["warm", "teal"] as const;
export type BrandTheme = (typeof brandThemes)[number];

export const brandThemeLabels: Record<BrandTheme, string> = {
  warm: "Warm",
  teal: "Teal",
};

type BrandVariant = {
  /** Directory name under `public/brand/<key>/<theme>/`. */
  key: string;
  name: string;
  /**
   * Registered legal entity, once one exists. Empty until then — consumers fall
   * back to `name` rather than print a placeholder. Never put a "TODO" string
   * here: this feeds the Organization JSON-LD, so anything written here is
   * published to crawlers.
   */
  legalName: string;
  tagline: string;
  /**
   * The lockup sets exactly one half of the wordmark in the accent colour and
   * the other in ink — `accent` says which half. Mirrors the supplied artwork.
   */
  wordmark: { lead: string; tail: string; accent: "lead" | "tail" };
};

// D1 is resolved in favour of the first entry (spec §22); the second is kept as a
// live alternative so the naming decision can still be previewed via the admin
// drawer and reversed by editing `defaultBrandKey` below.
export const brandVariants = {
  aijwerkingen: {
    key: "aijwerkingen",
    name: "AIjwerkingen",
    legalName: "", // TODO(D11/NAP): set once the operating entity is registered.
    tagline:
      "Report distress you felt during or after using AI tools or social media.",
    wordmark: { lead: "AI", tail: "jwerkingen", accent: "lead" },
  },
  adverseai: {
    key: "adverseai",
    name: "AdverseAI",
    legalName: "", // TODO(D11/NAP): set once the operating entity is registered.
    tagline:
      "Report distress you felt during or after using AI tools or social media.",
    wordmark: { lead: "Adverse", tail: "AI", accent: "tail" },
  },
} as const satisfies Record<string, BrandVariant>;

export type BrandKey = keyof typeof brandVariants;

/** Build-time identity. Everything server-rendered (metadata, JSON-LD) uses these. */
export const defaultBrandKey: BrandKey = "aijwerkingen";
export const defaultBrandTheme: BrandTheme = "warm";

const defaultBrand = brandVariants[defaultBrandKey];

/**
 * Asset paths are derived rather than written out, which keeps the brand-key
 * literal inside this file (ADR-008) and makes the 2×2 icon set addressable by
 * (key, theme). The files live under `public/brand/`, so they are copied
 * verbatim into the static export — no bundler or loader involved.
 */
export function brandAsset(
  key: BrandKey,
  theme: BrandTheme,
  file: string,
): string {
  return `/brand/${key}/${theme}/${file}`;
}

export const siteConfig = {
  name: defaultBrand.name,
  shortName: defaultBrand.name,
  tagline: defaultBrand.tagline,
  canonicalUrl: "https://aijwerkingen.github.io",
  defaultLocale: "en",
  locales: ["en"],
  // D11: an icon set now exists, so `logo` is a real asset rather than a TODO.
  logo: brandAsset(defaultBrandKey, defaultBrandTheme, "icon-mark.png"),
  // Dimensions are the artwork's real pixel size, which is not what the file
  // name suggests — OG consumers pre-allocate from these, so they must be true.
  ogImage: {
    url: brandAsset(defaultBrandKey, defaultBrandTheme, "opengraph-1200x630.png"),
    width: 1088,
    height: 632,
  },
  /** Favicon files with their actual dimensions (also not what the names imply). */
  favicons: [
    { file: "favicon-16.png", size: 36 },
    { file: "favicon-32.png", size: 68 },
    { file: "favicon-48.png", size: 100 },
  ],
  appleIcon: { file: "appicon-light-512.png", size: 320 },
  organization: {
    legalName: defaultBrand.legalName,
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
