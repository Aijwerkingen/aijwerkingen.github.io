import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about reporting a suspected side effect: what to report, anonymity, what happens next, and who can report.",
};

const faqs = [
  {
    q: "What counts as a side effect I should report?",
    a: "Report any unexpected or unwanted effect you suspect is linked to a medicine or vaccine — mild or serious, well-known or not. You don't need proof the medicine caused it; a suspicion is enough. If you're unsure whether something qualifies, report it anyway and let it be assessed.",
  },
  {
    q: "Do I need to know the exact medicine name to report?",
    a: "No. It helps to include as much detail as you have — brand name, dose, batch number — but an approximate name or description is enough to start a report. You can always add details later if you find them.",
  },
  {
    q: "Is my report anonymous?",
    a: "Yes, by default. We don't require your name, and we collect only what's necessary to assess the report. If you choose to share contact details for follow-up questions, that's optional and clearly marked before you submit.",
  },
  {
    q: "What happens after I submit a report?",
    a: "Your report is logged and reviewed as part of ongoing safety monitoring, similar to how national pharmacovigilance centres such as Lareb operate. Individual reports aren't a diagnosis — they contribute to a broader signal that gets investigated over time.",
  },
  {
    q: "Can healthcare professionals report too?",
    a: "Yes. The same form works for patients, caregivers, and healthcare professionals. Professionals may have access to more clinical detail, which is helpful but not required — the core questions are the same for everyone.",
  },
  {
    q: "Will reporting affect my treatment?",
    a: "No. Reporting a side effect here does not change or interrupt your treatment, and it isn't sent to your doctor automatically. If a side effect concerns you, also talk to your doctor or pharmacist directly.",
  },
  {
    q: "What if I'm not sure the medicine caused it?",
    a: "That's fine — you're not expected to prove causation. Suspected links are exactly what this kind of reporting is for. Reviewers look across many reports to spot patterns that a single case can't show on its own.",
  },
  {
    q: "How long does reporting take?",
    a: "Most people finish in a few minutes. The form starts with the essentials and lets you add optional detail — like a longer description or supporting dates — only if you want to.",
  },
  {
    q: "Is this a substitute for medical advice?",
    a: "No. This is not a medical-advice or emergency service. If you're experiencing a serious reaction right now, contact your local emergency number or seek medical care immediately, then report here afterward if you still want to.",
  },
  {
    q: "What data do you collect, and why?",
    a: "We collect only what's needed to understand and assess a report: what happened, the suspected medicine, and optional context. We don't require identifying information. Full detail on what's collected and why will be published in our privacy notice.",
  },
  {
    q: "Can I report on behalf of someone else, like a child?",
    a: "Yes. Parents, caregivers, and anyone supporting someone else's care can submit a report on their behalf. Just describe the situation as accurately as you can — you don't need to be the person who experienced the effect.",
  },
  {
    q: "Where does my report go?",
    a: "Reports are collected for pharmacovigilance purposes — the ongoing monitoring of medicine and vaccine safety. Depending on how this platform is configured, reports are processed either through our own systems or a survey partner; either way, the same privacy standards apply.",
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
        Short, direct answers about reporting a suspected side effect with{" "}
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
