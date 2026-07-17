import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/site.config";
import { BrandName } from "@/brand/BrandLockup";
import { DocBody, DocHeader, ProvenanceList } from "@/components/DocPage";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who is behind this reporting platform, how reports are used, and the research governance it operates under.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  // Spec §5 page table: /about emits AboutPage. Organization already ships from
  // the root layout, so it is not repeated here.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `About ${siteConfig.name}`,
    description: metadata.description,
    url: `${siteConfig.canonicalUrl}/about`,
  };

  const hasProvenance = Boolean(
    siteConfig.research.institution ||
      siteConfig.research.department ||
      siteConfig.research.principalInvestigator ||
      siteConfig.research.ethicsApproval,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <DocHeader
        eyebrow="About"
        title="Why this exists"
        intro={
          <>
            <BrandName /> collects reports of distress that people notice during
            or after using conversational AI tools and social media, so that
            patterns of harm can be studied rather than guessed at.
          </>
        }
      />

      <DocBody>
        <h2>The problem</h2>
        <p>
          When a medicine causes an unexpected effect, there is somewhere to
          report it, and those reports accumulate into evidence. When a
          conversational AI tool or a social media platform leaves someone
          feeling worse — more anxious, more isolated, worse about their body,
          unable to stop — there is usually nowhere for that to go. It stays a
          private experience, and nothing aggregates.
        </p>
        <p>
          That absence is the gap this platform addresses. Not by treating
          digital tools as if they were drugs, but by taking seriously that
          distress linked to their use is real, is reportable, and becomes
          legible once enough people describe it.
        </p>

        <h2>What we do with reports</h2>
        <p>
          Reports are reviewed as part of ongoing monitoring for patterns across
          tools and platforms. A single report is not a diagnosis and is never
          treated as one — it is one account among many. What makes it valuable
          is the aggregate: recurring descriptions, from unrelated people, of
          the same kind of harm around the same kind of product.
        </p>
        <p>
          We collect as little as possible to do that. Reporting is anonymous by
          default, needs no account, and asks for no name. Contact details are
          optional and only used if you invite follow-up.
        </p>

        <h2>What this is not</h2>
        <p>
          This is not a crisis or emergency service, and reports are not read in
          real time. If you or someone else is in immediate danger, contact your
          local emergency number. In the Netherlands you can also reach{" "}
          <a href="https://www.113.nl" target="_blank" rel="noopener noreferrer">
            113 Zelfmoordpreventie
          </a>{" "}
          (call 113 or 0800-0113).
        </p>
        <p>
          It is also not a support service, a complaints channel to the
          companies involved, or a route to individual advice. Reporting here
          will not get you a clinical opinion about your own situation — if you
          need one, speak to a health professional.
        </p>

        {/* Renders only once site.config.ts `research` is filled in. Until the
            formal details and authorisations land, this section is absent
            rather than showing placeholders. */}
        {hasProvenance && (
          <>
            <h2>Governance</h2>
            <p>
              This platform is operated as a research instrument, under the
              following accountability:
            </p>
            <ProvenanceList className="mt-5 rounded-xl border border-line bg-canvas p-5" />
          </>
        )}

        <h2>Questions</h2>
        <p>
          The <Link href="/faq">FAQ</Link> answers what to report, how anonymity
          works, and what happens next. For anything else,{" "}
          <Link href="/contact">contact us</Link> — though please don&apos;t use
          it for anything urgent.
        </p>
      </DocBody>
    </>
  );
}
