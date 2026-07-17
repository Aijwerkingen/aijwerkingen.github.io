import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/site.config";
import { BrandName } from "@/brand/BrandLockup";
import {
  DocBody,
  DocHeader,
  DraftNotice,
  LastReviewed,
  legalRobots,
} from "@/components/DocPage";

// ─────────────────────────────────────────────────────────────────────────────
// UNAPPROVED DRAFT — for the legal owner to redline. Gated by
// `siteConfig.legal.approved` (draft banner + forced noindex while false).
// Each TODO marks a proposal nobody has approved. See /privacy for the same
// pattern and CHANGELOG's "Legal sign-off" blocking item.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Terms & disclaimer",
  description:
    "The terms on which this reporting platform is offered, including what it is not: a crisis service, a source of medical advice, or a complaints channel.",
  alternates: { canonical: "/terms" },
  robots: legalRobots,
};

export default function TermsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: metadata.title,
    description: metadata.description,
    url: `${siteConfig.canonicalUrl}/terms`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <DocHeader
        eyebrow="Terms"
        title="Terms & disclaimer"
        intro="What this platform offers, what it does not, and the basis on which you use it."
      />

      <DocBody>
        <DraftNotice />

        <h2>Not a crisis or emergency service</h2>
        <p>
          This is the most important term here. <BrandName /> does not provide
          emergency help. Reports are not read in real time and nobody is
          monitoring them for signs that you are at risk. If you or someone else
          is in immediate danger, contact your local emergency number. In the
          Netherlands you can also reach{" "}
          <a href="https://www.113.nl" target="_blank" rel="noopener noreferrer">
            113 Zelfmoordpreventie
          </a>{" "}
          (call 113 or 0800-0113).
        </p>

        <h2>Not medical advice</h2>
        <p>
          Nothing on this site is medical, psychological, or legal advice, and
          submitting a report does not create a clinical relationship of any
          kind. Reports are analysed in aggregate for research; you will not
          receive an assessment of your own situation. If you need advice about
          your health, speak to a qualified professional.
        </p>

        <h2>What you submit</h2>
        <p>By submitting a report, you confirm that:</p>
        <ul>
          <li>what you describe is your own account, given in good faith;</li>
          <li>
            you are not submitting anyone else&apos;s identifying details
            unnecessarily — describe what happened without naming other people
            where you can;
          </li>
          <li>
            you understand reporting is anonymous by default and that we
            therefore may not be able to find or withdraw your report later (see
            the <Link href="/privacy">privacy notice</Link>).
          </li>
        </ul>

        <h2>Reports that name companies or individuals</h2>
        {/* TODO(D-third-party): NOT DECIDED. Reports will name real products and
            possibly identifiable people, which raises Art. 14 (informing a
            non-reporting data subject) plus moderation and retention questions
            with no policy behind them (spec §13.1/§13.10). This paragraph is a
            stand-in and deliberately promises nothing specific. */}
        <p>
          Reports may name products, companies, or people. We do not pass your
          report to the company involved, and we do not publish reports as
          submitted. Our policy for handling reports that identify third parties
          — including how they are moderated and how long they are kept — is
          being finalised, and this section will be replaced when it is.
        </p>

        <h2>Availability</h2>
        <p>
          The platform is offered as it is. We do not guarantee that it will be
          available without interruption, and we may change or withdraw it.
        </p>

        <h2>Liability</h2>
        {/* TODO(legal sign-off): a liability clause is jurisdiction-specific and
            interacts with the institution's own terms and insurance. This is a
            neutral placeholder written to avoid asserting an exclusion that has
            not been drafted by a lawyer. */}
        <p>
          Nothing in these terms excludes liability where it cannot lawfully be
          excluded. The scope of any other limitation is being finalised with
          our legal owner.
        </p>

        <h2>Governing law</h2>
        {/* TODO(legal sign-off): proposed as Dutch law on the basis of the NL
            context elsewhere in the config (organization.address.country). Must
            be confirmed against the operating entity, once one is named. */}
        <p>
          We propose that these terms are governed by Dutch law, subject to
          confirmation once the operating entity is registered.
        </p>

        <h2>Changes</h2>
        <p>
          If these terms change materially, we will update them here and revise
          the review date.
        </p>

        <LastReviewed />
      </DocBody>
    </>
  );
}
