// Estimated reading time. Pure, no Node APIs: the editor shows the same figure
// the published page does (docs/BLOG_EDITOR_PHASE2_PLAN.md section 4.1).

/** Estimated reading time in whole minutes (>= 1), at 200 words per minute. */
export function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
