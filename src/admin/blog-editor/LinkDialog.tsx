"use client";

// The link dialog - what "Link" and Ctrl/Cmd+K open. Replaces the browser's
// window.prompt, which gave no validation, no way to see or remove an existing
// link, and looked like a browser error to a non-technical editor.

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { normaliseLink } from "./links";

export function LinkDialog({
  editor,
  initialHref = "",
  selectionText = "",
  onCancel,
  onApplied,
}: {
  editor: Editor;
  /** Set when the cursor sits inside an existing link. */
  initialHref?: string;
  /** The selected text, when there is one. */
  selectionText?: string;
  onCancel: () => void;
  onApplied: () => void;
}) {
  const [address, setAddress] = useState(initialHref);
  const [text, setText] = useState(selectionText);
  const [error, setError] = useState<string | null>(null);

  const editing = initialHref !== "";
  const insertingText = !editing && selectionText === "";

  function apply() {
    const href = normaliseLink(address);
    if (!href) {
      setError("That does not look like a web address. Use one starting with https://, or a page on this site such as /report.");
      return;
    }
    if (insertingText) {
      if (!text.trim()) {
        setError("Give the link something to say.");
        return;
      }
      editor
        .chain()
        .focus()
        .insertContent({ type: "text", text: text.trim(), marks: [{ type: "link", attrs: { href } }] })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    onApplied();
  }

  function remove() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    onApplied();
  }

  function open() {
    const href = normaliseLink(address);
    if (href) window.open(href, "_blank", "noopener");
  }

  const current = normaliseLink(address);

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-auto bg-ink/40 p-4">
      <div className="mt-24 w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-lg">
        <h3 className="font-display text-base font-bold">{editing ? "Edit link" : "Add link"}</h3>

        {selectionText && !editing && (
          <p className="mt-1 text-xs text-ink-soft">
            “{selectionText.length > 60 ? `${selectionText.slice(0, 60)}…` : selectionText}” will
            become the link.
          </p>
        )}

        {insertingText && (
          <label className="mt-4 block">
            <span className="eyebrow mb-2 block">Text to show</span>
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
            />
          </label>
        )}

        <label className="mt-4 block">
          <span className="eyebrow mb-2 block">Web address</span>
          <input
            value={address}
            onChange={(event) => {
              setAddress(event.target.value);
              setError(null);
            }}
            placeholder="https://example.org/study"
            autoFocus
            className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-xs text-ink-soft">
            You can also type just the site, like example.org - https:// is added for you.
          </span>
        </label>

        {error && (
          <p className="mt-3 rounded-lg border border-notice-line bg-notice-soft px-3 py-2 text-sm text-notice">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={apply}
            className="cursor-pointer rounded-lg border border-line bg-canvas px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface"
          >
            {editing ? "Save link" : "Add link"}
          </button>
          {editing && (
            <>
              <button
                type="button"
                onClick={open}
                disabled={!current}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:text-ink disabled:cursor-default disabled:opacity-40"
              >
                Open
              </button>
              <button
                type="button"
                onClick={remove}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
              >
                Remove link
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
