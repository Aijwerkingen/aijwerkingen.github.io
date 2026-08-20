"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type GateState =
  | { status: "loading" }
  | { status: "locked"; error?: string }
  | { status: "unlocked"; url: string };

export function ReportGate() {
  const [state, setState] = useState<GateState>({ status: "loading" });
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/report-access", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => alive && setState({ status: "unlocked", url: d.url }))
      .catch(() => alive && setState({ status: "locked" }));
    return () => {
      alive = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await fetch("/api/report-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password }),
      });
      if (r.ok) {
        const d = await r.json();
        setState({ status: "unlocked", url: d.url });
      } else {
        setState({ status: "locked", error: "That password didn’t work." });
      }
    } catch {
      setState({ status: "locked", error: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
      setPassword("");
    }
  }

  if (state.status === "unlocked") {
    return (
      <>
        <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <iframe
            src={state.url}
            title="Experience report form"
            className="h-[900px] w-full"
            referrerPolicy="no-referrer"
            allowFullScreen={false}
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
          />
        </div>
        <p className="mt-4 text-sm text-ink-soft">
          Form not loading, or prefer a full page?{" "}
          <a href={state.url} target="_blank" rel="noopener noreferrer" className="link">
            Open it in a new tab
          </a>
          .
        </p>
      </>
    );
  }

  // loading OR locked -> render the public "launches soon" placeholder (= main),
  // plus the password field so the team can unlock the embed.
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface p-10 text-center shadow-sm">
      <h2 className="text-xl font-semibold">The reporting form launches soon</h2>
      <p className="mx-auto mt-3 max-w-xl text-ink-soft">
        The public reporting platform is nearly ready. When it launches, the anonymous
        report form will appear on this page. Until then, you can read about what we are
        building in the{" "}
        <Link href="/blog/launching-soon-report-ai-side-effects" className="link">
          launch announcement
        </Link>
        .
      </p>

      {state.status === "locked" && (
        <form onSubmit={onSubmit} className="mx-auto mt-8 flex max-w-sm flex-col gap-3">
          <label htmlFor="report-pw" className="text-sm text-ink-soft">
            Team preview password
          </label>
          <input
            id="report-pw"
            type="password"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-line bg-canvas px-3 py-2"
          />
          <button
            type="submit"
            disabled={submitting || password.length === 0}
            className="rounded-lg bg-accent px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Checking…" : "Unlock preview"}
          </button>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        </form>
      )}
    </div>
  );
}
