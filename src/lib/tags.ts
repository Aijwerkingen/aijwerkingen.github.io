// Tag slugs, kept separate from src/lib/blog.ts.
//
// blog.ts reads posts from disk with `node:fs`, so anything the client editor
// imports must not reach it. The tag-chip links in PostView need `tagSlug`, and
// PostView is imported by the editor - hence this pure module. blog.ts re-exports
// it, so existing `@/lib/blog` imports keep working.

/**
 * URL-safe form of a tag, e.g. "Well-being 101" -> "well-being-101". Tags are
 * authored freely in frontmatter, so the display text and the slug are kept
 * distinct: the slug appears in `/blog/tags/<slug>`, the display text is what the
 * reader sees.
 */
export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
