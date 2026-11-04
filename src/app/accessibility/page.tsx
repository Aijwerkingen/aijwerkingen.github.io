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

const { header, body } = content.accessibility;

// ─────────────────────────────────────────────────────────────────────────────
// UNAPPROVED DRAFT - gated by `siteConfig.legal.approved` (draft banner +
// forced noindex while false).
//
// Unlike /privacy and /terms, the blocker here is not a lawyer - it is that an
// accessibility statement must report the result of an actual audit, and no
// audit has been run. A conformance claim is a factual claim; the TODOs below
// mark where one is owed. See spec §20 (Phase 1 gate: WCAG AA automated pass).
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: content.meta.pages.accessibility.title,
  description: content.meta.pages.accessibility.description,
  alternates: { canonical: "/accessibility" },
  robots: legalRobots,
};

export default function AccessibilityPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: content.meta.pages.accessibility.title,
    description: content.meta.pages.accessibility.description,
    url: `${siteConfig.canonicalUrl}/accessibility`,
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
