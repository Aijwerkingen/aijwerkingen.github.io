# ADR-001: SSR/SSG mandatory for indexable content

## Status

Proposed

## Context

AI crawlers and answer engines often do not execute JavaScript; client-only
rendered content is invisible to them. People searching for help also need a
fast first paint.

## Decision

Server-side rendering or static generation is mandatory for all indexable
content on this site. Client-only rendering is not acceptable for any page
that is meant to be crawled or indexed.

## Consequences

The site is built with Next.js's static export (`output: "export"`,
`next.config.ts`), which pre-renders every route to static HTML at build
time. This constrains hosting to platforms that can serve static files
(see ADR-010) and rules out client-only data fetching for page content.
