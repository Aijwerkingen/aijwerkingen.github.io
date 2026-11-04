import type { Metadata } from "next";
import Link from "next/link";
import { content } from "@/content.config";
import { RichLine } from "@/content/RichText";

const { header, items: faqs, closing } = content.faq;

export const metadata: Metadata = {
  title: content.meta.pages.faq.title,
  description: content.meta.pages.faq.description,
  alternates: {
    canonical: "/faq",
  },
};

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
          <p className="eyebrow">{header.eyebrow}</p>
          <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-balance">
            {header.title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-ink-soft">
            <RichLine spans={header.intro} />
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
            {closing.title}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-pretty text-ink-soft">
            {closing.body}
          </p>
          <div className="mt-6">
            <Link href={closing.cta.href} className="btn-primary btn-sm">
              {closing.cta.label}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
