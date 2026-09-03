import type { Metadata } from "next";
import { siteConfig } from "@/site.config";
import { content } from "@/content.config";
import { Prose, RichLine } from "@/content/RichText";
import { DocBody, DocHeader, ProvenanceList } from "@/components/DocPage";

const { header, crisisNote, body } = content.contact;

export const metadata: Metadata = {
  title: content.meta.pages.contact.title,
  description: content.meta.pages.contact.description,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  // Spec §5 page table: /contact emits ContactPage.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${siteConfig.name}`,
    description: content.meta.pages.contact.description,
    url: `${siteConfig.canonicalUrl}/contact`,
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
        {/* Deliberately the first thing on the page: someone in crisis who lands
            on /contact looking for a person needs redirecting before they read
            about general enquiries. */}
        <aside
          role="note"
          className="notice mt-0 mb-8 border-line bg-canvas text-ink-soft"
        >
          <p>
            <RichLine spans={crisisNote} />
          </p>
        </aside>

        <Prose blocks={body} />

        <ProvenanceList className="mt-10 rounded-xl border border-line bg-canvas p-5" />
      </DocBody>
    </>
  );
}
