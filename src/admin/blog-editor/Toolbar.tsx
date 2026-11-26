"use client";

// Formatting toolbar. Words, not symbols: the people using this have never heard
// of Markdown (docs/BLOG_EDITOR_PHASE2_PLAN.md section 1).
//
// "Link" opens a dialog rather than window.prompt, and image and source actions
// live here so everything an editor can insert is in one row.

import type { Editor } from "@tiptap/react";

const BUTTON =
  "cursor-pointer rounded-md border border-line px-2 py-1 text-xs font-semibold " +
  "text-ink-soft transition-colors hover:bg-canvas hover:text-ink";

export function Toolbar({
  editor,
  onAddImage,
  onDescribeImage,
  onReplaceImage,
  onRemoveImage,
  onOpenLink,
  onAddSource,
}: {
  editor: Editor | null;
  onAddImage: () => void;
  onDescribeImage: () => void;
  onReplaceImage: () => void;
  onRemoveImage: () => void;
  onOpenLink: () => void;
  onAddSource: () => void;
}) {
  if (!editor) return null;

  const active = (name: string, attrs?: Record<string, unknown>) =>
    editor.isActive(name, attrs) ? " bg-canvas text-ink" : "";

  const onImage = editor.isActive("image");

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
      <button type="button" onClick={onOpenLink} className={BUTTON + active("link")}>
        Link
      </button>
      <button
        type="button"
        onClick={onAddImage}
        className={BUTTON + (onImage ? " bg-canvas text-ink" : "")}
      >
        Add image
      </button>
      <button type="button" onClick={onAddSource} className={BUTTON}>
        Add source
      </button>
      <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
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

      {onImage && (
        <>
          <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
          <button type="button" onClick={onDescribeImage} className={BUTTON + " bg-canvas text-ink"}>
            Describe
          </button>
          <button type="button" onClick={onReplaceImage} className={BUTTON}>
            Replace
          </button>
          <button type="button" onClick={onRemoveImage} className={BUTTON}>
            Remove
          </button>
        </>
      )}
    </div>
  );
}
