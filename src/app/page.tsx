import Link from "next/link";
import {
  ChatIcon,
  NoteIcon,
  PulseIcon,
  ShieldIcon,
} from "@/components/Icons";
import { content } from "@/content.config";
import { PartnerLogos } from "@/components/PartnerLogos";
import { RichLine } from "@/content/RichText";
import type { Span } from "@/content/rich";
import type { Metadata } from "next";

export const metadata: Metadata = {
  // No `title` here on purpose: the home page inherits the layout default
  // ("<brand> - <descriptor>"). Setting it to an empty string suppresses both
  // <title> and og:title, which is what used to happen.
  description: content.meta.pages.home.description,
};

const { hero, whatWeDo, how, partnersLabel } = content.home;

const cardIcons = [
  <PulseIcon key="pulse" className="size-5" />,
  <ShieldIcon key="shield" className="size-5" />,
  <NoteIcon key="note" className="size-5" />,
];

// Icons are presentation, not copy, so they stay here and zip with the config text.
const howIcons = [
  <ChatIcon key="chat" className="size-5" />,
  <NoteIcon key="note" className="size-5" />,
  <ShieldIcon key="shield" className="size-5" />,
];

export default function HomePage() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line bg-canvas">
        <HeroTrace />

        <div className="mx-auto max-w-3xl px-4 pt-20 pb-24 text-center sm:pt-24">
          <h1 className="font-display mt-4 text-4xl leading-[1.1] font-extrabold tracking-tight text-balance sm:text-5xl">
            {hero.title}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-pretty text-ink-soft sm:text-lg">
            <RichLine spans={hero.body} />
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-pretty text-ink-soft">
            {hero.detail}
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            {hero.ctas.map((cta, i) => (
              <Link
                key={cta.href}
                href={cta.href}
                className={i === 0 ? "btn-primary" : "btn-secondary"}
              >
                {cta.label}
              </Link>
            ))}
          </div>

          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-ink-soft">
            {hero.chips.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckDot />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-8">
          <p className="eyebrow">{partnersLabel}</p>
          <PartnerLogos />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{whatWeDo.eyebrow}</p>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-balance">
            {whatWeDo.title}
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {whatWeDo.cards.map((card, i) => (
            <InfoCard
              key={typeof card.title === "string" ? card.title : card.title.join("")}
              icon={cardIcons[i]}
              title={card.title}
              body={card.body}
            />
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-canvas">
        <div className="mx-auto max-w-5xl px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">{how.eyebrow}</p>
          </div>

          <ol className="mt-12 grid gap-6 sm:grid-cols-3">
            {how.steps.map((step, i) => (
              <Step
                key={step.title}
                n={i + 1}
                icon={howIcons[i]}
                title={step.title}
              />
            ))}
          </ol>
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

function InfoCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string | readonly Span[];
  body: string | readonly Span[];
}) {
  const renderCopy = (copy: string | readonly Span[]) =>
    typeof copy === "string" ? copy : <RichLine spans={copy} />;

  return (
    <article className="flex max-h-[27rem] min-h-[22rem] flex-col rounded-2xl border border-line bg-surface px-7 py-6 shadow-sm">
      <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
        {icon}
      </span>
      <h3 className="font-display mt-4 text-xl font-bold leading-tight text-ink">{renderCopy(title)}</h3>
      <div className="mt-4 min-h-0 overflow-y-auto pr-2 text-base leading-relaxed text-ink-soft [scrollbar-color:var(--line)_transparent]">
        <p>{renderCopy(body)}</p>
      </div>
    </article>
  );
}

function Step({
  n,
  icon,
  title,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
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
    </li>
  );
}
