// The one Markdown renderer.
//
// Both the build (src/lib/blog.ts) and the editor's Preview use this, so what an
// editor sees cannot drift from what the site publishes. That is the whole point
// of the module - do not add a second `marked` call anywhere else.
//
// No Node APIs and no `"use client"`: it runs at build time on the server and in
// the browser under the editor, so it has to be importable from both.
//
// See docs/BLOG_EDITOR_PHASE2_PLAN.md section 4.1.

import { Marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";

/**
 * Renders Markdown to HTML exactly as the blog does.
 *
 * A fresh instance per call on purpose: heading-id de-duplication is per
 * document, and `marked`'s global state is never touched. The output is
 * byte-identical to the module-level `marked.use(gfmHeadingId())` plus
 * `setOptions({ gfm: true, breaks: false })` that this replaced - that equality
 * is acceptance check 2 of the phase-2 plan.
 */
export function renderMarkdown(markdown: string): string {
  return new Marked(gfmHeadingId(), { gfm: true, breaks: false }).parse(markdown) as string;
}
