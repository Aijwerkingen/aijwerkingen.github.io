import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/site.config";
import {
  DocBody,
  DocHeader,
  DraftNotice,
  LastReviewed,
  legalRobots,
} from "@/components/DocPage";

// ─────────────────────────────────────────────────────────────────────────────
// UNAPPROVED DRAFT — spec §13, decisions D3/D4 (both open, owner: DPO/legal).
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
  title: "Privacy notice",
  description:
    "What we collect when you report distress linked to an AI tool or social media platform, why, how long we keep it, and your rights.",
  alternates: { canonical: "/privacy" },
  robots: legalRobots,
};

export default function PrivacyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: metadata.title,
    description: metadata.description,
    url: `${siteConfig.canonicalUrl}/privacy`,
  };

  const controller = siteConfig.research.institution || siteConfig.name;
  const privacyContact =
    siteConfig.research.dpoEmail || siteConfig.organization.email;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <DocHeader
        eyebrow="Privacy"
        title="Privacy notice"
        intro="What we collect when you report, why we collect it, and what you can ask us to do with it."
      />

      <DocBody>
        <DraftNotice />

        <h2>Who is responsible</h2>
        {/* TODO(D4): the controller is named from research.institution and falls
            back to the brand name while that is empty. Confirm the actual
            controller — for a university study this is normally the institution
            rather than the platform, and it may be a joint controllership. */}
        <p>
          {controller} is the controller for the personal data described here.
          For anything in this notice, or to exercise the rights below, contact{" "}
          <a href={`mailto:${privacyContact}`}>{privacyContact}</a>.
        </p>

        <h2>What we collect</h2>
        <p>When you submit a report, we collect:</p>
        <ul>
          <li>
            what you tell us about how you felt, in your own words — this is the
            substance of the report;
          </li>
          <li>
            the tool, app, or platform involved, and roughly when it happened;
          </li>
          <li>
            any optional context you choose to add, such as your age band or
            whether you are reporting for yourself or someone you support;
          </li>
          <li>
            contact details, <strong>only</strong> if you choose to give them so
            we can ask follow-up questions.
          </li>
        </ul>
        <p>
          We do not ask for your name, and reporting does not require an
          account. Free-text answers are the point of this platform, so they may
          contain information about your health or state of mind. Under the
          GDPR that is special-category data (Art. 9), and it is treated as such
          throughout.
        </p>

        <h2>Why we collect it</h2>
        <p>
          To monitor for patterns of harm associated with conversational AI
          tools and social media, and to study them. Reports are analysed in
          aggregate. An individual report is not assessed as a clinical case and
          does not produce advice, a diagnosis, or a response to you.
        </p>

        <h2>Our lawful basis</h2>
        {/* TODO(D4): PROPOSED, NOT DECIDED. Art. 6(1)(e) + Art. 9(2)(j) is the
            natural fit for a university research instrument, but the choice is
            the DPO's, and 6(1)(a)/9(2)(a) explicit consent is the live
            alternative. The two produce materially different notices and
            different rights (e.g. withdrawal), so this section cannot be
            finalised until D4 closes. */}
        <p>
          We propose to process this data as a task carried out in the public
          interest (Art. 6(1)(e)), relying on the scientific-research condition
          in Art. 9(2)(j) for special-category data, subject to the safeguards
          in Art. 89(1) — including data minimisation and, wherever it does not
          defeat the research purpose, pseudonymisation.
        </p>

        <h2>Anonymity</h2>
        <p>
          Reporting is anonymous by default. Because we do not know who you are,
          we generally cannot connect a later request to a specific report — see{" "}
          <a href="#rights">your rights</a> for what that means in practice. If
          you include details that identify you inside a free-text answer, they
          are stored as part of the report.
        </p>

        <h2>Who else handles your data</h2>
        {/* TODO(D3): names Qualtrics as processor. Confirm against the actual
            institutional agreement: which tenant, which sub-processors, and
            whether the DPA covers special-category data. */}
        <p>
          The report form is provided by Qualtrics, which stores responses on our
          behalf as a data processor under a written agreement. We do not sell
          your data, and we do not share it for advertising.
        </p>

        <h2>Where your data is stored</h2>
        {/* TODO(D3): asserts EU storage and no third-country transfer. This is
            the INTENDED configuration, not a verified fact — the region depends
            on the Qualtrics tenant actually used, and sub-processors may involve
            transfers requiring Art. 46 safeguards. Verify before approval. */}
        <p>
          We intend for report data to be stored within the European Economic
          Area. Where any processor or sub-processor transfers data outside the
          EEA, we will rely on an adequacy decision or Standard Contractual
          Clauses, and will name those transfers here.
        </p>

        <h2>How long we keep reports</h2>
        {/* TODO(D4): THE RETENTION PERIOD BELOW IS AN INVENTED PLACEHOLDER.
            Nobody has decided it. Research retention is often set by the
            institution's research-data policy or the ethics approval, and may
            be considerably longer than this. This number must be replaced, not
            merely reviewed. */}
        <p>
          We propose to retain reports for five years from submission, after
          which they are deleted or fully anonymised. Aggregated results that
          cannot identify anyone may be kept indefinitely, including after
          publication.
        </p>

        <h2 id="rights">Your rights</h2>
        <p>Under the GDPR you can ask us to:</p>
        <ul>
          <li>confirm what personal data we hold about you, and give you a copy;</li>
          <li>correct it if it is wrong;</li>
          <li>erase it;</li>
          <li>restrict or object to how we use it;</li>
          <li>provide it in a portable form, where that right applies.</li>
        </ul>
        <p>
          Because reports are anonymous by default, we usually cannot identify
          which report is yours, and Art. 11 means we are not required to
          acquire more information purely to find it. If you want to be able to
          withdraw a report later, include contact details when you submit —
          otherwise we will likely be unable to act on a request about it.
        </p>
        <p>
          To make a request, contact{" "}
          <a href={`mailto:${privacyContact}`}>{privacyContact}</a>.
        </p>

        <h2>Automated decisions</h2>
        <p>
          We do not make automated decisions about you that produce legal or
          similarly significant effects, and we do not profile you for
          advertising.
        </p>

        <h2>Children</h2>
        {/* TODO(D-minors): NOT DECIDED. There is no minimum age, no
            age-assurance approach, and no parental-consent flow — yet this
            domain is expected to attract under-18 reporters (spec §13.1). This
            paragraph is a stand-in and is knowingly incomplete: it must be
            rewritten once D-minors closes, and the form changed to match. */}
        <p>
          This platform is expected to be used by people under 18. Our policy on
          a minimum age, on how age is established, and on parental consent
          where it is required is being finalised with our data protection
          officer, and this section will be replaced when it is.
        </p>

        <h2>Complaints</h2>
        <p>
          If you are unhappy with how we handle your data, please tell us first
          at <a href={`mailto:${privacyContact}`}>{privacyContact}</a>. You also
          have the right to complain to your national supervisory authority — in
          the Netherlands, the{" "}
          <a
            href="https://autoriteitpersoonsgegevens.nl"
            target="_blank"
            rel="noopener noreferrer"
          >
            Autoriteit Persoonsgegevens
          </a>
          .
        </p>

        <h2>Changes</h2>
        <p>
          If this notice changes materially, we will update it here and revise
          the review date. See also our <Link href="/terms">terms</Link>.
        </p>

        <LastReviewed />
      </DocBody>
    </>
  );
}
