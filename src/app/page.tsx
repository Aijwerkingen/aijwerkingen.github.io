import Link from "next/link";
import { BrandName } from "@/brand/BrandLockup";
import {
  ChatIcon,
  ClockIcon,
  NoteIcon,
  PulseIcon,
  ShieldIcon,
} from "@/components/Icons";

export default function HomePage() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line bg-canvas">
        <HeroTrace />

        <div className="mx-auto max-w-3xl px-4 pt-20 pb-24 text-center sm:pt-24">
          <p className="eyebrow">Anonymous · Free · A few minutes</p>

          <h1 className="font-display mt-4 text-4xl leading-[1.1] font-extrabold tracking-tight text-balance sm:text-5xl">
            Feeling worse after using an AI tool or social media?
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-pretty text-ink-soft">
            <BrandName /> lets you report distress you felt during or after
            using a conversational AI tool, app, or social media platform - in a
            few minutes, whether it happened to you or someone you support. Your
            report helps spot patterns of harm earlier.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <Link href="/report" className="btn-primary">
              Report your experience
            </Link>
            <Link href="/faq" className="btn-secondary">
              Common questions
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-ink-soft">
            {[
              "No account needed",
              "You can stop at any point",
              "Your words are enough",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckDot />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Why report</p>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-balance">
            For you alone, it may be a feeling. Together they are a signal.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          <TrustCard
            icon={<ShieldIcon className="size-5" />}
            title="Anonymous by default"
            body="We collect only what's necessary to understand your report. No account required, and no name asked for."
          />
          <TrustCard
            icon={<ClockIcon className="size-5" />}
            title="A few minutes"
            body="A short, plain-language form. No technical knowledge needed, and nothing you have to justify."
          />
          <TrustCard
            icon={<PulseIcon className="size-5" />}
            title="Built for monitoring"
            body="Reports feed ongoing monitoring for patterns of harm across conversational AI tools and social media platforms."
          />
        </div>
      </section>

      <section className="border-y border-line bg-canvas">
        <div className="mx-auto max-w-5xl px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-balance">
              Three steps, in your own words
            </h2>
          </div>

          <ol className="mt-12 grid gap-6 sm:grid-cols-3">
            <Step
              n={1}
              icon={<ChatIcon className="size-5" />}
              title="Describe how you felt"
              body="In plain language. Mild or overwhelming, during use or afterwards - if you noticed it, it counts."
            />
            <Step
              n={2}
              icon={<NoteIcon className="size-5" />}
              title="Add any context"
              body="The tool or platform involved, and roughly when. An approximate name or a general description is fine."
            />
            <Step
              n={3}
              icon={<PulseIcon className="size-5" />}
              title="It becomes a signal"
              body="Your report is reviewed alongside others to surface patterns that a single experience can't show on its own."
            />
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="rounded-3xl border border-accent-line bg-accent-soft px-6 py-14 text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-balance">
            Ready when you are
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-pretty text-ink-soft">
            You don&apos;t need to be certain, and you don&apos;t need to name
            every app. Start with what you remember.
          </p>
          <div className="mt-8">
            <Link href="/report" className="btn-primary">
              Report your experience
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Decorative ECG trace echoing the pulse line inside the logo mark - it ties the
 * hero to the identity without another image request. Hidden from assistive tech
 * and stilled by the reduced-motion rule in globals.css.
 */
function HeroTrace() {
  return (
    <svg
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-28 w-full text-accent opacity-25"
    >
      <path
        d="M0 72h286l12-30 15 58 13-46 9 18h146l14-26 12 44 11-32 8 14h150l13-34 15 60 12-48 10 22h180l12-24 11 40 10-30 8 12h254"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="brand-trace"
        vectorEffect="non-scaling-stroke"
        pathLength="1"
      />
    </svg>
  );
}

function CheckDot() {
  return (
    <span
      aria-hidden="true"
      className="flex size-4 items-center justify-center rounded-full bg-accent-line"
    >
      <svg viewBox="0 0 12 12" className="size-2.5 text-accent-strong">
        <path
          d="M2.5 6.2l2.3 2.3 4.7-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function TrustCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="card transition-colors hover:border-accent-line">
      <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
        {icon}
      </span>
      <h3 className="font-display mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  body,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="card bg-surface">
      <div className="flex items-center justify-between">
        <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
          {icon}
        </span>
        <span
          aria-hidden="true"
          className="font-display text-3xl font-extrabold text-line"
        >
          {n}
        </span>
      </div>
      <h3 className="font-display mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
    </li>
  );
}
