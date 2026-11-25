"use client";

// Pure text helpers for the blog editor - no React, no DOM. The directive is
// here only because everything under src/admin/blog-editor/ is client-side
// (docs/BLOG_EDITOR_PLAN.md step 4).
//
// Frontmatter is treated as raw text throughout: parsing it with js-yaml and
// dumping it back would reformat quoting and turn `date: 2026-08-07` into an
// ISO timestamp. Every edit here is a plain string edit.

/** Same fence split as src/lib/blog.ts - keep the two in step. */
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function split(raw: string): { frontmatter: string; body: string } {
  const match = raw.match(FRONTMATTER);
  if (!match) return { frontmatter: "", body: raw };
  return { frontmatter: match[1], body: match[2] };
}

export function assemble(frontmatter: string, body: string): string {
  return `---\n${frontmatter}\n---\n\n${body}`;
}

export function isMarkdownFile(raw: string): boolean {
  return /^---\r?\n/.test(raw);
}

/**
 * Comparison form: trailing whitespace per line and runs of 3+ newlines are
 * formatting noise that a Markdown round trip may legitimately change.
 */
export function normalise(markdown: string): string {
  return markdown.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
}

/** Exactly one trailing newline. */
export function tidy(markdown: string): string {
  return markdown.replace(/\s+$/, "") + "\n";
}

/** Today as YYYY-MM-DD, UTC. */
export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Sets `updated:` in a frontmatter block. Replaces the existing line if there is
 * one, otherwise inserts it after `date:` (or appends when there is no `date:`).
 */
export function withUpdated(frontmatter: string, date: string): string {
  if (/^updated:.*$/m.test(frontmatter)) {
    return frontmatter.replace(/^updated:.*$/m, `updated: ${date}`);
  }
  const lines = frontmatter.split("\n");
  const at = lines.findIndex((line) => /^date:/.test(line));
  if (at === -1) {
    lines.push(`updated: ${date}`);
  } else {
    lines.splice(at + 1, 0, `updated: ${date}`);
  }
  return lines.join("\n");
}
