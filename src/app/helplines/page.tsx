import type { Metadata } from "next";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = {
  title: "Crisis helplines & resources",
  description:
    "A directory of verified crisis helplines and mental-health resources worldwide. If you are in crisis, help is available.",
  alternates: {
    canonical: "/helplines",
  },
};

const resources = [
  {
    name: "Find a Helpline",
    url: "https://findahelpline.com/",
    description:
      "Run by ThroughLine, this is the most comprehensive verified directory - covering 1,500+ helplines in 175+ countries across 21 topics and 15 specialties. Helpline organisations verify their own information directly.",
  },
  {
    name: "Wikimedia Mental Health Resources",
    url: "https://meta.wikimedia.org/wiki/Mental_health_resources",
    description:
      "Maintained by the Wikimedia Foundation's Trust & Safety team. Community-maintained and reasonably broad, intended for anyone needing support during a personal crisis.",
  },
  {
    name: "International Association for Suicide Prevention (IASP)",
    url: "https://www.iasp.info/resources/Crisis_Centres/",
    description:
      "Lists crisis centres and helplines across Africa, Asia, Europe, North America, Oceania, and South America. IASP is a WHO-affiliated body dedicated to suicide prevention.",
  },
  {
    name: "HelpGuide - International Directory",
    url: "https://www.helpguide.org/find-help",
    description:
      "A curated international directory of crisis helplines, broken down by country. HelpGuide is a nonprofit mental-health resource.",
  },
  {
    name: "TherapyRoute - Worldwide Crisis Lines",
    url: "https://www.therapyroute.com/article/helplines-suicide-hotlines-and-crisis-lines-from-around-the-world",
    description:
      "Another worldwide directory of crisis and suicide-prevention helplines, organised by country.",
  },
];

export default function HelplinesPage() {
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: metadata.title,
    description: metadata.description,
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
          <p className="eyebrow">Resources</p>
          <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-balance">
            Crisis helplines & resources
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-ink-soft">
            If you or someone you know is in crisis, free and confidential help
            is available. The directories below cover verified helplines in most
            countries worldwide.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <aside className="notice border-notice-line bg-notice-soft text-notice">
          <p>
            <span className="font-semibold">In immediate danger?</span>{" "}
            Call your local emergency number. For country-specific crisis
            helplines, we recommend{" "}
            <a
              href="https://findahelpline.com/"
              className="font-semibold underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              findahelpline.com
            </a>{" "}
            - it detects your location and shows verified services instantly.
          </p>
        </aside>

        <div className="prose-doc mt-10">
          <h2>Verified directories</h2>
          <p>
            The following resources maintain up-to-date lists of crisis
            helplines. We link to them rather than duplicating their data, so you
            always see the most current information. Our on-site helpline
            selector (shown on the{" "}
            <a href="/report">report page</a>) draws from these same sources
            but covers a smaller set of countries - use the directories below
            for the most complete coverage.
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

          <h2>A note on accuracy</h2>
          <p>
            Crisis helplines change their phone numbers, hours, and web
            addresses from time to time. The on-site selector on our report
            page is a convenience feature - it is not a substitute for a
            verified, real-time directory.{" "}
            <a
              href="https://findahelpline.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Find a Helpline
            </a>{" "}
            (by ThroughLine) verifies its data directly with each helpline
            organisation and is the resource we recommend most highly for
            finding support.
          </p>

          <p>
            If you notice outdated or incorrect information on our site,
            please{" "}
            <a href="/contact">let us know</a> so we can update it.
          </p>
        </div>
      </div>
    </>
  );
}
