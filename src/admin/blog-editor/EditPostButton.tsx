"use client";

// The only blog-editor piece a page imports: a small "Edit post" button that
// mounts the editor in a full-screen overlay on first click.
//
// STAGING ONLY. `NEXT_PUBLIC_BLOG_EDITOR` (src/admin/blog-editor-enabled.ts) is
// set by .github/workflows/deploy.yml and by nothing else; the post page guards
// the single call site, so production compiles the button and the editor out.
//
// The editor is loaded lazily - the Tiptap chunk is only fetched when someone
// opens it. `ssr: false` is only legal inside a Client Component (see
// node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md).
//
// See docs/BLOG_EDITOR_PLAN.md step 4a.

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const BlogEditor = dynamic(() => import("./BlogEditor").then((mod) => mod.BlogEditor), {
  ssr: false,
  loading: () => <p className="p-6 text-sm text-ink-soft">Loading the editor…</p>,
});

export function EditPostButton({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  const close = useCallback(() => {
    // Unsaved work is only thrown away on purpose.
    if (dirty && !window.confirm("Discard your unsaved changes?")) return;
    setOpen(false);
    setDirty(false);
  }, [dirty]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-ink-soft transition-colors hover:border-accent-line hover:text-ink"
      >
        Edit post
      </button>

      {open && (
        <div className="fixed inset-0 z-50 overflow-auto bg-canvas">
          <BlogEditor slug={slug} onClose={close} onDirtyChange={setDirty} />
        </div>
      )}
    </>
  );
}
