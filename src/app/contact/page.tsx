import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/site.config";
import { DocBody, DocHeader, ProvenanceList } from "@/components/DocPage";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "How to reach us with questions about the platform, your data, or the research. Not a route for emergencies or crisis support.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  // Spec §5 page table: /contact emits ContactPage.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${siteConfig.name}`,
    description: metadata.description,
    url: `${siteConfig.canonicalUrl}/contact`,
  };

  const { dpoEmail } = siteConfig.research;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <DocHeader
        eyebrow="Contact"
        title="Get in touch"
        intro="For questions about the platform, the research, or your data. Please don't use these routes for anything urgent."
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
            <span className="font-semibold text-ink">
              Not a crisis service.
            </span>{" "}
            Nobody monitors these routes in real time. If you or someone else is
            in immediate danger, contact your local emergency number. In the
            Netherlands,{" "}
            <a
              href="https://www.113.nl"
              target="_blank"
              rel="noopener noreferrer"
            >
              113 Zelfmoordpreventie
            </a>{" "}
            (call 113 or 0800-0113) offers free, confidential support with
            suicidal thoughts or crisis.
          </p>
        </aside>

        <h2>General enquiries</h2>
        <p>
          For questions about the platform or the research, email{" "}
          <a href={`mailto:${siteConfig.organization.email}`}>
            {siteConfig.organization.email}
          </a>
          .
        </p>

        <h2>Your data</h2>
        {/* Falls back to the general address until research.dpoEmail is set, so
            a data-subject request always has somewhere to land. */}
        <p>
          To ask what we hold about you, to have it corrected or erased, or to
          object to how it is used, contact{" "}
          <a href={`mailto:${dpoEmail || siteConfig.organization.email}`}>
            {dpoEmail || siteConfig.organization.email}
          </a>
          . Reports are anonymous by default, so we may be unable to link a
          request to a specific submission - the{" "}
          <Link href="/privacy">privacy notice</Link> explains what that means
          for your rights.
        </p>

        <h2>Reporting an experience</h2>
        <p>
          Please don&apos;t email reports - they can&apos;t be included in the
          analysis that way. Use the{" "}
          <Link href="/report">report form</Link> instead, which is anonymous
          and takes a few minutes.
        </p>

        <ProvenanceList className="mt-10 rounded-xl border border-line bg-canvas p-5" />
      </DocBody>
    </>
  );
}
