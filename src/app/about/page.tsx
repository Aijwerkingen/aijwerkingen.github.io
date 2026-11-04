import type { Metadata } from "next";
import { siteConfig } from "@/site.config";
import { content } from "@/content.config";
import { Prose, RichLine } from "@/content/RichText";
import { DocBody, DocHeader, ProvenanceList } from "@/components/DocPage";

const { header, body, governance, questions } = content.about;

export const metadata: Metadata = {
  title: content.meta.pages.about.title,
  description: content.meta.pages.about.description,
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
        eyebrow={header.eyebrow}
        title={header.title}
        intro={<RichLine spans={header.intro} />}
      />

      <DocBody>
        <Prose blocks={body} />

        {/* Renders only once site.config.ts `research` is filled in. Until the
            formal details and authorisations land, this section is absent
            rather than showing placeholders. */}
        {hasProvenance && (
          <>
            <h2>{governance.heading}</h2>
            <p>{governance.intro}</p>
            <ProvenanceList className="mt-5 rounded-xl border border-line bg-canvas p-5" />
          </>
        )}

        <Prose blocks={questions} />
      </DocBody>
    </>
  );
}
