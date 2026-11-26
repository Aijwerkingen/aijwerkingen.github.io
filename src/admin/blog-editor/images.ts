"use client";

// Image handling for the blog editor, all in the browser before anything is
// sent (docs/BLOG_EDITOR_PHASE2_PLAN.md section 3 and step 5).
//
// Two rules decide the design:
//   - Re-encoding is the normaliser. Scaling and re-encoding also drops EXIF and
//     GPS, which matters for a privacy-first site.
//   - The document only ever holds the final public path. Base64 previews live in
//     the editor's pending store, never in the Markdown (CSP `img-src 'self'
//     data:` would allow a blob preview, but a data URL in the file would not).

export type ProcessedImage = {
  /** Raw base64 (no data: prefix) of the final bytes - what the endpoint commits. */
  base64: string;
  /** data: URL for previewing before the file exists. Never stored in the post. */
  dataUrl: string;
  ext: "webp" | "jpg";
  width: number;
  height: number;
  bytes: number;
};

/** Accepted input types. No SVG (scriptable), no GIF (animation, size). */
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 1.5 * 1024 * 1024;
const MAX_SIDE = 1600;

export class ImageError extends Error {}

/** WebP encoding is not universal (older Safari); probe once. */
let webpSupport: boolean | null = null;
function supportsWebp(): boolean {
  if (webpSupport === null) {
    try {
      webpSupport = document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp");
    } catch {
      webpSupport = false;
    }
  }
  return webpSupport;
}

/** Bytes in a base64 payload. */
export function base64Bytes(base64: string): number {
  const clean = base64.length - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
  return Math.floor((clean * 3) / 4);
}

/** The base64 half of a data: URL. */
export function stripDataUrl(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  return comma === -1 ? "" : dataUrl.slice(comma + 1);
}

/**
 * Reads, scales and re-encodes a chosen file. Throws ImageError with a message
 * key for the dialog to translate.
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  if (!ACCEPTED.includes(file.type)) throw new ImageError("type");
  if (file.size > MAX_INPUT_BYTES) throw new ImageError("input-too-large");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ImageError("unreadable");
  }

  // Scale the longest side down; never upscale.
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new ImageError("unreadable");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const ext: "webp" | "jpg" = supportsWebp() ? "webp" : "jpg";
  let dataUrl = encode(canvas, ext, 0.85);
  if (base64Bytes(stripDataUrl(dataUrl)) > MAX_OUTPUT_BYTES) {
    dataUrl = encode(canvas, ext, 0.7); // one retry, then refuse
  }

  const base64 = stripDataUrl(dataUrl);
  const bytes = base64Bytes(base64);
  if (bytes > MAX_OUTPUT_BYTES) throw new ImageError("output-too-large");

  return { base64, dataUrl, ext, width, height, bytes };
}

/**
 * Encodes the canvas. The JPEG path paints white first: a transparent PNG would
 * otherwise come out with a black background.
 */
function encode(source: HTMLCanvasElement, ext: "webp" | "jpg", quality: number): string {
  if (ext === "webp") return source.toDataURL("image/webp", quality);
  const flat = document.createElement("canvas");
  flat.width = source.width;
  flat.height = source.height;
  const ctx = flat.getContext("2d");
  if (!ctx) throw new ImageError("unreadable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, flat.width, flat.height);
  ctx.drawImage(source, 0, 0);
  return flat.toDataURL("image/jpeg", quality);
}

/** First 8 hex characters of the SHA-256 of the final bytes. */
export async function hash8(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as unknown as ArrayBuffer);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 8);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/**
 * A filename-safe stem from the original name: lowercase, `[a-z0-9-]`, at most
 * 40 characters. Covers pass "cover" so the path says what the image is for.
 */
export function fileStem(name: string, fallback = "image"): string {
  const stem = name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
  return stem || fallback;
}

/** Public path for an image; `public` + this is the path in the repository. */
export function publicPath(slug: string, stem: string, hash: string, ext: string): string {
  return `/blog/${slug}/${stem}-${hash}.${ext}`;
}

/** True when the chosen file is one the editor will accept. */
export function isAcceptedFile(file: File): boolean {
  return ACCEPTED.includes(file.type) && file.size <= MAX_INPUT_BYTES;
}

export const IMAGE_LIMITS = { MAX_INPUT_BYTES, MAX_OUTPUT_BYTES, MAX_SIDE };
