import type { Metadata } from "next";
import { siteConfig } from "@/site.config";
import { content } from "@/content.config";
import { CrisisHelpline } from "@/components/CrisisHelpline";
import { ReportGate } from "./ReportGate";

const { header, chips } = content.report;

export const metadata: Metadata = {
  title: content.meta.pages.report.title,
  description: content.meta.pages.report.description,
  alternates: {
    canonical: "/report",
  },
};

export default function ReportPage() {
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: metadata.title,
    description: metadata.description,
    url: `${siteConfig.canonicalUrl}/report`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />

      <section className="border-b border-line bg-canvas">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <p className="eyebrow">{header.eyebrow}</p>
          <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-balance">
            {header.title}
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-ink-soft">
            {header.intro}
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
            {chips.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-accent"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <aside className="notice border-line bg-canvas text-ink-soft">
          <CrisisHelpline variant="notice" />
        </aside>

        <ReportGate />
      </div>
    </>
  );
}
