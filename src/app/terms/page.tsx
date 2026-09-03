import type { Metadata } from "next";
import { siteConfig } from "@/site.config";
import { content } from "@/content.config";
import { Prose } from "@/content/RichText";
import {
  DocBody,
  DocHeader,
  DraftNotice,
  LastReviewed,
  legalRobots,
} from "@/components/DocPage";

const { header, body } = content.terms;

// ─────────────────────────────────────────────────────────────────────────────
// UNAPPROVED DRAFT - for the legal owner to redline. Gated by
// `siteConfig.legal.approved` (draft banner + forced noindex while false).
// Each TODO marks a proposal nobody has approved. See /privacy for the same
// pattern and CHANGELOG's "Legal sign-off" blocking item.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: content.meta.pages.terms.title,
  description: content.meta.pages.terms.description,
  alternates: { canonical: "/terms" },
  robots: legalRobots,
};

export default function TermsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: content.meta.pages.terms.title,
    description: content.meta.pages.terms.description,
    url: `${siteConfig.canonicalUrl}/terms`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <DocHeader
        eyebrow={header.eyebrow}
        title={header.title}
        intro={header.intro}
      />

      <DocBody>
        <DraftNotice />
        <Prose blocks={body} />
        <LastReviewed />
      </DocBody>
    </>
  );
}
