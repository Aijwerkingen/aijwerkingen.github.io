import type { Metadata } from "next";
import { siteConfig } from "@/site.config";
import {
  DocBody,
  DocHeader,
  DraftNotice,
  LastReviewed,
  legalRobots,
} from "@/components/DocPage";

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
  title: "Accessibility statement",
  description:
    "How accessible this platform is, the standard we aim to meet, the limitations we know about, and how to report a barrier.",
  alternates: { canonical: "/accessibility" },
  robots: legalRobots,
};

export default function AccessibilityPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: metadata.title,
    description: metadata.description,
    url: `${siteConfig.canonicalUrl}/accessibility`,
  };

  const contact = siteConfig.research.dpoEmail || siteConfig.organization.email;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <DocHeader
        eyebrow="Accessibility"
        title="Accessibility statement"
        intro="We want anyone to be able to report, whatever they use to browse. Here is where we stand and what we know is not yet good enough."
      />

      <DocBody>
        <DraftNotice />

        <h2>The standard we aim for</h2>
        {/* TODO(a11y audit): states an AIM, not a conformance claim, which is
            the only honest wording before an audit. Do not upgrade this to
            "conforms" / "partially conforms" without an actual assessment —
            that phrasing is defined by the standard and is legally meaningful
            for a public-sector or health body. */}
        <p>
          We aim to meet{" "}
          <a
            href="https://www.w3.org/TR/WCAG22/"
            target="_blank"
            rel="noopener noreferrer"
          >
            WCAG 2.2 level AA
          </a>
          . The site has been built against that target: it is keyboard
          navigable throughout, uses visible focus indicators, respects
          reduced-motion preferences, and its text and interface colours were
          chosen to meet AA contrast ratios.
        </p>

        <h2>Current status</h2>
        {/* TODO(a11y audit): no formal audit has been carried out - neither
            automated nor with assistive-technology users. Until one is, this
            page cannot make a conformance claim, and this paragraph must stay.
            Phase 1's acceptance gate requires the automated pass at minimum. */}
        <p>
          This statement has not yet been backed by a formal accessibility
          audit. We have not completed an independent assessment or testing with
          people who use assistive technology, so we do not claim conformance —
          only that AA is what we are building to. That assessment is planned,
          and this section will be replaced by its result.
        </p>

        <h2>Known limitations</h2>
        <p>We are aware of the following:</p>
        <ul>
          <li>
            <strong>The report form.</strong> The form itself is provided and
            rendered by a third party (Qualtrics) inside an embedded frame. Its
            accessibility is largely outside our control and has not been
            audited by us. If the embedded form is unusable for you, the report
            page offers a link to open it in a full browser tab, which some
            people find works better.
          </li>
          <li>
            <strong>No audit result.</strong> As above - until an assessment is
            done, there may be barriers we simply do not know about yet.
          </li>
        </ul>

        <h2>If something blocks you</h2>
        <p>
          Please tell us - a specific report of what failed is the fastest route
          to fixing it. Email{" "}
          <a href={`mailto:${contact}`}>{contact}</a> and, if you can, say what
          page you were on, what you were trying to do, and what you use to
          browse.
        </p>
        <p>
          If you are not satisfied with how we respond, you can raise it with
          your national supervisory body for digital accessibility.
        </p>

        <LastReviewed />
      </DocBody>
    </>
  );
}
