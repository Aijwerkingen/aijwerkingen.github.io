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

const { header, body, rightsHeading, rights, tail } = content.privacy;

// ─────────────────────────────────────────────────────────────────────────────
// UNAPPROVED DRAFT - spec §13, decisions D3/D4 (both open, owner: DPO/legal).
//
// This is a starting point for the DPO to redline, not a notice in force. It is
// gated by `siteConfig.legal.approved`: while false the page shows a draft
// banner and is forced noindex.
//
// Every TODO(D4) below marks a specific that was WRITTEN AS A PROPOSAL and that
// nobody has approved. They are the redline targets. Do not remove a TODO
// without the DPO's decision behind it, and do not flip `legal.approved` while
// any remain.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: content.meta.pages.privacy.title,
  description: content.meta.pages.privacy.description,
  alternates: { canonical: "/privacy" },
  robots: legalRobots,
};

export default function PrivacyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: content.meta.pages.privacy.title,
    description: content.meta.pages.privacy.description,
    url: `${siteConfig.canonicalUrl}/privacy`,
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

        {/* Split out so this heading can carry the #rights anchor linked above. */}
        <h2 id="rights">{rightsHeading}</h2>
        <Prose blocks={rights} />

        <Prose blocks={tail} />

        <LastReviewed />
      </DocBody>
    </>
  );
}
