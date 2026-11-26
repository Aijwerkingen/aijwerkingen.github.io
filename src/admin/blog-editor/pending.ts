"use client";

// Images chosen but not yet committed, keyed by the public path they will live at.
//
// A module-level store rather than React state or a ref, because the Image
// extension reads it from `renderHTML`, which ProseMirror calls outside React's
// render. Handing an extension a ref would be reading that ref during render,
// which React 19's lint rules (rightly) reject; the component keeps a state
// mirror for its own rendering.
//
// There is one editor open at a time, so a singleton is enough. `resetPending()`
// runs when a post loads, so nothing survives from a previous open.

export type PendingImage = {
  /** data: URL for display before the file exists on the site. */
  dataUrl: string;
  /** Raw base64 of the final bytes - what gets committed. */
  base64: string;
};

const images = new Map<string, PendingImage>();

export function getPending(path: string): PendingImage | undefined {
  return images.get(path);
}

/** Stores an image and returns a fresh copy of the whole store, for state. */
export function setPendingImage(path: string, image: PendingImage): Map<string, PendingImage> {
  images.set(path, image);
  return new Map(images);
}

/** The store as it stands, as a copy. */
export function allPending(): Map<string, PendingImage> {
  return new Map(images);
}

export function resetPending(): void {
  images.clear();
}
