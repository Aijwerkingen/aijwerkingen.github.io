// Rich-text primitives for the content config.
//
// Most website copy is plain strings, held in `src/content.config.ts`. Some
// sentences, though, carry a link, a bold run, or the brand name (which is a
// live client component so it can switch under the admin preview). Rather than
// keep those sentences trapped inside the page components as JSX, we describe
// them here as data — a list of inline "spans" — and render them with the
// `<Prose>` / `<RichLine>` components in `src/content/RichText.tsx`.
//
// This keeps ALL copy in one editable file (content.config.ts) while still
// producing real links and a reactive brand name in the output. No JSX lives in
// this module, so content.config.ts stays a plain data file importable by both
// server components and the static route handlers (llms.txt, feed.xml).

/** One inline piece of a sentence. */
export type Span =
  /** Literal text. */
  | string
  /** The active brand name (rendered via <BrandName>, so it tracks the preview). */
  | { brand: true }
  /** A link. `href` starting with http/mailto renders as <a>; otherwise <Link>. */
  | { text: string; href: string }
  /** A bold run. */
  | { strong: string };

/** A block in a long-form document body. */
export type Block =
  | { p: Span[] }
  | { h2: string }
  | { h3: string }
  | { ul: Span[][] }
  | { ol: Span[][] }
  /** A callout/aside (e.g. the crisis note on /contact). */
  | { note: Span[] };

/* ── span helpers (read naturally inside the config) ─────────────────────── */

/** The brand name span. */
export const brand: Span = { brand: true };

/** A link span. Use a site-relative path ("/faq") or a full URL / mailto:. */
export const a = (text: string, href: string): Span => ({ text, href });

/** A bold run. */
export const b = (strong: string): Span => ({ strong });

/* ── block helpers ───────────────────────────────────────────────────────── */

export const p = (...spans: Span[]): Block => ({ p: spans });
export const h2 = (text: string): Block => ({ h2: text });
export const h3 = (text: string): Block => ({ h3: text });
export const ul = (...items: Span[][]): Block => ({ ul: items });
export const ol = (...items: Span[][]): Block => ({ ol: items });
export const note = (...spans: Span[]): Block => ({ note: spans });
