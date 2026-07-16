import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-4 text-slate-600">
        Sorry, we couldn&apos;t find that page. Here are some places to go
        instead:
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link
          href="/"
          className="rounded-md bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-700"
        >
          Home
        </Link>
        <Link
          href="/faq"
          className="rounded-md border border-slate-300 px-6 py-3 font-medium text-slate-900 hover:bg-slate-100"
        >
          FAQ
        </Link>
        <Link
          href="/report"
          className="rounded-md border border-slate-300 px-6 py-3 font-medium text-slate-900 hover:bg-slate-100"
        >
          Report a side effect
        </Link>
      </div>
    </div>
  );
}
