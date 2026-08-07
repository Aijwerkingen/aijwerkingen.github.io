import Link from "next/link";
import type { PostMeta } from "@/lib/blog";
import { tagSlug } from "@/lib/blog";
import { formatDate } from "./format";

/**
 * A post summary card, shared by the blog index and every tag page.
 *
 * The whole card is a click target via a "stretched link" (the title link's
 * `::after` covers the card). The tag chips are real links too, so they must sit
 * ABOVE that overlay to stay individually clickable - `relative z-10` lifts them
 * out of the stretched link's reach. Without it the chips look clickable but get
 * swallowed by the card link.
 */
export function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="group relative rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-accent-line sm:p-8">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span aria-hidden="true">·</span>
        <span>{post.readingMinutes} min read</span>
      </div>

      <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-balance">
        <Link
          href={`/blog/${post.slug}`}
          className="transition-colors after:absolute after:inset-0 group-hover:text-accent"
        >
          {post.title}
        </Link>
      </h2>

      <p className="mt-3 text-pretty text-ink-soft">{post.description}</p>

      {post.tags && post.tags.length > 0 && (
        <ul className="relative z-10 mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
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
    </article>
  );
}
