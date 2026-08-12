import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { siteConfig } from "@/site.config";
import { PostCard } from "./PostCard";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Articles on recognising distress linked to AI tools and social media, how reporting works, and what the reports are telling us.",
  alternates: {
    canonical: "/blog",
    // Lets browsers and feed readers auto-discover the RSS feed from any blog page.
    types: {
      "application/rss+xml": `${siteConfig.canonicalUrl}/feed.xml`,
    },
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  // A Blog collection with an itemList of BlogPosting references. This tells
  // crawlers and answer engines that /blog is a blog and enumerates its posts,
  // which improves how the section is understood and cited (AEO/GEO).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${siteConfig.name} blog`,
    url: `${siteConfig.canonicalUrl}/blog`,
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.updated ?? post.date,
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
          <p className="eyebrow">Blog</p>
          <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-balance">
            Writing on AI, distress, and reporting
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-ink-soft">
            Articles, in the public interest, on spotting when an AI tool or social
            platform is affecting how you feel, and what happens to the reports
            you send us.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-16">
        {posts.length === 0 ? (
          <p className="text-center text-ink-soft">
            No posts yet - check back soon.
          </p>
        ) : (
          <ul className="space-y-8">
            {posts.map((post) => (
              <li key={post.slug}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
