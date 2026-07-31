import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/site.config";
import { DocBody, DocHeader } from "@/components/DocPage";

export const metadata: Metadata = {
  title: "How reporting works",
  description:
    "What happens when you report distress linked to an AI tool or social media platform: what you're asked, what we store, and what your report contributes to.",
  alternates: { canonical: "/how-it-works" },
};

const steps = [
  {
    name: "Describe how you felt",
    text: "In your own words. Mild or overwhelming, during use or afterwards. You don't need clinical language, and you don't need to be sure the tool is to blame.",
  },
  {
    name: "Add any context you have",
    text: "Which tool or platform, and roughly when. An approximate name or a general description is enough. Everything beyond the essentials is optional.",
  },
  {
    name: "Submit anonymously",
    text: "No account, no name. Contact details are optional and only used if you invite follow-up questions. You can stop at any point before submitting.",
  },
  {
    name: "Your report joins the others",
    text: "It is reviewed alongside other reports to surface patterns that a single experience cannot show on its own.",
  },
];

export default function HowItWorksPage() {
  // Spec §5 page table: /how-it-works emits HowTo.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to report distress linked to an AI tool or social media",
    description: metadata.description,
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
        eyebrow="How it works"
        title="What happens to your report"
        intro="Reporting takes a few minutes. Here is the whole of it, start to finish, so nothing is a surprise."
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

        <h2>What we store</h2>
        <p>
          Only what is needed to understand the report: what you described, the
          tool or platform involved, and any optional context you chose to add.
          Reporting is anonymous by default - we do not ask for your name and
          you do not need an account. If you supply contact details, they are
          optional, clearly marked, and used only for follow-up.
        </p>
        <p>
          The <Link href="/privacy">privacy notice</Link> sets out the detail:
          purposes, retention, who processes the data, and your rights over it.
        </p>

        <h2>What it does not do</h2>
        <p>
          Submitting a report does not contact the company involved on your
          behalf, does not produce a clinical assessment of your situation, and
          does not reach anyone in real time. This is not a crisis service - if
          you or someone else is in immediate danger, contact your local
          emergency number.
        </p>

        <div className="mt-10">
          <Link href="/report" className="btn-primary">
            Report your experience
          </Link>
        </div>
      </DocBody>
    </>
  );
}
