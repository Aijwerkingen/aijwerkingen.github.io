import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.canonicalUrl),
  title: {
    default: `${siteConfig.name} — Report a side effect`,
    template: `%s — ${siteConfig.name}`,
  },
  description:
    "Report a suspected side effect from a medicine or vaccine. Fast, confidential, and free.",
  robots: {
    // ADR-010: this deploy stays noindex until the final domain is chosen
    // and verified in Search Console (spec §5.2, AC-DOMAIN).
    index: siteConfig.indexable,
    follow: siteConfig.indexable,
  },
};

const nav = [
  { href: "/", label: "Home" },
  { href: "/faq", label: "FAQ" },
  { href: "/report", label: "Report a side effect" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.organization.legalName,
    url: siteConfig.canonicalUrl,
    email: siteConfig.organization.email || undefined,
    sameAs: siteConfig.organization.sameAs,
  };
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.canonicalUrl,
  };

  return (
    <html lang={siteConfig.defaultLocale} className="h-full antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([orgJsonLd, websiteJsonLd]),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-slate-900">
        <header className="border-b border-slate-200">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              {siteConfig.name}
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    item.href === "/report"
                      ? "rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
                      : "text-slate-600 hover:text-slate-900"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-slate-600">
            <p className="font-medium text-slate-900">
              {siteConfig.organization.legalName}
            </p>
            <p className="mt-1">
              This is not a medical-advice service. In an emergency, contact
              your local emergency number.
            </p>
            <p className="mt-4 text-xs text-slate-400">
              Placeholder deployment — not indexed by search engines.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
