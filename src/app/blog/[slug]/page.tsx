import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getPublishedSlugs, tagSlug } from "@/lib/blog";
import { siteConfig } from "@/site.config";
import { formatDate } from "../format";

// Static export needs the full list of slugs up front - there is no server to
// render an unknown one on demand.
export function generateStaticParams() {
  return getPublishedSlugs().map((slug) => ({ slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const url = `/blog/${slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: post.author ? [post.author] : undefined,
      tags: post.tags,
      // Per-post image when supplied; otherwise the layout falls back to the
      // site-wide OG image already declared in the root metadata.
      images: post.image
        ? [{ url: post.image, alt: post.imageAlt ?? post.title }]
        : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const canonical = `${siteConfig.canonicalUrl}/blog/${slug}`;

  // BlogPosting is the schema answer engines and search read to attribute an
  // article: its headline, dates, author, and canonical URL. Image and author
  // fall back sensibly so the block is always complete.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: {
      "@type": post.author ? "Person" : "Organization",
      name: post.author || siteConfig.name,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.organization.legalName || siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: new URL(siteConfig.logo, siteConfig.canonicalUrl).toString(),
      },
    },
    image: post.image
      ? new URL(post.image, siteConfig.canonicalUrl).toString()
      : siteConfig.ogImage.url,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    url: canonical,
    keywords: post.tags?.join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
              {post.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span aria-hidden="true">·</span>
              <span>{post.readingMinutes} min read</span>
              {post.author && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{post.author}</span>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 py-12">
          {post.image && (
            // eslint-disable-next-line @next/next/no-img-element -- static export
            // has no image optimizer (next.config `images.unoptimized`), so a
            // plain <img> is the honest primitive here.
            <img
              src={post.image}
              alt={post.imageAlt ?? ""}
              className="mb-10 w-full rounded-2xl border border-line"
            />
          )}

          {/* Trusted, in-repo Markdown rendered to HTML at build time. */}
          <div
            className="prose-doc"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          {post.tags && post.tags.length > 0 && (
            <ul className="mt-12 flex flex-wrap gap-2 border-t border-line pt-8">
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
        </div>
      </article>
    </>
  );
}
