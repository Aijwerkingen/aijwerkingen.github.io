import type { Metadata } from "next";
import { Nunito, Nunito_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import {
  brandAsset,
  defaultBrandKey,
  defaultBrandTheme,
  siteConfig,
} from "@/site.config";
import { brandPrePaintScript } from "@/brand/brand-state";
import { BrandProvider } from "@/brand/BrandProvider";
import { BrandLockup, BrandName } from "@/brand/BrandLockup";
import { AdminDrawer } from "@/admin/AdminDrawer";

// Matches the supplied lockup artwork: Nunito for the wordmark and headings,
// Nunito Sans for running text. next/font self-hosts both at build time, so no
// third-party request is made at runtime — which also keeps the CSP below free
// of a font-src exception.
const display = Nunito({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-brand-display",
  display: "swap",
});

const sans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-brand-sans",
  display: "swap",
});

const iconDir = (file: string) =>
  brandAsset(defaultBrandKey, defaultBrandTheme, file);

// Resolved at build time (static export), not in the browser — so it can't
// disagree with the server-rendered HTML. It does go stale until the next
// deploy, which is the usual trade for a site with no server runtime.
const buildYear = new Date().getFullYear();

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.canonicalUrl),
  title: {
    default: `${siteConfig.name} — Report distress from AI or social media`,
    template: `%s — ${siteConfig.name}`,
  },
  description:
    "Report distress you felt during or after using a conversational AI tool, app, or social media platform. Fast, confidential, and free.",
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
        alt: `${siteConfig.name} — ${siteConfig.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

const nav = [
  { href: "/", label: "Home" },
  { href: "/faq", label: "FAQ" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    // Falls back to the brand name until a legal entity is registered — a
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
  // X-Content-Type-Options remain unset regardless — those need a host
  // that can send headers (Phase 3+, PENDING-FIXES.md P2-1).
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "frame-src https://*.qualtrics.com",
    "connect-src 'self'",
  ].join("; ");

  return (
    // suppressHydrationWarning: the pre-paint script below stamps data-brand and
    // data-brand-theme onto this element before React hydrates.
    <html
      lang={siteConfig.defaultLocale}
      className={`h-full antialiased ${display.variable} ${sans.variable}`}
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
            Skip to content
          </a>

          <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
              <Link href="/" aria-label={`${siteConfig.name} — home`}>
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
                  <span className="hidden sm:inline">Report your experience</span>
                  <span className="sm:hidden">Report</span>
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
                </div>

                <nav aria-label="Footer">
                  <h2 className="eyebrow">Site</h2>
                  <ul className="mt-3 space-y-2 text-sm">
                    {[
                      ...nav,
                      { href: "/report", label: "Report your experience" },
                    ].map((item) => (
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

                <div>
                  <h2 className="eyebrow">Contact</h2>
                  <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                    <li>
                      <a
                        href={`mailto:${siteConfig.organization.email}`}
                        className="transition-colors hover:text-ink"
                      >
                        {siteConfig.organization.email}
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Crisis routing is the most consequential thing in the footer, so
                  it gets a bordered block rather than a line of small print.
                  Calm, not alarming (spec §7). */}
              <aside
                aria-labelledby="crisis-heading"
                className="notice mt-12 border-notice-line bg-notice-soft text-notice"
              >
                <h2 id="crisis-heading" className="font-semibold">
                  This is not a crisis or emergency service
                </h2>
                <p className="mt-1">
                  If you or someone else is in immediate danger, contact your
                  local emergency number.{" "}
                  {/* TODO(P0-5, D-crisis-lines): named, locale-specific crisis
                      lines (e.g. NL: 113 Zelfmoordpreventie) pending the
                      copy/legal owner's sign-off on which services to name. */}
                  In the Netherlands, you can also reach{" "}
                  <a
                    href="https://www.113.nl"
                    className="font-semibold underline underline-offset-4"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    113 Zelfmoordpreventie
                  </a>{" "}
                  (call 113 or 0800-0113) for support with suicidal thoughts or
                  crisis.
                </p>
              </aside>

              <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between">
                <p>
                  © {buildYear} <BrandName />
                </p>
              </div>
            </div>
          </footer>

          {/* TEMPORARY: the brand preview drawer's only entry point. Delete this
              line and src/admin/ to remove it entirely — see AdminDrawer.tsx. */}
          <AdminDrawer />
        </BrandProvider>
      </body>
    </html>
  );
}
