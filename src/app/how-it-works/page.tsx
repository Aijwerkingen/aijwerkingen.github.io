import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/site.config";
import { content } from "@/content.config";
import { Prose } from "@/content/RichText";
import { DocBody, DocHeader } from "@/components/DocPage";

const { header, steps, body, cta } = content.howItWorks;

export const metadata: Metadata = {
  title: content.meta.pages.howItWorks.title,
  description: content.meta.pages.howItWorks.description,
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  // Spec §5 page table: /how-it-works emits HowTo.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to report distress linked to an AI tool or social media",
    description: content.meta.pages.howItWorks.description,
    url: `${siteConfig.canonicalUrl}/how-it-works`,
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
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
        <ol className="mt-0 space-y-5">
          {steps.map((step, index) => (
            <li
              key={step.name}
              className="flex gap-4 rounded-xl border border-line bg-surface p-5"
            >
              <span
                aria-hidden="true"
                className="font-display flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-extrabold text-accent-strong"
              >
                {index + 1}
              </span>
              <div>
                <h2 className="font-display mt-0 mb-1 text-base font-bold text-ink">
                  {step.name}
                </h2>
                <p className="mt-0 text-sm">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <Prose blocks={body} />

        <div className="mt-10">
          <Link href={cta.href} className="btn-primary">
            {cta.label}
          </Link>
        </div>
      </DocBody>
    </>
  );
}
