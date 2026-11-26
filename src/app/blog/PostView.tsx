// The post layout, in one place.
//
// Presentational only: no hooks, no `"use client"`, no Node APIs. The published
// page (src/app/blog/[slug]/page.tsx) and the internal editor both render this,
// which is what makes the editor's Edit and Preview modes match the real post
// instead of merely resembling it. See docs/BLOG_EDITOR_PHASE2_PLAN.md 4.2.
//
// The page keeps the JSON-LD script, metadata and notFound(); everything inside
// the <article> lives here.

import Link from "next/link";
import type { ReactNode } from "react";
import { tagSlug } from "@/lib/tags";
import { formatDate } from "./format";

export function PostView({
  title,
  date,
  readingMinutes,
  author,
  image,
  imageAlt,
  tags,
  bodyHtml,
  bodySlot,
  resolveSrc = (src) => src,
  notice,
  headerExtra,
}: {
  title: string;
  /** ISO `YYYY-MM-DD`; displayed in the site's locale. */
  date: string;
  readingMinutes: number;
  author?: string;
  image?: string;
  imageAlt?: string;
  tags?: string[];
  /** Rendered as trusted HTML. Ignored when `bodySlot` is given. */
  bodyHtml?: string;
  /**
   * Live content, passed by the editor. When present it replaces the rendered
   * HTML entirely, so the same page chrome surrounds the editable body. Its root
   * carries `prose-doc` itself, so it is not wrapped again here.
   */
  bodySlot?: ReactNode;
  /** Applied to the cover image, so the editor can show a not-yet-sent image. */
  resolveSrc?: (src: string) => string;
  /** Optional slot after the title (staging-only draft notice). */
  notice?: ReactNode;
  /** Optional slot at the end of the date line (staging-only Edit button). */
  headerExtra?: ReactNode;
}) {
  return (
    <article>
      <header className="border-b border-line bg-canvas">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <Link
            href="/blog"
            className="text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
          >
            ← All posts
          </Link>

          <h1 className="font-display mt-4 text-4xl font-extrabold tracking-tight text-balance">
            {title}
          </h1>

          {notice}

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
            <time dateTime={date}>{formatDate(date)}</time>
            <span aria-hidden="true">·</span>
            <span>{readingMinutes} min read</span>
            {author && (
              <>
                <span aria-hidden="true">·</span>
                <span>{author}</span>
              </>
            )}
            {headerExtra}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-12">
        {image && (
          // Static export has no image optimizer (next.config
          // `images.unoptimized`), so a plain <img> is the honest primitive.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveSrc(image)}
            alt={imageAlt ?? ""}
            className="mb-10 w-full rounded-2xl border border-line"
          />
        )}

        {bodySlot ?? (
          // Trusted, in-repo Markdown rendered to HTML at build time.
          <div className="prose-doc" dangerouslySetInnerHTML={{ __html: bodyHtml ?? "" }} />
        )}

        {tags && tags.length > 0 && (
          <ul className="mt-12 flex flex-wrap gap-2 border-t border-line pt-8">
            {tags.map((tag) => (
              <li key={tag}>
                <Link
                  href={`/blog/tags/${tagSlug(tag)}`}
                  className="inline-block rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-soft transition-colors hover:border-accent-line hover:text-ink"
                >
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
