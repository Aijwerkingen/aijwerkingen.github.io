import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about reporting a perceived adverse effect from an AI tool or social media platform: what to report, anonymity, what happens next, and who can report.",
  alternates: {
    canonical: "/faq",
  },
};

const faqs = [
  {
    q: "What counts as an effect I should report?",
    a: "Report any unexpected or unwanted effect you suspect is linked to using a conversational AI tool, app, or social media platform — mild or serious, well-known or not. You don't need proof the tool caused it; a suspicion is enough. If you're unsure whether something qualifies, report it anyway and let it be assessed.",
  },
  {
    q: "Which tools and platforms can I report?",
    a: "Any conversational AI tool (chatbots, AI companions, assistants) or digital/social media platform. It helps to include as much detail as you have — the app or platform name, and roughly when it happened — but an approximate name or description is enough to start a report.",
  },
  {
    q: "What if I don't know which app caused it?",
    a: "That's fine — describe what you were using and what happened as best you can. You're not expected to name every app with certainty; a general description of the tool or platform is enough to start a report.",
  },
  {
    q: "Is my report anonymous?",
    a: "Yes, by default. We don't require your name, and we collect only what's necessary to assess the report. If you choose to share contact details for follow-up questions, that's optional and clearly marked before you submit.",
  },
  {
    q: "What happens after I submit a report?",
    a: "Your report is intended to be logged and reviewed as part of ongoing monitoring for patterns of harm, once this service is fully operational. Individual reports aren't a diagnosis — they're meant to contribute to a broader signal that gets investigated over time.",
  },
  {
    q: "Can professionals report too?",
    a: "Yes. The same form works for anyone affected, parents or carers, and professionals such as clinicians, educators, and researchers. Professionals may have access to more context, which is helpful but not required — the core questions are the same for everyone.",
  },
  // TODO(P0-5, D-minors): minimum age, parental-consent flow, and
  // age-assurance approach are open decisions — revise this answer once
  // they're settled.
  {
    q: "Can I report on behalf of my child?",
    a: "Yes. Parents and carers can submit a report on behalf of a child in their care. We're still finalizing our policy on reports involving minors; check back here for updates.",
  },
  {
    q: "What if I'm not sure the tool or platform caused it?",
    a: "That's fine — you're not expected to prove causation. Suspected links are exactly what this kind of reporting is for. Reviewers look across many reports to spot patterns that a single case can't show on its own.",
  },
  {
    q: "How long does reporting take?",
    a: "Most people finish in a few minutes. The form starts with the essentials and lets you add optional detail — like a longer description or supporting dates — only if you want to.",
  },
  {
    q: "Is this a crisis or emergency service?",
    a: "No. This is not a crisis or emergency service. If you or someone else is in immediate danger, contact your local emergency number or a crisis line (e.g. in the Netherlands, 113 Zelfmoordpreventie) right away, then report here afterward if you still want to.",
  },
  {
    q: "What data do you collect, and why?",
    a: "We collect only what's needed to understand and assess a report: what happened, the tool or platform involved, and optional context. We don't require identifying information. Full detail on what's collected and why will be published in our privacy notice.",
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
    <div className="mx-auto max-w-3xl px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="text-3xl font-bold tracking-tight">
        Frequently asked questions
      </h1>
      <p className="mt-4 text-slate-600">
        Short, direct answers about reporting a perceived adverse effect
        with{" "}
        {siteConfig.name}. Still unsure about something?{" "}
        <Link href="/report" className="underline">
          Start a report
        </Link>{" "}
        — you can stop at any point.
      </p>

      <dl className="mt-10 space-y-10">
        {faqs.map((item) => (
          <div key={item.q}>
            <dt className="text-lg font-semibold text-slate-900">
              {item.q}
            </dt>
            <dd className="mt-2 text-slate-600">{item.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
