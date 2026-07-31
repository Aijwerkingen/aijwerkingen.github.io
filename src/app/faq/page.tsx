import type { Metadata } from "next";
import Link from "next/link";
import { BrandName } from "@/brand/BrandLockup";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about reporting distress linked to an AI tool or social media platform: what to report, anonymity, what happens next, and who can report.",
  alternates: {
    canonical: "/faq",
  },
};

const faqs = [
  {
    q: "What should I report?",
    a: "Anything you felt that seems linked to using a conversational AI tool, app, or social media platform - during use or afterwards. Distress, anxiety, low mood, trouble sleeping, feeling worse about yourself, or something you can't quite put a name to. Mild or overwhelming. You don't need proof of a link; noticing it is enough. If you're unsure whether it qualifies, report it anyway and let it be assessed.",
  },
  {
    q: "Which tools and platforms can I report?",
    a: "Any conversational AI tool (chatbots, AI companions, assistants) or digital/social media platform. It helps to include as much detail as you have - the app or platform name, and roughly when it happened - but an approximate name or description is enough to start a report.",
  },
  {
    q: "What if I don't know which app was involved?",
    a: "That's fine - describe what you were using and how you felt as best you can. You're not expected to name every app with certainty; a general description of the tool or platform is enough to start a report.",
  },
  {
    q: "Is my report anonymous?",
    a: "Yes, by default. We don't require your name, and we collect only what's necessary to understand the report. If you choose to share contact details for follow-up questions, that's optional and clearly marked before you submit.",
  },
  {
    q: "What happens after I submit a report?",
    a: "Your report is logged and reviewed as part of ongoing monitoring for patterns of harm. An individual report isn't a diagnosis and isn't treated as one - it contributes to a broader signal that gets investigated over time.",
  },
  {
    q: "Can professionals report too?",
    a: "Yes. The same form works for anyone affected, parents or carers, and professionals such as clinicians, educators, and researchers. Professionals may have access to more context, which is helpful but not required - the core questions are the same for everyone.",
  },
  // TODO(P0-5, D-minors): minimum age, parental-consent flow, and
  // age-assurance approach are open decisions - revise this answer once
  // they're settled.
  {
    q: "Can I report on behalf of my child?",
    a: "Yes. Parents and carers can submit a report on behalf of a child in their care. We're still finalizing our policy on reports involving minors; check back here for updates.",
  },
  {
    q: "What if I'm not sure the tool or platform is to blame?",
    a: "That's fine - you're not expected to prove anything. Suspected links are exactly what this kind of reporting is for. Reviewers look across many reports to spot patterns that a single experience can't show on its own.",
  },
  {
    q: "How long does reporting take?",
    a: "Most people finish in a few minutes. The form starts with the essentials and lets you add optional detail - like a longer description or supporting dates - only if you want to.",
  },
  {
    q: "Is this a crisis or emergency service?",
    a: "No. This is not a crisis or emergency service, and reports are not read in real time. If you or someone else is in immediate danger, contact your local emergency number or a crisis line (e.g. in the Netherlands, 113 Zelfmoordpreventie) right away, then report here afterward if you still want to.",
  },
  {
    q: "What data do you collect, and why?",
    a: "We collect only what's needed to understand and assess a report: how you felt, the tool or platform involved, and optional context. We don't require identifying information. Full detail on what's collected and why will be published in our privacy notice.",
  },
  // TODO(P1-17, D-third-party): moderation/retention policy for reports
  // naming identifiable companies or individuals is still being defined.
  {
    q: "Will you contact the company I'm reporting?",
    a: "Not automatically, and not with anything that identifies you without your separate consent. Our policy for handling reports that name specific companies or people is still being finalized.",
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="border-b border-line bg-canvas">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="eyebrow">Questions</p>
          <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-balance">
            Frequently asked questions
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-ink-soft">
            Short, direct answers about reporting distress linked to AI tools
            and social media with <BrandName />. Still unsure about something?{" "}
            <Link href="/report" className="link">
              Start a report
            </Link>{" "}
            - you can stop at any point.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-16">
        {/* Native <details> keeps the accordion keyboard- and screen-reader-
            accessible, and findable by in-page search, with no client JS —
            which matters under `output: "export"`. */}
        <ul className="space-y-3">
          {faqs.map((item) => (
            <li key={item.q}>
              <details className="group overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-accent-line">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <h2 className="font-display text-base font-bold">{item.q}</h2>
                  <span
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-ink-soft transition-transform duration-200 group-open:rotate-180"
                  >
                    <svg viewBox="0 0 20 20" className="size-5">
                      <path
                        d="M6 8l4 4 4-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-ink-soft">
                  {item.a}
                </p>
              </details>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-2xl border border-accent-line bg-accent-soft px-6 py-10 text-center">
          <h2 className="font-display text-xl font-bold text-balance">
            Didn&apos;t find your question?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-pretty text-ink-soft">
            You don&apos;t need to resolve every doubt before reporting. Describe
            how you felt and let it be assessed.
          </p>
          <div className="mt-6">
            <Link href="/report" className="btn-primary btn-sm">
              Report your experience
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
