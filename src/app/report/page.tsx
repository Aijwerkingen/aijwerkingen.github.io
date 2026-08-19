import type { Metadata } from "next";
import { siteConfig } from "@/site.config";
import { CrisisHelpline } from "@/components/CrisisHelpline";

export const metadata: Metadata = {
  title: "Report your experience",
  description:
    "Report distress you felt during or after using a conversational AI tool or social media platform. Takes a few minutes; anonymous by default.",
  alternates: {
    canonical: "/report",
  },
};

// Mode A (Qualtrics-embedded), spec §8.3. Current survey URL (2026-08-18,
// product owner direction); qualtrics-integration.md has the launch checklist.
// Sourced from env (spec §19, §8.5) rather than hard-coded, so it's per-build
// config, not a component literal - see .env.example.
const QUALTRICS_SURVEY_URL =
  process.env.NEXT_PUBLIC_QUALTRICS_SURVEY_URL ||
  "https://qualtricsxmwdy4hl99w.qualtrics.com/jfe/form/SV_aV0s4hQLmXWDXrE";

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

        <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <iframe
            src={QUALTRICS_SURVEY_URL}
            title="Experience report form"
            className="h-[900px] w-full"
            referrerPolicy="no-referrer"
            allowFullScreen={false}
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
          />
        </div>

        <p className="mt-4 text-sm text-ink-soft">
          Form not loading, or prefer a full page?{" "}
          <a
            href={QUALTRICS_SURVEY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="link"
          >
            Open it in a new tab
          </a>
          .
        </p>
      </div>
    </>
  );
}
