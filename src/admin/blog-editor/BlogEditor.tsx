"use client";

// In-place blog editor (staging only). Mounted lazily by EditPostButton behind
// the NEXT_PUBLIC_BLOG_EDITOR build flag, so neither this component nor Tiptap
// is in the production bundle.
//
// Nothing is written to a branch directly: Save posts to /api/blog-edit, which
// creates a branch + pull request into the base branch. See
// docs/BLOG_EDITOR_PLAN.md step 4.
//
// Link ships inside v3's StarterKit; it is configured here with
// openOnClick: false so clicking a link in the editor does not navigate away.

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { Markdown } from "@tiptap/markdown";
import { Toolbar } from "./Toolbar";
import { assemble, normalise, split, tidy, todayUtc, withUpdated } from "./md";

type Stage = "checking" | "locked" | "loading" | "editing" | "submitting" | "done" | "error";

const NAME_KEY = "blog-editor-name";

export function BlogEditor({
  slug,
  onClose,
  onDirtyChange,
}: {
  slug: string;
  onClose: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [stage, setStage] = useState<Stage>("checking");
  const [notice, setNotice] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [sha, setSha] = useState("");
  const [initialFile, setInitialFile] = useState<string | null>(null);
  const [frontmatterText, setFrontmatterText] = useState("");
  const [body, setBody] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [view, setView] = useState<"visual" | "source">("visual");
  const [roundTripWarning, setRoundTripWarning] = useState(false);
  // Remember the editor's name only - nothing else is persisted. Read lazily
  // rather than in an effect (this component is client-only: EditPostButton
  // loads it with ssr: false).
  const [name, setName] = useState(readStoredName);
  const [summary, setSummary] = useState("");
  const [prUrl, setPrUrl] = useState("");
  // Bumped on editor transactions/selection so the toolbar's active states and
  // the dirty check stay current (v3 does not re-render per transaction).
  const [, setVersion] = useState(0);

  const editor = useEditor(
    {
      extensions: [StarterKit.configure({ link: { openOnClick: false } }), Image, TableKit, Markdown],
      content: "",
      contentType: "markdown",
      immediatelyRender: false,
      editorProps: {
        attributes: { class: "prose-doc min-h-96 px-4 py-4 focus:outline-none" },
      },
      onUpdate: () => setVersion((v) => v + 1),
      onSelectionUpdate: () => setVersion((v) => v + 1),
    },
    [],
  );

  // Load the fetched file into the editor exactly once per loaded file.
  const loadedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!editor || !initialFile || loadedRef.current === initialFile) return;
    loadedRef.current = initialFile;
    editor.commands.setContent(body, { contentType: "markdown" });
    setRoundTripWarning(normalise(editor.getMarkdown()) !== normalise(body));
    setStage((current) => (current === "loading" ? "editing" : current));
  }, [editor, initialFile, body]);

  // No synchronous setState here on purpose: this is called from a mount effect,
  // and callers own the "checking" transition (see `unlock`).
  const check = useCallback(async () => {
    try {
      const res = await fetch(`/api/blog-edit?slug=${encodeURIComponent(slug)}`, {
        credentials: "same-origin",
      });
      if (res.status === 401) {
        setStage("locked");
        return;
      }
      if (res.status === 404) {
        const data = await res.json().catch(() => null);
        setNotice(
          data?.error === "no-such-post"
            ? "This post isn't on the staging branch yet."
            : "Editing isn't enabled on this deployment.",
        );
        setStage("error");
        return;
      }
      if (!res.ok) {
        setNotice("Couldn't load this post.");
        setStage("error");
        return;
      }
      const data = await res.json();
      const file = tidy(String(data.markdown ?? ""));
      const { frontmatter, body: nextBody } = split(file);
      setSha(String(data.sha ?? ""));
      setInitialFile(file);
      setFrontmatterText(frontmatter);
      setBody(nextBody);
      setSourceText("");
      setView("visual");
      setStage("loading");
    } catch {
      setNotice("Couldn't reach the editing endpoint.");
      setStage("error");
    }
  }, [slug]);

  useEffect(() => {
    // Load on mount. `check` only touches state after its first await, so nothing
    // causes a synchronous cascading render here - the lint rule is a heuristic
    // that cannot see through the call.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void check();
  }, [check]);

  const unlock = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setPasswordError(null);
      try {
        const res = await fetch("/api/report-access", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        if (res.ok) {
          setPassword("");
          setNotice(null);
          setStage("checking");
          await check();
          return;
        }
        setPasswordError(
          res.status === 401 ? "That password didn't work." : "Couldn't unlock the editor.",
        );
      } catch {
        setPasswordError("Couldn't reach the server.");
      }
    },
    [password, check],
  );

  /** The file as currently edited, exactly as it would be submitted. */
  const currentFile = useCallback(() => {
    if (view === "source") return tidy(sourceText);
    return tidy(assemble(frontmatterText, editor?.getMarkdown() ?? ""));
  }, [view, sourceText, frontmatterText, editor]);

  /**
   * `updated:` is only moved when something else actually changed - a save that
   * changes nothing must stay byte-identical so the endpoint can answer
   * no-changes (and so `dateModified` does not claim an edit that never
   * happened). Section 6.7 of the plan depends on this.
   */
  const nextFile = useCallback(() => {
    const raw = currentFile();
    if (!initialFile || raw === initialFile) return raw;
    if (view === "source") {
      const { frontmatter, body: nextBody } = split(raw);
      return frontmatter ? tidy(assemble(withUpdated(frontmatter, todayUtc()), nextBody)) : raw;
    }
    return tidy(assemble(withUpdated(frontmatterText, todayUtc()), editor?.getMarkdown() ?? ""));
  }, [currentFile, initialFile, view, frontmatterText, editor]);

  const dirty = initialFile !== null && stage !== "done" && currentFile() !== initialFile;
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  function showSource() {
    if (!editor) return;
    setSourceText(assemble(frontmatterText, editor.getMarkdown()));
    setView("source");
  }

  function showVisual() {
    if (!editor) return;
    const { frontmatter, body: nextBody } = split(sourceText);
    setFrontmatterText(frontmatter);
    editor.commands.setContent(nextBody, { contentType: "markdown" });
    setRoundTripWarning(normalise(editor.getMarkdown()) !== normalise(nextBody));
    setView("visual");
  }

  const submit = useCallback(async () => {
    const markdown = nextFile();
    setStage("submitting");
    setNotice(null);
    try {
      const res = await fetch("/api/blog-edit", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, sha, markdown, name: name.trim(), summary: summary.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        try {
          localStorage.setItem(NAME_KEY, name.trim());
        } catch {
          /* private mode / storage disabled */
        }
        setPrUrl(String(data?.prUrl ?? ""));
        setStage("done");
        return;
      }
      if (res.status === 401) {
        setNotice("Your unlock expired. Enter the password again - your edits are still here.");
        setStage("locked");
        return;
      }
      if (res.status === 409) {
        setNotice(
          "Someone changed this post since you opened it. Copy your text from the Source tab, reload, and reapply.",
        );
        setStage("editing");
        return;
      }
      if (res.status === 422 && data?.error === "no-changes") {
        setNotice("Nothing changed.");
        setStage("editing");
        return;
      }
      setNotice(
        res.status === 400
          ? "The file must start with a --- frontmatter block."
          : "Couldn't save. Nothing was committed.",
      );
      setStage("editing");
    } catch {
      setNotice("Couldn't reach the server. Nothing was committed.");
      setStage("editing");
    }
  }, [nextFile, slug, sha, name, summary]);

  return (
    <div className="mx-auto flex min-h-full max-w-4xl flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur-sm">
        <div className="min-w-0">
          <h2 className="font-display truncate text-base font-bold">Edit post</h2>
          <p className="truncate text-xs text-ink-soft">{slug}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-md border border-line px-3 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface hover:text-ink"
        >
          Close
        </button>
      </header>

      <div className="flex-1 px-4 py-6">
        {stage === "checking" && <p className="text-sm text-ink-soft">Checking…</p>}

        {stage === "loading" && <p className="text-sm text-ink-soft">Loading the post…</p>}

        {stage === "error" && (
          <div className="rounded-lg border border-line bg-surface px-4 py-3 text-sm">
            {notice}
          </div>
        )}

        {stage === "locked" && (
          <form onSubmit={unlock} className="max-w-sm">
            <label htmlFor="blog-editor-password" className="eyebrow mb-2 block">
              Team password
            </label>
            <input
              id="blog-editor-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="mt-3 w-full cursor-pointer rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface hover:text-ink"
            >
              Unlock
            </button>
            {passwordError && <p className="mt-2 text-sm text-ink">{passwordError}</p>}
            {notice && <p className="mt-2 text-sm text-ink-soft">{notice}</p>}
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              The same password as the report page. Unlocking either one unlocks both for 12 hours.
            </p>
          </form>
        )}

        {stage === "done" && (
          <div className="rounded-lg border border-line bg-surface px-4 py-4">
            <p className="text-sm font-semibold text-ink">Pull request opened</p>
            {prUrl && (
              <a
                href={prUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block break-all text-sm text-accent-strong underline decoration-accent-line underline-offset-4"
              >
                {prUrl}
              </a>
            )}
            <p className="mt-3 text-sm text-ink-soft">
              It goes live on internal after the PR is merged.
            </p>
          </div>
        )}

        {(stage === "editing" || stage === "submitting") && editor && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-1 rounded-lg border border-line bg-canvas p-1">
              <button
                type="button"
                onClick={showVisual}
                aria-pressed={view === "visual"}
                className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                  view === "visual" ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-ink-soft hover:text-ink"
                }`}
              >
                Visual
              </button>
              <button
                type="button"
                onClick={showSource}
                aria-pressed={view === "source"}
                className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                  view === "source" ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-ink-soft hover:text-ink"
                }`}
              >
                Source
              </button>
            </div>

            {notice && (
              <div className="rounded-lg border border-line bg-surface px-4 py-3 text-sm">
                {notice}
              </div>
            )}

            {roundTripWarning && stage === "editing" && (
              <div className="rounded-lg border border-accent-line bg-accent-soft px-4 py-3 text-sm">
                This post has formatting the visual editor may rewrite. Check the Source tab before
                submitting, or edit there.
              </div>
            )}

            {view === "visual" ? (
              <>
                <label className="block">
                  <span className="eyebrow mb-2 block">Frontmatter</span>
                  <textarea
                    value={frontmatterText}
                    onChange={(event) => setFrontmatterText(event.target.value)}
                    rows={8}
                    spellCheck={false}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-xs"
                  />
                </label>

                <div className="overflow-hidden rounded-lg border border-line">
                  <Toolbar editor={editor} />
                  <EditorContent editor={editor} className="bg-surface" />
                </div>
              </>
            ) : (
              <label className="block">
                <span className="eyebrow mb-2 block">Whole file</span>
                <textarea
                  value={sourceText}
                  onChange={(event) => setSourceText(event.target.value)}
                  rows={26}
                  spellCheck={false}
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-xs"
                />
              </label>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="eyebrow mb-2 block">Your name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="eyebrow mb-2 block">What changed</span>
                <input
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  placeholder="One line"
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void submit()}
                disabled={!name.trim() || stage === "submitting"}
                className="cursor-pointer rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-canvas disabled:cursor-default disabled:opacity-40"
              >
                {stage === "submitting" ? "Submitting…" : "Submit"}
              </button>
              <p className="text-xs text-ink-soft">
                Opens a pull request against staging. Nothing is published until someone merges it.
              </p>
            </div>
          </div>
        )}

        {stage === "editing" && !editor && <p className="text-sm text-ink-soft">Starting the editor…</p>}
      </div>
    </div>
  );
}

/**
 * localStorage can throw (private mode) or be unavailable - a missing name must
 * never stop the editor opening.
 */
function readStoredName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}
