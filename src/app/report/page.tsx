import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report a side effect",
  description:
    "Report a suspected side effect from a medicine or vaccine. Takes a few minutes; anonymous by default.",
};

// Mode A (Qualtrics-embedded), spec §8.3. This is a SAMPLE survey for early
// preview only — swap for the real anonymous link before any real-data launch,
// and see qualtrics-integration.md for postMessage completion handling,
// CSP frame-src hardening, and the launch checklist (Phase 2 work, not yet done).
const QUALTRICS_SURVEY_URL =
  "https://qualtricsxmwdy4hl99w.qualtrics.com/jfe/form/SV_aVpwAHDeyg456No";

export default function ReportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">
        Report a side effect
      </h1>
      <p className="mt-4 text-slate-600">
        This takes a few minutes. You don&apos;t need an account, and you can
        stop at any point. This is not an emergency service — if you need
        urgent help, contact your local emergency number.
      </p>

      <div className="mt-8 overflow-hidden rounded-lg border border-slate-200">
        <iframe
          src={QUALTRICS_SURVEY_URL}
          title="Side effect report form"
          className="h-[900px] w-full"
          referrerPolicy="no-referrer"
          allowFullScreen={false}
        />
      </div>

      <p className="mt-4 text-sm text-slate-500">
        Form not loading, or prefer a full page?{" "}
        <a
          href={QUALTRICS_SURVEY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Open it in a new tab
        </a>
        .
      </p>
    </div>
  );
}
