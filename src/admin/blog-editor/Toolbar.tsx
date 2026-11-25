"use client";

// Formatting toolbar for the blog editor. Inline code and the usual block
// types; the table button inserts a 3x3 table (available because
// @tiptap/extension-table is installed).
// See docs/BLOG_EDITOR_PLAN.md step 4.

import type { Editor } from "@tiptap/react";

const BUTTON =
  "cursor-pointer rounded-md border border-line px-2 py-1 text-xs font-semibold " +
  "text-ink-soft transition-colors hover:bg-surface hover:text-ink";

export function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const active = (name: string, attrs?: Record<string, unknown>) =>
    editor.isActive(name, attrs) ? " bg-surface text-ink" : "";

  function setLink() {
    if (!editor) return;
    const previous = (editor.getAttributes("link").href as string | undefined) ?? "https://";
    const url = window.prompt("Link URL", previous);
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-line bg-surface px-3 py-2">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={BUTTON + active("bold")}
      >
        Bold
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={BUTTON + active("italic")}
      >
        Italic
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={BUTTON + active("heading", { level: 2 })}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={BUTTON + active("heading", { level: 3 })}
      >
        H3
      </button>
      <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={BUTTON + active("bulletList")}
      >
        Bullets
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={BUTTON + active("orderedList")}
      >
        Numbers
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={BUTTON + active("blockquote")}
      >
        Quote
      </button>
      <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
      <button type="button" onClick={setLink} className={BUTTON + active("link")}>
        Link
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={BUTTON + active("code")}
      >
        Code
      </button>
      <button
        type="button"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        className={BUTTON}
      >
        Table
      </button>
      <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className={BUTTON + " disabled:cursor-default disabled:opacity-40"}
      >
        Undo
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className={BUTTON + " disabled:cursor-default disabled:opacity-40"}
      >
        Redo
      </button>
    </div>
  );
}
