import type { Metadata } from "next";
import {
  Maven_Pro,
  Noto_Sans,
  Nunito,
  Nunito_Sans,
  Open_Sans,
  Source_Sans_3,
  Source_Serif_4,
} from "next/font/google";
import Link from "next/link";
import "./globals.css";
import {
  brandAsset,
  defaultBrandKey,
  defaultBrandMode,
  defaultBrandTheme,
  siteConfig,
} from "@/site.config";
import { brandPrePaintScript } from "@/brand/brand-state";
import { BrandProvider } from "@/brand/BrandProvider";
import { BrandLockup, BrandName } from "@/brand/BrandLockup";
import { AdminDrawer } from "@/admin/AdminDrawer";
import { brandPanelEnabled } from "@/admin/panel-enabled";
import { CrisisHelpline } from "@/components/CrisisHelpline";
import { content } from "@/content.config";

// Default typeface pair, used by production: Maven Pro for the wordmark and
// headings, Open Sans for running text. next/font self-hosts both at build time,
// so no third-party request is made at runtime - which also keeps the CSP below
// free of a font-src exception.
const display = Maven_Pro({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-brand-display",
  display: "swap",
});

const sans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-brand-sans",
  display: "swap",
});

// Alternative typefaces for the brand preview panel's Font picker. Self-hosted
// like the default; `preload: false` means a browser only fetches a family once
// html[data-font] actually selects it (rules in globals.css) - so on production,
// where nothing ever selects one, they cost no download.
const optNunito = Nunito({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-opt-nunito",
  display: "swap",
  preload: false,
});
const optNunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-opt-nunito-sans",
  display: "swap",
  preload: false,
});
const optSourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-opt-source-serif",
  display: "swap",
  preload: false,
});
const optSourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-opt-source-sans",
  display: "swap",
  preload: false,
});
const optNoto = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-opt-noto",
  display: "swap",
  preload: false,
});
const optionFontVars = [
  optNunito,
  optNunitoSans,
  optSourceSerif,
  optSourceSans,
  optNoto,
]
  .map((f) => f.variable)
  .join(" ");

const iconDir = (file: string) =>
  brandAsset(defaultBrandKey, defaultBrandTheme, file);

// Resolved at build time (static export), not in the browser - so it can't
// disagree with the server-rendered HTML. It does go stale until the next
// deploy, which is the usual trade for a site with no server runtime.
const buildYear = new Date().getFullYear();

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.canonicalUrl),
  title: {
    default: `${siteConfig.name} - ${content.meta.descriptor}.`,
    template: `%s - ${siteConfig.name}`,
  },
  description: content.meta.defaultDescription,
  alternates: {
    canonical: "/",
  },
  robots: {
    // ADR-010: this deploy stays noindex until the final domain is chosen
    // and verified in Search Console (spec §5.2, AC-DOMAIN).
    index: siteConfig.indexable,
    follow: siteConfig.indexable,
  },
  icons: {
    icon: siteConfig.favicons.map(({ file, size }) => ({
      url: iconDir(file),
      sizes: `${size}x${size}`,
      type: "image/png",
    })),
    apple: [
      {
        url: iconDir(siteConfig.appleIcon.file),
        sizes: `${siteConfig.appleIcon.size}x${siteConfig.appleIcon.size}`,
        type: "image/png",
      },
    ],
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    url: siteConfig.canonicalUrl,
    locale: siteConfig.defaultLocale,
    images: [
      {
        url: siteConfig.ogImage.url,
        width: siteConfig.ogImage.width,
        height: siteConfig.ogImage.height,
        alt: `${siteConfig.name} - ${content.meta.descriptor}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

// Nav and footer copy come from content.config.ts (single source for copy).
const nav = content.nav;
const footerNav = content.footerNav;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    // Falls back to the brand name until a legal entity is registered - a
    // placeholder here would be published to crawlers (spec §5.1, NAP).
    name: siteConfig.organization.legalName || siteConfig.name,
    url: siteConfig.canonicalUrl,
    logo: new URL(siteConfig.logo, siteConfig.canonicalUrl).toString(),
    email: siteConfig.organization.email || undefined,
    sameAs: siteConfig.organization.sameAs,
  };
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.canonicalUrl,
  };

  // Interim CSP via <meta>, ADR-011: GitHub Pages can't set response
  // headers under static export, so frame-ancestors, HSTS, and
  // X-Content-Type-Options remain unset regardless - those need a host
  // that can send headers (Phase 3+, PENDING-FIXES.md P2-1).
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "connect-src 'self' https://ipapi.co",
    // Allow embedding the Qualtrics survey iframe on /report. Wildcard (not the
    // exact instance host) keeps the specific survey origin out of the static
    // bundle, consistent with the report-access edge gate. See
    // qualtrics-integration.md B2.
    "frame-src https://*.qualtrics.com",
  ].join("; ");

  return (
    // suppressHydrationWarning: the pre-paint script below stamps data-brand and
    // data-brand-theme onto this element before React hydrates.
    <html
      lang={siteConfig.defaultLocale}
      data-mode={defaultBrandMode}
      className={`h-full antialiased ${display.variable} ${sans.variable} ${optionFontVars}`}
      suppressHydrationWarning
    >
      <head>
        <meta httpEquiv="Content-Security-Policy" content={csp} />
        <script dangerouslySetInnerHTML={{ __html: brandPrePaintScript() }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([orgJsonLd, websiteJsonLd]),
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-surface text-ink">
        <BrandProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3
              focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2
              focus:text-sm focus:font-semibold focus:text-white"
          >
            {content.header.skipToContent}
          </a>

          <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
              <Link href="/" aria-label={`${siteConfig.name} - home`}>
                <BrandLockup size={34} wordmarkClassName="text-lg sm:text-xl" />
              </Link>

              <nav className="flex items-center gap-5 text-sm">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="hidden font-semibold text-ink-soft transition-colors hover:text-ink sm:inline"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link href="/report" className="btn-primary btn-sm">
                  <span className="hidden sm:inline">
                    {content.header.reportCta}
                  </span>
                  <span className="sm:hidden">{content.header.reportCtaShort}</span>
                </Link>
              </nav>
            </div>
          </header>

          <main id="main" className="flex-1">
            {children}
          </main>

          <footer className="border-t border-line bg-canvas">
            <div className="mx-auto max-w-5xl px-4 py-14">
              <div className="grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr]">
                <div>
                  <BrandLockup size={32} wordmarkClassName="text-lg" />
                  <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
                    {siteConfig.tagline}
                  </p>
                  {/* Institutional provenance - the credibility signal for a
                      research instrument. Renders nothing until site.config's
                      `research` block is filled in (see ProvenanceList). */}
                  <FooterProvenance />
                </div>

                {Object.entries(footerNav).map(([heading, items]) => (
                  <nav key={heading} aria-label={heading}>
                    <h2 className="eyebrow">{heading}</h2>
                    <ul className="mt-3 space-y-2 text-sm">
                      {items.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className="text-ink-soft transition-colors hover:text-ink"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                ))}
              </div>

              {/* Crisis routing is the most consequential thing in the footer, so
                  it gets a bordered block rather than a line of small print.
                  Calm, not alarming (spec §7). */}
              <aside
                aria-labelledby="crisis-heading"
                className="notice mt-12 border-notice-line bg-notice-soft text-notice"
              >
                <CrisisHelpline variant="footer" />
              </aside>

              <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between">
                <p>
                  © {buildYear} <BrandName />
                </p>
              </div>
            </div>
          </footer>

          {/* Brand preview drawer's only entry point, and staging-only: the
              staging deploy sets NEXT_PUBLIC_BRAND_PANEL=1, which production's
              build does not, so on aiimpactregistry.org this whole panel is
              compiled out. Same mechanism as the /report gate. See
              src/admin/panel-enabled.ts. */}
          {brandPanelEnabled && <AdminDrawer />}
        </BrandProvider>
      </body>
    </html>
  );
}

/**
 * Compact institutional attribution for the footer.
 *
 * Absent entirely until `research.institution` is set in site.config.ts - an
 * empty slot renders nothing rather than a placeholder, so this is safe to ship
 * before the formal details arrive (same rule as `legalName`).
 */
function FooterProvenance() {
  const { institution, department, institutionUrl } = siteConfig.research;
  if (!institution) return null;

  const affiliation = department ? `${department}, ${institution}` : institution;

  return (
    <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
      {content.footerProvenanceLead}
      {institutionUrl ? (
        <a
          href={institutionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
        >
          {affiliation}
        </a>
      ) : (
        <span className="font-semibold text-ink">{affiliation}</span>
      )}
      .
    </p>
  );
}
