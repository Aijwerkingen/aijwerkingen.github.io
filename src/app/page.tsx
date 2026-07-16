import Link from "next/link";
import { siteConfig } from "@/site.config";

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Noticed a side effect from an AI tool or social media?
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600">
          {siteConfig.name}{" "}
          lets you report a perceived adverse effect from a conversational AI
          tool, app, or social media platform in a few minutes — anonymously,
          for free, whether it happened to you or someone you support. Your
          report helps spot patterns of harm earlier.
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
            body="A short, plain-language form — no technical knowledge required to get started."
          />
          <TrustCard
            title="Built for ongoing monitoring"
            body="Reports are intended to feed into ongoing monitoring for patterns of harm across AI tools and platforms, once this preview is fully operational."
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
