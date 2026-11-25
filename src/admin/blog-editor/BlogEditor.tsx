"use client";

// In-place blog editor (staging only). Mounted lazily by EditPostButton behind
// the NEXT_PUBLIC_BLOG_EDITOR build flag, so neither this component nor Tiptap
// is in the production bundle.
//
// Written for people who are not developers: no Markdown, no YAML, no source
// view. The body is edited inside a replica of the published page (PostView),
// the details are form fields, and Preview renders through the same
// renderMarkdown() the build uses. See docs/BLOG_EDITOR_PHASE2_PLAN.md.
//
// Nothing is written to a branch directly: Send for review posts to
// /api/blog-edit, which creates a branch and one commit, then a pull request.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Extension, mergeAttributes } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { Markdown } from "@tiptap/markdown";
import { NodeSelection } from "@tiptap/pm/state";
import { renderMarkdown } from "@/lib/markdown";
import { readingMinutes } from "@/lib/reading-time";
import { PostView } from "@/app/blog/PostView";
import { Toolbar } from "./Toolbar";
import { PostDetails, readDetails } from "./PostDetails";
import { ImageDialog, type ImageResult } from "./ImageDialog";
import { LinkDialog } from "./LinkDialog";
import { SourceDialog } from "./SourceDialog";
import { citeHref, insertSource, type CiteData } from "./cite";
import { isAllowedLink } from "./links";
import {
  allPending,
  getPending,
  resetPending,
  setPendingImage,
  type PendingImage,
} from "./pending";
import {
  assemble,
  firstDifference,
  replaceFrontmatter,
  split,
  squash,
  tidy,
  todayUtc,
  withField,
  withUpdated,
  withoutField,
} from "./md";

type Stage = "checking" | "locked" | "loading" | "editing" | "submitting" | "done" | "error";
type Mode = "edit" | "preview";
type Dialog =
  | null
  | { kind: "image"; mode: "inline" | "cover"; initialAlt?: string }
  | { kind: "image-replace"; initialAlt?: string }
  | { kind: "link" }
  | { kind: "source" };

type Range = { from: number; to: number; text: string };

const NAME_KEY = "blog-editor-name";

/** The body the editor will submit: the original text unless it really changed. */
function sameBody(original: string, current: string): boolean {
  return squash(renderMarkdown(original)) === squash(renderMarkdown(current));
}

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
  const [frontmatter, setFrontmatter] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<Mode>("edit");
  const [readOnly, setReadOnly] = useState(false);

  const [name, setName] = useState(readStoredName);
  const [summary, setSummary] = useState("");
  const [prUrl, setPrUrl] = useState("");

  const [dialog, setDialog] = useState<Dialog>(null);
  const [selection, setSelection] = useState<Range | null>(null);
  const [describing, setDescribing] = useState(false);
  const [describeText, setDescribeText] = useState("");

  // Images chosen but not yet committed. The store itself is module-level (see
  // pending.ts) because the Image extension reads it from renderHTML, outside
  // React's render; this is the state mirror the component renders from.
  const [pending, setPending] = useState<Map<string, PendingImage>>(allPending);
  // Bumped on editor transactions/selection, so the toolbar's active states and
  // the dirty check stay current (v3 does not re-render per transaction).
  const [, setVersion] = useState(0);

  const pendingSrc = useCallback((src: string) => pending.get(src)?.dataUrl ?? src, [pending]);

  // Image dialog, cover/preview and the inserted node's own rendering all resolve
  // pending paths through the same store.
  const PendingImage = useMemo(
    () =>
      Image.extend({
        renderHTML({ HTMLAttributes }) {
          // @tiptap/markdown serialises from node attributes, so the document keeps
          // the path while the editor view shows the pending image.
          const src = getPending(String(HTMLAttributes.src))?.dataUrl ?? HTMLAttributes.src;
          return ["img", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { src })];
        },
      }),
    [],
  );

  const openLinkRef = useRef<() => void>(() => {});
  const LinkShortcut = useMemo(
    () =>
      Extension.create({
        name: "blogEditorLinkShortcut",
        addKeyboardShortcuts() {
          return {
            "Mod-k": () => {
              openLinkRef.current();
              return true;
            },
          };
        },
      }),
    [],
  );

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          link: {
            openOnClick: false,
            autolink: true,
            linkOnPaste: true,
            protocols: ["http", "https", "mailto"],
            // Only the targets we allow, in the dialog and on paste alike.
            isAllowedUri: (url: string) => isAllowedLink(url),
          },
        }),
        PendingImage,
        TableKit,
        Markdown,
        LinkShortcut,
      ],
      content: "",
      contentType: "markdown",
      immediatelyRender: false,
      editorProps: {
        attributes: { class: "prose-doc min-h-96 focus:outline-none" },
        // Clicking an image selects it, so the toolbar can offer Describe /
        // Replace / Remove. Without this the cursor simply lands beside it.
        handleClick(view, pos) {
          const node = view.state.doc.nodeAt(pos);
          if (node?.type.name === "image") {
            view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos)));
            return true;
          }
          return false;
        },
      },
      onUpdate: () => setVersion((v) => v + 1),
      onSelectionUpdate: () => setVersion((v) => v + 1),
    },
    [],
  );

  // Load the fetched file into the editor exactly once per loaded file, and run
  // the equivalence check that replaces the Source tab (section 4.4).
  const loadedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!editor || !initialFile || loadedRef.current === initialFile) return;
    loadedRef.current = initialFile;
    editor.commands.setContent(body, { contentType: "markdown" });
    const current = editor.getMarkdown();
    const intact = sameBody(body, current);
    setReadOnly(!intact);
    if (!intact) {
      // For the web team: this is the text the visual editor cannot represent.
      console.warn(`blog editor: ${slug} opens read-only. ${firstDifference(body, current)}`);
    }
    setStage((current) => (current === "loading" ? "editing" : current));
  }, [editor, initialFile, body, slug]);

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
      const { frontmatter: nextFrontmatter, body: nextBody } = split(file);
      // A fresh open starts with no images chosen: nothing survives from before.
      resetPending();
      setPending(new Map());
      setSha(String(data.sha ?? ""));
      setInitialFile(file);
      setFrontmatter(nextFrontmatter);
      setBody(nextBody);
      setMode("edit");
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

  /**
   * The body as it should be saved: the original text unless the rendered HTML
   * actually changed, so a details-only edit never rewrites the body and "nothing
   * changed" stays detectable (section 4.4, "Minimal diffs").
   */
  const bodyOut = useCallback(() => {
    const current = editor?.getMarkdown() ?? "";
    return sameBody(body, current) ? body : current;
  }, [editor, body]);

  /** The frontmatter as it was loaded, to tell an edited file from an untouched one. */
  const initialFrontmatter = useMemo(
    () => (initialFile ? split(initialFile).frontmatter : ""),
    [initialFile],
  );

  /** The file as it stands, with `updated:` moved only if something really changed. */
  const fileNow = useCallback(() => {
    const nextBody = bodyOut();
    if (!initialFile) return tidy(assemble(frontmatter, nextBody));
    if (nextBody === body && frontmatter === initialFrontmatter) return initialFile;

    const nextFrontmatter = withUpdated(frontmatter, todayUtc());
    // Body untouched (a details-only edit, or nothing but the title): keep the
    // original text and separators, so the diff is the frontmatter lines alone.
    if (nextBody === body) return tidy(replaceFrontmatter(initialFile, nextFrontmatter));
    return tidy(assemble(nextFrontmatter, nextBody));
  }, [frontmatter, initialFrontmatter, body, bodyOut, initialFile]);

  const details = useMemo(() => readDetails(frontmatter), [frontmatter]);
  const dirty = initialFile !== null && stage !== "done" && (fileNow() !== initialFile || pending.size > 0);
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  // The post is shown inside a replica of the published page, so it contains real
  // links (the tag chips and "All posts"). A stray click would navigate away and
  // take the unsaved edit with it, so the browser is asked to confirm instead.
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const setField = useCallback((key: string, valueYaml: string | null, afterKey?: string) => {
    setFrontmatter((current) =>
      valueYaml === null ? withoutField(current, key) : withField(current, key, valueYaml, afterKey),
    );
  }, []);

  // ---------------------------------------------------------------- images

  function keepPending(result: ImageResult) {
    // Stored before the node is inserted, so the image renders from its data URL
    // the moment it lands in the document.
    setPending(setPendingImage(result.path, { dataUrl: result.dataUrl, base64: result.base64 }));
  }

  function chooseImage(result: ImageResult) {
    keepPending(result);
    // An image can be selected (clicking one selects it). "Add" must then insert
    // *after* it - replacing is what the toolbar's "Replace" is for, and without
    // this, adding two images in a row silently produced one.
    const { selection } = editor?.state ?? {};
    if (editor && selection instanceof NodeSelection) {
      editor
        .chain()
        .focus()
        .setTextSelection(selection.to)
        .setImage({ src: result.path, alt: result.alt })
        .run();
    } else {
      editor?.chain().focus().setImage({ src: result.path, alt: result.alt }).run();
    }
    setDialog(null);
  }

  function replaceImage(result: ImageResult) {
    keepPending(result);
    editor?.chain().focus().setImage({ src: result.path, alt: result.alt }).run();
    setDialog(null);
  }

  function chooseCover(result: ImageResult) {
    keepPending(result);
    setFrontmatter((current) =>
      withField(withField(current, "image", result.path, "date"), "imageAlt", JSON.stringify(result.alt), "image"),
    );
    setDialog(null);
  }

  function clearCover() {
    setFrontmatter((current) => withoutField(withoutField(current, "image"), "imageAlt"));
  }

  function describeImage() {
    const attrs = editor?.getAttributes("image") ?? {};
    setDescribeText(String(attrs.alt ?? ""));
    setDescribing(true);
  }

  function saveDescription() {
    editor?.chain().focus().updateAttributes("image", { alt: describeText.trim() }).run();
    setDescribing(false);
  }

  // ---------------------------------------------------------------- links + sources

  const captureSelection = useCallback((): Range | null => {
    if (!editor) return null;
    const { from, to, empty } = editor.state.selection;
    if (empty) return null;
    return { from, to, text: editor.state.doc.textBetween(from, to, " ") };
  }, [editor]);

  const openLinkDialog = useCallback(() => {
    setSelection(captureSelection());
    setDialog({ kind: "link" });
  }, [captureSelection]);
  // The Ctrl/Cmd+K extension is created once, so it reaches the opener through a
  // ref that an effect keeps current - not by writing it during render.
  useEffect(() => {
    openLinkRef.current = openLinkDialog;
  }, [openLinkDialog]);

  function linkSelectionTo(cite: CiteData) {
    const href = citeHref(cite);
    if (!href || !editor) return;
    const range = selection;
    if (!range) return;
    editor.chain().focus().setTextSelection({ from: range.from, to: range.to }).setLink({ href }).run();
  }

  function addSource(cite: CiteData, link: boolean) {
    if (!editor) return "already-listed" as const;
    const range = link ? selection ?? undefined : undefined;
    return insertSource(editor, cite, range ?? undefined);
  }

  // ---------------------------------------------------------------- submit

  const submit = useCallback(async () => {
    const markdown = fileNow();
    // Only images the file still references: removing one from the text must not
    // commit an orphan.
    const images = [...pending.entries()]
      .filter(([path]) => markdown.includes(path))
      .map(([path, image]) => ({ path: `public${path}`, data: image.base64 }));

    setStage("submitting");
    setNotice(null);
    try {
      const res = await fetch("/api/blog-edit", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          sha,
          markdown,
          name: name.trim(),
          summary: summary.trim(),
          images,
        }),
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
          "Someone changed this post while you were working on it. Nothing was saved - copy your text somewhere safe, then reload the page and add your changes to their version.",
        );
        setStage("editing");
        return;
      }
      if (res.status === 422 && data?.error === "no-changes") {
        setNotice("Nothing changed.");
        setStage("editing");
        return;
      }
      if (res.status === 413) {
        setNotice("The images are too large together. Remove one and try again.");
        setStage("editing");
        return;
      }
      if (res.status === 400 && data?.error === "bad-image") {
        setNotice("One image couldn't be accepted. Remove it and add it again.");
        setStage("editing");
        return;
      }
      setNotice("Couldn't save. Nothing was committed.");
      setStage("editing");
    } catch {
      setNotice("Couldn't reach the server. Nothing was committed.");
      setStage("editing");
    }
  }, [fileNow, slug, sha, name, summary, pending]);

  // ---------------------------------------------------------------- render

  const working = stage === "editing" || stage === "submitting";
  const bodyHtml = bodyOut();
  const canSend = working && !readOnly && name.trim() !== "" && dirty;

  return (
    <div className="mx-auto flex min-h-full max-w-4xl flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur-sm">
        <div className="min-w-0">
          <h2 className="font-display truncate text-base font-bold">{details.title || "Edit post"}</h2>
          <p className="truncate text-xs text-ink-soft">{slug}</p>
        </div>

        {working && !readOnly && (
          <div className="flex gap-1 rounded-lg border border-line bg-canvas p-1">
            {(["edit", "preview"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                aria-pressed={mode === value}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                  mode === value ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-ink-soft hover:text-ink"
                }`}
              >
                {value === "edit" ? "Edit" : "Preview"}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-md border border-line px-3 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface hover:text-ink"
        >
          Close
        </button>
      </header>

      <div className="flex-1">
        {stage === "checking" && <p className="p-6 text-sm text-ink-soft">Checking…</p>}
        {stage === "loading" && <p className="p-6 text-sm text-ink-soft">Loading the post…</p>}

        {stage === "error" && (
          <div className="m-6 rounded-lg border border-line bg-surface px-4 py-3 text-sm">{notice}</div>
        )}

        {stage === "locked" && (
          <form onSubmit={unlock} className="m-6 max-w-sm">
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
          <div className="m-6 rounded-lg border border-line bg-surface px-4 py-4">
            <p className="text-sm font-semibold text-ink">Sent for review</p>
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
              It goes live on internal after someone merges it.
            </p>
          </div>
        )}

        {working && (
          <div className="flex flex-col gap-4 p-4 sm:p-6">
            {notice && (
              <div className="rounded-lg border border-line bg-surface px-4 py-3 text-sm">{notice}</div>
            )}

            {readOnly ? (
              <div className="rounded-lg border border-notice-line bg-notice-soft px-4 py-3 text-sm text-notice">
                This post uses formatting the editor can&apos;t keep intact. Ask the web team to make
                this change.
              </div>
            ) : (
              mode === "edit" && (
                <PostDetails
                  key={sha}
                  frontmatter={frontmatter}
                  resolveSrc={pendingSrc}
                  onField={setField}
                  onPickCover={() =>
                    setDialog({ kind: "image", mode: "cover", initialAlt: details.imageAlt })
                  }
                  onClearCover={clearCover}
                />
              )
            )}

            {describing && (
              <div className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface px-4 py-3">
                <label className="block flex-1">
                  <span className="eyebrow mb-2 block">Describe the image</span>
                  <input
                    value={describeText}
                    onChange={(event) => setDescribeText(event.target.value)}
                    autoFocus
                    className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
                  />
                </label>
                <button
                  type="button"
                  onClick={saveDescription}
                  className="cursor-pointer rounded-lg border border-line bg-canvas px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setDescribing(false)}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            )}

            {mode === "preview" || readOnly ? (
              <PostView
                title={details.title}
                date={details.dateIso}
                readingMinutes={readingMinutes(bodyHtml)}
                author={details.author}
                image={details.image}
                imageAlt={details.imageAlt}
                tags={details.tags}
                bodyHtml={withPendingSrcs(renderMarkdown(bodyHtml), pending)}
                resolveSrc={pendingSrc}
              />
            ) : (
              <PostView
                title={details.title}
                date={details.dateIso}
                readingMinutes={readingMinutes(bodyHtml)}
                author={details.author}
                image={details.image}
                imageAlt={details.imageAlt}
                tags={details.tags}
                bodySlot={
                  <div className="rounded-lg border border-line transition-colors focus-within:border-accent-line">
                    <Toolbar
                      editor={editor}
                      onAddImage={() => setDialog({ kind: "image", mode: "inline" })}
                      onDescribeImage={describeImage}
                      onReplaceImage={() =>
                        setDialog({
                          kind: "image-replace",
                          initialAlt: String(editor?.getAttributes("image").alt ?? ""),
                        })
                      }
                      onRemoveImage={() => editor?.chain().focus().deleteSelection().run()}
                      onOpenLink={openLinkDialog}
                      onAddSource={() => {
                        setSelection(captureSelection());
                        setDialog({ kind: "source" });
                      }}
                    />
                    <EditorContent editor={editor} />
                  </div>
                }
                resolveSrc={pendingSrc}
              />
            )}

            {!readOnly && (
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
            )}

            {!readOnly && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={!canSend}
                  className="cursor-pointer rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-canvas disabled:cursor-default disabled:opacity-40"
                >
                  {stage === "submitting" ? "Sending…" : "Send for review"}
                </button>
                <p className="text-xs text-ink-soft">
                  Nothing is published until someone reviews and merges it.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {dialog?.kind === "image" && (
        <ImageDialog
          slug={slug}
          mode={dialog.mode}
          initialAlt={dialog.initialAlt ?? ""}
          onCancel={() => setDialog(null)}
          onDone={dialog.mode === "cover" ? chooseCover : chooseImage}
        />
      )}
      {dialog?.kind === "image-replace" && (
        <ImageDialog
          slug={slug}
          mode="inline"
          initialAlt={dialog.initialAlt ?? ""}
          onCancel={() => setDialog(null)}
          onDone={replaceImage}
        />
      )}
      {dialog?.kind === "link" && editor && (
        <LinkDialog
          editor={editor}
          initialHref={(editor.getAttributes("link").href as string | undefined) ?? ""}
          selectionText={selection?.text ?? ""}
          onCancel={() => setDialog(null)}
          onApplied={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "source" && editor && (
        <SourceDialog
          selectionRange={selection ?? undefined}
          onInsert={addSource}
          onLinkSelection={linkSelectionTo}
          onCancel={() => setDialog(null)}
          onDone={() => setDialog(null)}
        />
      )}
    </div>
  );
}

/** Replaces pending image paths with their data URLs, for Preview only. */
function withPendingSrcs(html: string, pending: Map<string, PendingImage>): string {
  let out = html;
  for (const [path, image] of pending) {
    out = out.split(`src="${path}"`).join(`src="${image.dataUrl}"`);
  }
  return out;
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
