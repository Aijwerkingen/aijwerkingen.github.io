import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug, getPublishedSlugs } from "@/lib/blog";
import { siteConfig } from "@/site.config";
import { blogEditorEnabled } from "@/admin/blog-editor-enabled";
import { EditPostButton } from "@/admin/blog-editor/EditPostButton";
import { PostView } from "../PostView";

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

  // Staging only, both slots: `blogEditorEnabled` is the NEXT_PUBLIC_BLOG_EDITOR
  // build flag, which only .github/workflows/deploy.yml sets. With
  // BLOG_INCLUDE_DRAFTS=1 this build also renders hidden posts, so the notice
  // says plainly that production does not show them yet. The Edit button's import
  // is aliased to a no-op stub when the flag is unset (next.config.ts), so
  // production carries neither the button nor Tiptap - see
  // docs/BLOG_EDITOR_PLAN.md section 6.2.
  // `: false` rather than `: null` in both slots below, deliberately: the RSC
  // payload distinguishes the two, so `null` would change the bytes of the built
  // HTML compared with the inline `{flag && ...}` these slots replaced. Both
  // render nothing; only `false` keeps the production output byte-identical
  // (acceptance check 2).
  const draftNotice =
    blogEditorEnabled && (post.published === false || post.draft === true) ? (
      <p className="mt-3 inline-block rounded-full border border-accent-line bg-accent-soft px-3 py-1 text-xs font-semibold text-ink">
        Draft - not on production
      </p>
    ) : (
      false
    );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PostView
        title={post.title}
        date={post.date}
        readingMinutes={post.readingMinutes}
        author={post.author}
        image={post.image}
        imageAlt={post.imageAlt}
        tags={post.tags}
        bodyHtml={post.html}
        notice={draftNotice}
        headerExtra={blogEditorEnabled ? <EditPostButton slug={slug} /> : false}
      />
    </>
  );
}
