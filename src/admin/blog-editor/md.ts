"use client";

// Pure text helpers for the blog editor - no React, no DOM. The directive is
// here only because everything under src/admin/blog-editor/ is client-side
// (docs/BLOG_EDITOR_PLAN.md step 4).
//
// Frontmatter is treated as raw text throughout. Field-level edits replace whole
// lines, so an untouched line keeps its exact formatting: parsing the block with
// js-yaml and dumping it back would reformat quoting, turn `date: 2026-08-07`
// into an ISO timestamp, and rewrite every key the user never touched
// (docs/BLOG_EDITOR_PHASE2_PLAN.md section 3).

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

/**
 * Replaces the frontmatter inside a whole file, leaving every other byte - the
 * blank line after the fence, the body text - exactly as it was.
 *
 * This is what keeps a details-only edit a two-line diff: `assemble` would
 * rebuild the separator, and `split` hands back a body that still carries one of
 * its newlines, so round-tripping through the two would add a blank line.
 */
export function replaceFrontmatter(raw: string, frontmatter: string): string {
  const match = raw.match(FRONTMATTER);
  if (!match || !match[1]) return assemble(frontmatter, match ? match[2] : raw);
  const start = (match.index ?? 0) + match[0].indexOf(match[1]);
  return raw.slice(0, start) + frontmatter + raw.slice(start + match[1].length);
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

/**
 * A line that belongs to the value above it: indented continuation text, a
 * `- item` sequence entry (YAML allows those at the same indent as the key), or
 * a bare `-`.
 */
const CONTINUATION = /^(?:\s+\S|-\s|-$)/;

/** The [start, end) line span of `key:`, including its block value if any. */
function fieldSpan(lines: string[], key: string): { start: number; end: number } | null {
  const start = lines.findIndex((line) => line.startsWith(`${key}:`));
  if (start === -1) return null;
  let end = start + 1;
  while (end < lines.length && CONTINUATION.test(lines[end])) end++;
  return { start, end };
}

/**
 * Replaces `key:` and its whole value - a following indented continuation, or a
 * block-style `- item` list - with a single line. When the key is absent it goes
 * after `afterKey`'s line (and block), else at the end.
 *
 * `valueYaml` must already be YAML: `JSON.stringify(s)` for a string,
 * `JSON.stringify(array)` for a flow sequence.
 */
export function withField(
  frontmatter: string,
  key: string,
  valueYaml: string,
  afterKey?: string,
): string {
  const lines = frontmatter.split("\n");
  const span = fieldSpan(lines, key);
  if (span) {
    lines.splice(span.start, span.end - span.start, `${key}: ${valueYaml}`);
    return lines.join("\n");
  }
  const after = afterKey ? fieldSpan(lines, afterKey) : null;
  if (after) {
    lines.splice(after.end, 0, `${key}: ${valueYaml}`);
  } else {
    lines.push(`${key}: ${valueYaml}`);
  }
  return lines.join("\n");
}

/** Removes `key:` and its whole value. A missing key is a no-op. */
export function withoutField(frontmatter: string, key: string): string {
  const lines = frontmatter.split("\n");
  const span = fieldSpan(lines, key);
  if (!span) return frontmatter;
  lines.splice(span.start, span.end - span.start);
  return lines.join("\n");
}

/**
 * Comparison form of rendered HTML for the equivalence check (section 4.4):
 * whitespace between tags and runs of whitespace collapse, so a re-serialisation
 * that only moves whitespace counts as identical.
 */
export function squash(html: string): string {
  return html.replace(/>\s+</g, "><").replace(/\s+/g, " ").trim();
}

/**
 * A short, human-readable note about where two texts first diverge. Logged to the
 * console when a post opens read-only, so the web team can see what the visual
 * editor could not represent.
 */
export function firstDifference(a: string, b: string): string {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const from = Math.max(0, i - 60);
  return `first difference at ${i}: ${JSON.stringify(a.slice(from, i + 140))} vs ${JSON.stringify(
    b.slice(from, i + 140),
  )}`;
}
