import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTagSlugs, getPostsByTag } from "@/lib/blog";
import { siteConfig } from "@/site.config";
import { PostCard } from "../../PostCard";

export function generateStaticParams() {
  return getAllTagSlugs().map(({ slug }) => ({ tag: slug }));
}

type Params = { params: Promise<{ tag: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { tag } = await params;
  const result = getPostsByTag(tag);
  if (!result) return {};

  return {
    title: `${result.tag} — blog`,
    description: `Articles tagged "${result.tag}" on ${siteConfig.name}: recognising distress linked to AI tools and social media, and what reporting does.`,
    alternates: { canonical: `/blog/tags/${tag}` },
  };
}

export default async function TagPage({ params }: Params) {
  const { tag } = await params;
  const result = getPostsByTag(tag);
  if (!result) notFound();

  const { tag: displayTag, posts } = result;

  // A CollectionPage listing this tag's posts - tells crawlers the page is a
  // topic hub and enumerates its members, which is what makes tag pages useful
  // for SEO rather than thin duplicate listings.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${displayTag} — ${siteConfig.name} blog`,
    url: `${siteConfig.canonicalUrl}/blog/tags/${tag}`,
    hasPart: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${siteConfig.canonicalUrl}/blog/${post.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="border-b border-line bg-canvas">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <Link
            href="/blog"
            className="text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
          >
            ← All posts
          </Link>
          <p className="eyebrow mt-6">Tag</p>
          <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-balance">
            {displayTag}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-ink-soft">
            {posts.length} {posts.length === 1 ? "post" : "posts"} tagged
            {" "}&ldquo;{displayTag}&rdquo;.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-16">
        <ul className="space-y-8">
          {posts.map((post) => (
            <li key={post.slug}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
