import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report a side effect",
  description:
    "Report a perceived adverse effect from a conversational AI tool or social media platform. Takes a few minutes; anonymous by default.",
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

      <div
        role="alert"
        className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      >
        <p className="font-medium">
          This is a non-operational preview. Reports submitted here are not
          currently monitored or acted on.
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <p>
          Not a crisis service. If you or someone else is in immediate
          danger, contact your local emergency number. In the Netherlands,{" "}
          <a
            href="https://www.113.nl"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            113 Zelfmoordpreventie
          </a>{" "}
          (call 113 or 0800-0113) offers free, confidential support with
          suicidal thoughts or crisis.
        </p>
      </div>

      <p className="mt-4 text-slate-600">
        This takes a few minutes. You don&apos;t need an account, and you can
        stop at any point.
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
