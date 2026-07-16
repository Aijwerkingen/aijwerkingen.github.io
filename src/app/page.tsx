import Link from "next/link";
import { siteConfig } from "@/site.config";

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Noticed a side effect from a medicine or vaccine?
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600">
          {siteConfig.name}{" "}
          lets you report a suspected adverse reaction in a few minutes —
          anonymously, for free, whether you&apos;re a patient or a
          healthcare professional. Your report helps spot safety signals
          earlier.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/report"
            className="rounded-md bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-700"
          >
            Report a side effect
          </Link>
          <Link
            href="/faq"
            className="rounded-md border border-slate-300 px-6 py-3 font-medium text-slate-900 hover:bg-slate-100"
          >
            How it works
          </Link>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-16 sm:grid-cols-3">
          <TrustCard
            title="Anonymous by default"
            body="We collect only what's necessary to assess your report. No account required."
          />
          <TrustCard
            title="A few minutes"
            body="A short, plain-language form — no medical jargon required to get started."
          />
          <TrustCard
            title="Reviewed by people who look"
            body="Reports feed into ongoing safety monitoring, the same way pharmacovigilance centres like Lareb work."
          />
        </div>
      </section>
    </>
  );
}

function TrustCard({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  );
}
