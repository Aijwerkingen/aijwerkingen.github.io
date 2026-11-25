"use client";

// "Add image" / "Change cover image": pick a file, describe it, insert.
//
// The file never leaves the browser as a file - it is scaled and re-encoded here
// (which also strips any location data the camera wrote), then handed up as
// bytes to be committed. See docs/BLOG_EDITOR_PHASE2_PLAN.md step 5.

import { useState } from "react";
import { ImageError, base64ToBytes, fileStem, hash8, processImage, publicPath, type ProcessedImage } from "./images";

export type ImageResult = {
  /** Public path, e.g. /blog/my-post/cover-1a2b3c4d.webp */
  path: string;
  alt: string;
  /** data: URL for previewing before the image exists on the site. */
  dataUrl: string;
  /** Raw base64 of the final bytes. */
  base64: string;
};

const MESSAGES: Record<string, string> = {
  type: "That file type is not supported. Please choose a PNG, JPEG or WebP image.",
  "input-too-large": "That image is bigger than 15 MB. Please choose a smaller one.",
  "output-too-large":
    "That image is still too large after resizing. Please choose a simpler or smaller image.",
  unreadable: "We could not read that image file. Please try another one.",
};

export function ImageDialog({
  slug,
  mode,
  initialAlt = "",
  onCancel,
  onDone,
}: {
  slug: string;
  mode: "inline" | "cover";
  /** Prefilled when replacing an image that already has a description. */
  initialAlt?: string;
  onCancel: () => void;
  onDone: (result: ImageResult) => void;
}) {
  const [processed, setProcessed] = useState<ProcessedImage | null>(null);
  const [fileName, setFileName] = useState("");
  const [alt, setAlt] = useState(initialAlt);
  const [decorative, setDecorative] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function choose(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const result = await processImage(file);
      setProcessed(result);
      setFileName(file.name);
    } catch (err) {
      setProcessed(null);
      setError(
        err instanceof ImageError
          ? (MESSAGES[err.message] ?? "That image could not be used. Please try another one.")
          : "That image could not be used. Please try another one.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function insert() {
    if (!processed) return;
    const stem = mode === "cover" ? "cover" : fileStem(fileName);
    const hash = await hash8(base64ToBytes(processed.base64));
    onDone({
      path: publicPath(slug, stem, hash, processed.ext),
      alt: decorative ? "" : alt.trim(),
      dataUrl: processed.dataUrl,
      base64: processed.base64,
    });
  }

  const canInsert = Boolean(processed) && (decorative || alt.trim().length > 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-auto bg-ink/40 p-4">
      <div className="mt-16 w-full max-w-lg rounded-xl border border-line bg-surface p-5 shadow-lg">
        <h3 className="font-display text-base font-bold">
          {mode === "cover" ? "Cover image" : "Add image"}
        </h3>

        {mode === "cover" && (
          <p className="mt-1 text-xs text-ink-soft">
            Wide images (about 1200×630) look best when shared.
          </p>
        )}

        <label className="mt-4 block">
          <span className="eyebrow mb-2 block">Picture</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            onChange={(event) => void choose(event.target.files?.[0])}
            className="block w-full cursor-pointer rounded-lg border border-line bg-canvas px-3 py-2 text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-line file:bg-surface file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-ink-soft"
          />
        </label>

        {busy && <p className="mt-3 text-sm text-ink-soft">Preparing the image…</p>}

        {error && (
          <p className="mt-3 rounded-lg border border-notice-line bg-notice-soft px-3 py-2 text-sm text-notice">
            {error}
          </p>
        )}

        {processed && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={processed.dataUrl}
              alt=""
              className="mt-4 max-h-64 w-full rounded-lg border border-line object-contain"
            />
            <p className="mt-1 text-xs text-ink-soft">
              {processed.width} × {processed.height} · {Math.max(1, Math.round(processed.bytes / 1024))} KB ·{" "}
              {processed.ext === "webp" ? "WebP" : "JPEG"}
            </p>

            <label className="mt-4 block">
              <span className="eyebrow mb-2 block">Describe the image</span>
              <input
                value={alt}
                onChange={(event) => setAlt(event.target.value)}
                disabled={decorative}
                placeholder="What is in it, for someone who cannot see it"
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm disabled:opacity-50"
              />
              <span className="mt-1 block text-xs text-ink-soft">
                Read aloud by screen readers and shown if the picture fails to load.
              </span>
            </label>

            <label className="mt-3 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={decorative}
                onChange={(event) => setDecorative(event.target.checked)}
                className="mt-0.5"
              />
              <span>
                Decorative image
                <span className="block text-xs text-ink-soft">
                  It adds no meaning, so it needs no description.
                </span>
              </span>
            </label>
          </>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => void insert()}
            disabled={!canInsert}
            className="cursor-pointer rounded-lg border border-line bg-canvas px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface disabled:cursor-default disabled:opacity-40"
          >
            {mode === "cover" ? "Use this image" : "Insert image"}
          </button>
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
