import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/site.config";
import { CrisisHelpline } from "@/components/CrisisHelpline";
import { ReportGate } from "./ReportGate";

export const metadata: Metadata = {
  title: "Report your experience",
  description:
    "The public reporting platform launches soon. When it is live, the anonymous report form will appear here.",
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
          <p className="eyebrow">Report</p>
          <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-balance">
            Report your experience
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-ink-soft">
            Tell us how using an AI tool or social media left you feeling. This
            takes a few minutes. You don&apos;t need an account, you don&apos;t
            need proof, and you can stop at any point.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
            {[
              "Anonymous by default",
              "No account required",
              "Contact details optional",
            ].map((item) => (
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
