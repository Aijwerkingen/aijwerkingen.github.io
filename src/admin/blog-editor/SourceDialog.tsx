"use client";

// "Add source": paste a DOI or a PubMed link, or type the details by hand, and
// get a correctly formatted entry in the house style - appended to the post's
// Sources list, and optionally linked to the text that was selected.
// See docs/BLOG_EDITOR_PHASE2_PLAN.md sections 3 and 4.5.

import { useState } from "react";
import { formatSource, type CiteData } from "./cite";

type Mode = "lookup" | "manual";

const EMPTY: CiteData = { authors: [], title: "", container: "" };

const LOOKUP_FAILED =
  "We couldn't find that article. Check the DOI or the PubMed link, or enter the details manually.";
const NOT_A_REFERENCE =
  "That doesn't look like a DOI or a PubMed link. You'll usually find the DOI on the article page.";
const TIMED_OUT = "The lookup took too long. Please try again, or enter the details manually.";

/** The entry as it will appear, rendered from the same pieces the editor inserts. */
function Preview({ cite }: { cite: CiteData }) {
  return (
    <p className="text-sm leading-relaxed">
      {formatSource(cite).map((piece, index) =>
        piece.href ? (
          <a
            key={index}
            href={piece.href}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-accent-line underline-offset-4"
          >
            {piece.italic ? <em>{piece.text}</em> : piece.text}
          </a>
        ) : piece.italic ? (
          <em key={index}>{piece.text}</em>
        ) : (
          <span key={index}>{piece.text}</span>
        ),
      )}
    </p>
  );
}

export function SourceDialog({
  selectionRange,
  onInsert,
  onLinkSelection,
  onCancel,
  onDone,
}: {
  /** Present only when text was selected before the dialog opened. */
  selectionRange?: { from: number; to: number };
  /** `link` is the state of "Link the selected text to this source". */
  onInsert: (cite: CiteData, link: boolean) => "added" | "already-listed";
  onLinkSelection: (cite: CiteData) => void;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<Mode>("lookup");
  const [input, setInput] = useState("");
  const [cite, setCite] = useState<CiteData | null>(null);
  const [authorsText, setAuthorsText] = useState("");
  const [linkSelection, setLinkSelection] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState(false);
  const [busy, setBusy] = useState(false);

  const hasSelection = Boolean(selectionRange && selectionRange.to > selectionRange.from);

  function adopt(next: CiteData) {
    setCite(next);
    setAuthorsText(next.authors.join(", "));
    setError(null);
    setDuplicate(false);
  }

  async function lookUp() {
    setBusy(true);
    setError(null);
    setDuplicate(false);
    try {
      const res = await fetch(`/api/blog-edit?cite=${encodeURIComponent(input.trim())}`, {
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(
          res.status === 400
            ? NOT_A_REFERENCE
            : res.status === 504
              ? TIMED_OUT
              : data?.error === "bad-cite"
                ? NOT_A_REFERENCE
                : LOOKUP_FAILED,
        );
        setCite(null);
        return;
      }
      adopt((await res.json()) as CiteData);
    } catch {
      setError(LOOKUP_FAILED);
      setCite(null);
    } finally {
      setBusy(false);
    }
  }

  function workingCite(): CiteData {
    const base = cite ?? EMPTY;
    return {
      ...base,
      authors: authorsText
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean),
    };
  }

  function add() {
    const ready = workingCite();
    if (!ready.title.trim()) {
      setError("Give the source a title.");
      return;
    }
    if (!ready.container.trim() && !ready.doi && !ready.url) {
      setError("Say where it was published, or add a web address.");
      return;
    }
    const result = onInsert(ready, linkSelection);
    if (result === "already-listed") {
      setDuplicate(true);
      setError(null);
      return;
    }
    onDone();
  }

  function linkOnly() {
    onLinkSelection(workingCite());
    onDone();
  }

  const ready = cite !== null && (mode === "lookup" || mode === "manual");

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-auto bg-ink/40 p-4">
      <div className="my-16 w-full max-w-2xl rounded-xl border border-line bg-surface p-5 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-bold">Add source</h3>
            <p className="mt-1 text-xs text-ink-soft">
              It is added to this post&apos;s list of sources at the end.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-md border border-line px-3 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
          >
            Close
          </button>
        </div>

        {mode === "lookup" ? (
          <div className="mt-4">
            <label className="block">
              <span className="eyebrow mb-2 block">DOI or PubMed link</span>
              <div className="flex flex-wrap gap-2">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void lookUp();
                    }
                  }}
                  placeholder="10.1038/d41586-023-00288-7"
                  className="min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => void lookUp()}
                  disabled={busy || !input.trim()}
                  className="cursor-pointer rounded-lg border border-line bg-canvas px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface disabled:cursor-default disabled:opacity-40"
                >
                  {busy ? "Looking…" : "Look up"}
                </button>
              </div>
              <span className="mt-1 block text-xs text-ink-soft">
                Paste the DOI, a doi.org link, or a PubMed (PubMed ID) link.
              </span>
            </label>

            <button
              type="button"
              onClick={() => {
                setMode("manual");
                adopt(cite ?? EMPTY);
              }}
              className="mt-2 cursor-pointer text-xs font-semibold text-ink-soft underline decoration-accent-line underline-offset-4 hover:text-ink"
            >
              Enter the details manually instead
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setMode("lookup")}
            className="mt-4 cursor-pointer text-xs font-semibold text-ink-soft underline decoration-accent-line underline-offset-4 hover:text-ink"
          >
            Look up a DOI or PubMed link instead
          </button>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-notice-line bg-notice-soft px-3 py-2 text-sm text-notice">
            {error}
          </p>
        )}

        {duplicate && (
          <div className="mt-4 rounded-lg border border-notice-line bg-notice-soft px-3 py-2 text-sm text-notice">
            This source is already listed.
            {hasSelection && (
              <button
                type="button"
                onClick={linkOnly}
                className="ml-2 cursor-pointer font-semibold underline decoration-accent-line underline-offset-4"
              >
                Link the selected text to it instead
              </button>
            )}
          </div>
        )}

        {ready && cite && (
          <>
            <div className="mt-5 rounded-lg border border-line bg-canvas px-3 py-3">
              <span className="eyebrow mb-2 block">It will look like this</span>
              <Preview cite={workingCite()} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="eyebrow mb-2 block">
                  {mode === "manual" ? "Author or organisation" : "Authors"}
                </span>
                <input
                  value={authorsText}
                  onChange={(event) => setAuthorsText(event.target.value)}
                  placeholder="Surname, Surname & Surname"
                  className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="eyebrow mb-2 block">Title</span>
                <input
                  value={cite.title}
                  onChange={(event) => setCite({ ...cite, title: event.target.value })}
                  className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="eyebrow mb-2 block">
                  {mode === "manual" ? "Published in or by" : "Journal"}
                </span>
                <input
                  value={cite.container}
                  onChange={(event) => setCite({ ...cite, container: event.target.value })}
                  className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
                />
              </label>

              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className="eyebrow mb-2 block">Volume</span>
                  <input
                    value={cite.volume ?? ""}
                    onChange={(event) => setCite({ ...cite, volume: event.target.value })}
                    className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="eyebrow mb-2 block">Pages</span>
                  <input
                    value={cite.pages ?? ""}
                    onChange={(event) => setCite({ ...cite, pages: event.target.value })}
                    className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="eyebrow mb-2 block">Year</span>
                  <input
                    value={cite.year ?? ""}
                    onChange={(event) => setCite({ ...cite, year: event.target.value })}
                    className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
                  />
                </label>
              </div>

              {mode === "manual" && (
                <>
                  <label className="block">
                    <span className="eyebrow mb-2 block">Web address</span>
                    <input
                      value={cite.url ?? ""}
                      onChange={(event) => setCite({ ...cite, url: event.target.value })}
                      placeholder="https://example.org/report"
                      className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="eyebrow mb-2 block">DOI (if it has one)</span>
                    <input
                      value={cite.doi ?? ""}
                      onChange={(event) => setCite({ ...cite, doi: event.target.value.trim() })}
                      placeholder="10.1038/…"
                      className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
                    />
                  </label>
                </>
              )}
            </div>

            {hasSelection && (
              <label className="mt-4 flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={linkSelection}
                  onChange={(event) => setLinkSelection(event.target.checked)}
                  className="mt-0.5"
                />
                <span>Link the selected text to this source</span>
              </label>
            )}

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={add}
                className="cursor-pointer rounded-lg border border-line bg-canvas px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface"
              >
                Add source
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
