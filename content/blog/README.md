# Blog content

Every `.md` file in this folder becomes a blog post at `/blog/<filename>`.
The filename (without `.md`) is the URL slug, so keep it lowercase and
hyphenated: `spotting-ai-distress.md` → `/blog/spotting-ai-distress`.

Files starting with `_` and this `README.md` are ignored.

## Publishing a post

1. Add a `.md` file here (see the frontmatter below).
2. Commit it and push to `main`.
3. The **Deploy to GitHub Pages** workflow runs automatically on every push to
   `main` (manual run still available via Actions tab → Run workflow).

`next build` reads these files, renders them to static HTML, and adds each post
to the sitemap and `Blog` / `BlogPosting` structured data automatically. There
is no separate CMS or database.

> Note: the whole site is `noindex` until `indexable` is flipped to `true` in
> `src/site.config.ts`. Posts inherit that switch — they go live for search and
> answer engines at the same moment the rest of the site does.

## Frontmatter

```markdown
---
title: "Spotting when an AI tool is affecting how you feel"
description: "A short, plain-language guide to the early signs, and what to do about them."
date: 2026-08-07            # YYYY-MM-DD. Required. Drives ordering + datePublished.
updated: 2026-08-10         # Optional. Set when you meaningfully edit a live post.
author: "AIjwerkingen team" # Optional. Omit to attribute to the organisation.
tags: ["guides", "wellbeing"]   # Optional.
image: /blog/spotting-ai-distress/cover.png   # Optional cover + OG image.
imageAlt: "Illustration of a person pausing to check in with themselves."
draft: false                # Optional. true = kept out of the build entirely.
---

Body starts here. Standard Markdown + GitHub-flavoured extras (tables,
task lists, fenced code) all work. Every `##`/`###` heading gets a stable
anchor id for deep-linking.
```

Only `title`, `description`, and `date` are required.

## Tags and the feed (automatic)

- Each distinct tag gets its own page at `/blog/tags/<tag>` listing every post
  that uses it, added to the sitemap as a topic hub. Tag chips on the cards and
  posts link there. Nothing to wire up — just add `tags:` to a post.
- An RSS feed is generated at `/feed.xml` from all published posts, and is
  auto-discoverable (`<link rel="alternate" type="application/rss+xml">`) from
  the blog pages.

## Images

Put images under `public/blog/<slug>/` and reference them with an absolute path
from the site root:

```
public/blog/spotting-ai-distress/cover.png   →   /blog/spotting-ai-distress/cover.png
```

- In the body: `![Alt text](/blog/spotting-ai-distress/diagram.png)`
- As the cover / social-share card: the `image:` frontmatter field above.

Images are copied verbatim into the static export (no optimizer), so size them
before committing — aim for < 200 KB and ~1600 px wide for covers, and use a
1200×630 image for the best social-share crop.

## Previewing drafts locally

```bash
BLOG_INCLUDE_DRAFTS=1 npm run dev
```

This includes `draft: true` posts so you can review them. A normal
`npm run build` never ships a draft.
