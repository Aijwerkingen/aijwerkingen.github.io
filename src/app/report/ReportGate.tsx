"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/site.config";
import { content } from "@/content.config";
import { RichLine } from "@/content/RichText";

const gate = content.report.gate;
const { completedSender, completedEvent } = siteConfig.reportEmbed;

type GateState =
  | { status: "loading" }
  | { status: "locked"; error?: string }
  | { status: "unlocked"; url: string };

export function ReportGate() {
  const [state, setState] = useState<GateState>({ status: "loading" });
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const qualtricsOrigin = useRef<string>("");

  useEffect(() => {
    let alive = true;
    fetch("/api/report-access", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => {
        if (!alive) return;
        try {
          qualtricsOrigin.current = new URL(d.url).origin;
        } catch {
          // unparseable URL — postMessage validation will never match, which is safe
        }
        setState({ status: "unlocked", url: d.url });
      })
      .catch(() => alive && setState({ status: "locked" }));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!qualtricsOrigin.current || event.origin !== qualtricsOrigin.current) return;
      const d = event.data as Record<string, unknown> | null;
      if (d?.sender === completedSender && d?.event === completedEvent) {
        setCompleted(true);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
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
        try {
          qualtricsOrigin.current = new URL(d.url).origin;
        } catch {
          // safe fallback
        }
        setState({ status: "unlocked", url: d.url });
      } else {
        setState({ status: "locked", error: gate.wrongPassword });
      }
    } catch {
      setState({ status: "locked", error: gate.genericError });
    } finally {
      setSubmitting(false);
      setPassword("");
    }
  }

  function reportAnother() {
    setCompleted(false);
    setSessionKey((k) => k + 1);
  }

  if (state.status === "unlocked") {
    if (completed) {
      return (
        <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface p-10 text-center shadow-sm">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-6">
            <div className="flex size-14 items-center justify-center rounded-full bg-accent/10">
              <svg
                className="size-7 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold">{gate.thanksTitle}</h2>
              <p className="mt-2 text-ink-soft">{gate.thanksBody}</p>
            </div>
            <button
              onClick={reportAnother}
              className="rounded-lg bg-accent px-5 py-2.5 font-medium text-white"
            >
              {gate.reportAnother}
            </button>
            <p className="text-sm text-ink-soft">
              <RichLine spans={gate.needSupport} />
            </p>
          </div>
        </div>
      );
    }

    // Append a session counter so each new run bypasses any Qualtrics URL caching.
    const iframeSrc =
      sessionKey === 0
        ? state.url
        : `${state.url}${state.url.includes("?") ? "&" : "?"}_s=${sessionKey}`;

    return (
      <>
        <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <iframe
            key={sessionKey}
            src={iframeSrc}
            title={gate.iframeTitle}
            className="h-[900px] w-full"
            referrerPolicy="no-referrer"
            allowFullScreen={false}
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
          />
        </div>
        <p className="mt-4 text-sm text-ink-soft">
          {gate.openInTab.before}
          <a href={state.url} target="_blank" rel="noopener noreferrer" className="link">
            {gate.openInTab.link}
          </a>
          {gate.openInTab.after}
        </p>
      </>
    );
  }

  // loading OR locked -> render the public "launches soon" placeholder (= main),
  // plus the password field so the team can unlock the embed.
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface p-10 text-center shadow-sm">
      <h2 className="text-xl font-semibold">{gate.launchTitle}</h2>
      <p className="mx-auto mt-3 max-w-xl text-ink-soft">
        <RichLine spans={gate.launchBody} />
      </p>

      {state.status === "locked" && (
        <form onSubmit={onSubmit} className="mx-auto mt-8 flex max-w-sm flex-col gap-3">
          <label htmlFor="report-pw" className="text-sm text-ink-soft">
            {gate.passwordLabel}
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
            {submitting ? gate.unlocking : gate.unlock}
          </button>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        </form>
      )}
    </div>
  );
}
