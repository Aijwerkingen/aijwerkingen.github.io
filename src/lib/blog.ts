// Build-time blog engine.
//
// Posts are plain Markdown files in `content/blog/*.md` with YAML frontmatter.
// This module reads and renders them with Node's `fs` at BUILD time only - under
// `output: "export"` there is no server, so everything here runs once during
// `next build` and is baked into static HTML. Nothing in this file reaches the
// browser.
//
// Post state is controlled with frontmatter flags:
//   - `published: false`  - DEACTIVATED: post is taken down. Excluded from the
//     build, listing, tags, sitemap, and feed; its URL 404s. Flip it back to
//     `true` (or remove it) to re-activate. Set it on a post that was live.
//   - `draft: true`        - legacy alias for the same state, kept for
//     compatibility (pre-publication drafts). Prefer `published`.
//   - absent               - active (default).

import fs from "node:fs";
import path from "node:path";
import { load as yamlLoad } from "js-yaml";
import { marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";

// GFM + auto heading IDs. The IDs give every ## / ### a stable anchor, which is
// what lets answer engines (and readers) deep-link to a specific passage - a
// small but real AEO/GEO win. Configured once at module load.
marked.use(gfmHeadingId());
marked.setOptions({ gfm: true, breaks: false });

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

// Frontmatter delimiter parser. gray-matter would normally do this, but it is
// pinned to the js-yaml v3 `safeLoad` API, which this repo's js-yaml (v5, via
// the `overrides` pin) removed - so we split the `---` fence ourselves and hand
// the block to js-yaml's modern `load`. Keeps us on a single, current yaml.
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function parseFrontmatter(raw: string): {
  data: Record<string, unknown>;
  content: string;
} {
  const match = raw.match(FRONTMATTER);
  if (!match) return { data: {}, content: raw };
  const data = (yamlLoad(match[1]) as Record<string, unknown>) ?? {};
  return { data, content: match[2] };
}

/**
 * Frontmatter as authored. Only `title`, `description`, and `date` are required;
 * everything else is optional so a post can be as light as three lines.
 */
export type PostFrontmatter = {
  title: string;
  description: string;
  /** ISO date (YYYY-MM-DD). Drives ordering and the `datePublished` schema. */
  date: string;
  /** ISO date of the last substantive edit. Feeds `dateModified`. */
  updated?: string;
  /** Display name of the author, e.g. "AIjwerkingen team". */
  author?: string;
  tags?: string[];
  /**
   * Path (under /public) to the cover image, e.g. "/blog/my-post/cover.png".
   * Used on the card, at the top of the article, and as the per-post OG image.
   */
  image?: string;
  /** Alt text for `image`. Always write one - it is required for accessibility. */
  imageAlt?: string;
  /**
   * Activation flag. `false` deactivates the post: it is excluded from the
   * build, listing, tags, sitemap, and feed, and its URL 404s. Absent
   * (or `true`) = active. Use this to take a published post down without
   * deleting it.
   */
  published?: boolean;
  /**
   * Legacy alias for deactivation, kept for compatibility (pre-publication
   * drafts). New posts should use `published` instead.
   */
  draft?: boolean;
};

export type PostMeta = PostFrontmatter & {
  slug: string;
  /** Estimated reading time in whole minutes (>= 1). */
  readingMinutes: number;
};

export type Post = PostMeta & {
  /** Rendered, trusted HTML. Authored in-repo, so not from an untrusted source. */
  html: string;
};

function readPostFile(slug: string): { data: PostFrontmatter; content: string } {
  const raw = fs.readFileSync(path.join(BLOG_DIR, `${slug}.md`), "utf8");
  const { data, content } = parseFrontmatter(raw);
  return { data: data as PostFrontmatter, content };
}

function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** All `.md` slugs on disk (no draft filtering, no ordering). */
function allSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter(
      (name) =>
        name.endsWith(".md") &&
        !name.startsWith("_") &&
        // The authoring guide is documentation, not a post.
        name.toLowerCase() !== "readme.md",
    )
    .map((name) => name.replace(/\.md$/, ""));
}

/**
 * Drafts and deactivated posts are dropped unless `BLOG_INCLUDE_DRAFTS=1` is
 * set (handy for local preview: `BLOG_INCLUDE_DRAFTS=1 npm run dev`). A
 * production build never ships them, so they can never leak into the static
 * output or the sitemap.
 */
function includeDrafts(): boolean {
  return process.env.BLOG_INCLUDE_DRAFTS === "1";
}

/** True when the post should be hidden (deactivated or legacy draft). */
function isHidden(post: { published?: boolean; draft?: boolean }): boolean {
  return post.published === false || post.draft === true;
}

/**
 * Metadata for every published post, newest first. This is the single source of
 * truth for the listing page and the sitemap, so the two can never disagree
 * about which posts exist.
 */
export function getAllPosts(): PostMeta[] {
  return allSlugs()
    .map((slug) => {
      const { data, content } = readPostFile(slug);
      return { ...data, slug, readingMinutes: readingMinutes(content) };
    })
    .filter((post) => includeDrafts() || !isHidden(post))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Slugs of published posts - drives `generateStaticParams`. */
export function getPublishedSlugs(): string[] {
  return getAllPosts().map((post) => post.slug);
}

/** A single post with rendered HTML, or `null` if the slug is unknown/hidden. */
export function getPostBySlug(slug: string): Post | null {
  if (!allSlugs().includes(slug)) return null;
  const { data, content } = readPostFile(slug);
  if (isHidden(data) && !includeDrafts()) return null;

  return {
    ...data,
    slug,
    readingMinutes: readingMinutes(content),
    html: marked.parse(content) as string,
  };
}

/**
 * URL-safe form of a tag, e.g. "Well-being 101" -> "well-being-101". Tags are
 * authored freely in frontmatter, so the display text and the slug are kept
 * distinct: the slug is what appears in `/blog/tags/<slug>`, the display text is
 * what the reader sees.
 */
export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** All distinct tags across published posts, alphabetical (display text). */
export function getAllTags(): string[] {
  const set = new Set<string>();
  for (const post of getAllPosts()) post.tags?.forEach((t) => set.add(t));
  return [...set].sort();
}

/** {slug, tag} for every distinct tag - drives the tag pages' static params. */
export function getAllTagSlugs(): { slug: string; tag: string }[] {
  return getAllTags().map((tag) => ({ slug: tagSlug(tag), tag }));
}

/**
 * Posts carrying `slug` (matched on the slugified tag), plus the tag's display
 * text taken from the first post that uses it. Returns `null` for an unknown
 * tag so the page can 404 rather than render an empty hub.
 */
export function getPostsByTag(
  slug: string,
): { tag: string; posts: PostMeta[] } | null {
  const posts = getAllPosts().filter((post) =>
    post.tags?.some((t) => tagSlug(t) === slug),
  );
  if (posts.length === 0) return null;

  const tag =
    posts[0].tags?.find((t) => tagSlug(t) === slug) ?? slug;
  return { tag, posts };
}
