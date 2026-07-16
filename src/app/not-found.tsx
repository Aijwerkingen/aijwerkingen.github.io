import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-28 text-center">
      <p className="eyebrow">404</p>
      <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-balance">
        Page not found
      </h1>
      <p className="mx-auto mt-4 max-w-md text-pretty text-ink-soft">
        Sorry, we couldn&apos;t find that page. Here are some places to go
        instead:
      </p>
      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
        <Link href="/report" className="btn-primary">
          Report your experience
        </Link>
        <Link href="/faq" className="btn-secondary">
          FAQ
        </Link>
        <Link href="/" className="btn-secondary">
          Home
        </Link>
      </div>
    </div>
  );
}
