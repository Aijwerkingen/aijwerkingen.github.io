import Link from "next/link";
import { content } from "@/content.config";

const { eyebrow, title, body, links } = content.notFound;

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-28 text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-balance">
        {title}
      </h1>
      <p className="mx-auto mt-4 max-w-md text-pretty text-ink-soft">{body}</p>
      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={
              "primary" in l && l.primary ? "btn-primary" : "btn-secondary"
            }
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
