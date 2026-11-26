"use client";

// Link targets, in one place, because three things must agree: the Link dialog,
// Tiptap's paste/autolink handling, and the editor's own validation
// (docs/BLOG_EDITOR_PHASE2_PLAN.md section 3, "Link targets").

/** Schemes we accept, plus site-relative paths. */
const ALLOWED_PROTOCOLS = ["https:", "http:", "mailto:"];

/** A bare host or path that should get https:// added, e.g. example.org/x. */
const LOOKS_LIKE_HOST = /^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/\S*)?$/i;

/**
 * Normalises what someone typed into an href, or returns null when it cannot be
 * a link we allow. `example.org` becomes `https://example.org`; `javascript:`
 * and `data:` are refused rather than repaired.
 */
export function normaliseLink(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  // Site-relative: /blog, /report#top
  if (value.startsWith("/")) {
    return value.startsWith("//") ? null : value; // protocol-relative is not site-relative
  }

  // Anything with a scheme must be one we allow. This is what refuses
  // javascript:, data:, vbscript:, file: and friends.
  const scheme = value.match(/^([a-z][a-z0-9+.-]*):/i);
  if (scheme) {
    const normalised = `${scheme[1].toLowerCase()}:`;
    return ALLOWED_PROTOCOLS.includes(normalised) ? value : null;
  }

  if (value.includes("@") && !value.includes("/")) return `mailto:${value}`;
  if (LOOKS_LIKE_HOST.test(value)) return `https://${value}`;
  return null;
}

/** True when an href (already absolute) is one we allow. Used by the paste rule. */
export function isAllowedLink(href: string): boolean {
  const value = href.trim();
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  const scheme = value.match(/^([a-z][a-z0-9+.-]*):/i);
  return scheme ? ALLOWED_PROTOCOLS.includes(`${scheme[1].toLowerCase()}:`) : false;
}

export { ALLOWED_PROTOCOLS };
