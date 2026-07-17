import type { Metadata } from "next";
import { siteConfig } from "@/site.config";

/**
 * Shared furniture for the long-form pages (about, how-it-works, contact,
 * privacy, terms, accessibility).
 */

export function DocHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: React.ReactNode;
}) {
  return (
    <section className="border-b border-line bg-canvas">
      <div className="mx-auto max-w-3xl px-4 py-14">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-balance">
          {title}
        </h1>
        {intro && (
          <p className="mt-4 max-w-xl text-pretty text-ink-soft">{intro}</p>
        )}
      </div>
    </section>
  );
}

export function DocBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="prose-doc">{children}</div>
    </div>
  );
}

/**
 * Robots directives for a legal document.
 *
 * An unapproved draft must never be indexed, even after the site is flipped
 * indexable — so this ANDs the sign-off flag with the site-wide switch rather
 * than deferring to `siteConfig.indexable` alone. `follow` stays tied to the
 * site switch: there is no reason to drop link equity, only to keep the draft
 * itself out of the index.
 */
export const legalRobots: Metadata["robots"] = {
  index: siteConfig.indexable && siteConfig.legal.approved,
  follow: siteConfig.indexable,
};

/**
 * Renders only while the DPO/legal owner has not signed off. Every figure in
 * these drafts — retention periods, lawful bases, named processors — is a
 * proposal written to be redlined, so saying so on the page is what keeps the
 * document from being mistaken for a statement of fact by a data subject
 * (GDPR Art. 13 transparency). Disappears when `legal.approved` is true.
 */
export function DraftNotice() {
  if (siteConfig.legal.approved) return null;

  return (
    <aside
      role="note"
      className="notice mb-8 border-notice-line bg-notice-soft text-notice"
    >
      <p className="font-semibold">Draft for review — not yet in force.</p>
      <p className="mt-1">
        This document has not been approved by our data protection officer or
        legal owner. Every specific below — retention periods, lawful bases,
        named processors — is a proposal for review, not an approved fact. Do
        not rely on it.
      </p>
    </aside>
  );
}

/** Shown once a document is approved, so the reader can see how current it is. */
export function LastReviewed() {
  if (!siteConfig.legal.approved || !siteConfig.legal.lastReviewed) return null;

  return (
    <p className="mt-10 border-t border-line pt-6 text-sm text-ink-soft">
      Last reviewed{" "}
      <time dateTime={siteConfig.legal.lastReviewed}>
        {siteConfig.legal.lastReviewed}
      </time>
      .
    </p>
  );
}

/**
 * The institutional provenance block. Renders nothing at all until
 * site.config.ts `research` is filled in — an empty field is omitted rather
 * than shown as a placeholder, so this is safe to ship before the formal
 * details land.
 */
export function ProvenanceList({ className = "" }: { className?: string }) {
  const { institution, department, principalInvestigator, ethicsApproval } =
    siteConfig.research;

  const rows = [
    { label: "Institution", value: institution },
    { label: "Department", value: department },
    { label: "Responsible researcher", value: principalInvestigator },
    { label: "Ethics approval", value: ethicsApproval },
  ].filter((row) => row.value);

  if (rows.length === 0) return null;

  return (
    <dl className={`grid gap-x-6 gap-y-3 sm:grid-cols-[auto_1fr] ${className}`}>
      {rows.map((row) => (
        <div key={row.label} className="sm:contents">
          <dt className="text-sm font-semibold text-ink">{row.label}</dt>
          <dd className="text-sm text-ink-soft">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
