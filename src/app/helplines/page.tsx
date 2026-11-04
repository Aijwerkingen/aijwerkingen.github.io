import type { Metadata } from "next";
import { siteConfig } from "@/site.config";
import { content } from "@/content.config";
import { Prose, RichLine } from "@/content/RichText";

const {
  header,
  emergencyNotice,
  directoriesHeading,
  directoriesIntro,
  directories: resources,
  accuracy,
} = content.helplines;

export const metadata: Metadata = {
  title: content.meta.pages.helplines.title,
  description: content.meta.pages.helplines.description,
  alternates: {
    canonical: "/helplines",
  },
};

export default function HelplinesPage() {
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: metadata.title,
    description: content.meta.pages.helplines.description,
    url: `${siteConfig.canonicalUrl}/helplines`,
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
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <aside className="notice border-notice-line bg-notice-soft text-notice">
          <p>
            <RichLine spans={emergencyNotice} />
          </p>
        </aside>

        <div className="prose-doc mt-10">
          <h2>{directoriesHeading}</h2>
          <p>
            <RichLine spans={directoriesIntro} />
          </p>

          <dl className="mt-6 space-y-6">
            {resources.map((r) => (
              <div key={r.url}>
                <dt>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {r.name}
                  </a>
                </dt>
                <dd className="mt-1 text-ink-soft">{r.description}</dd>
              </div>
            ))}
          </dl>

          <Prose blocks={accuracy} />
        </div>
      </div>
    </>
  );
}
