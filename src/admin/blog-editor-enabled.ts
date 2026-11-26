/**
 * Build-time switch for the internal blog editor (the "Edit post" button on a
 * blog post, and the Tiptap editor it opens).
 *
 * Same shape as NEXT_PUBLIC_BRAND_PANEL and NEXT_PUBLIC_REPORT_GATE: a
 * NEXT_PUBLIC_* value, so it is inlined as a literal at build time and cannot
 * drift between server and client.
 *
 * Only the staging deploy sets it to "1" (.github/workflows/deploy.yml). The
 * production build (Cloudflare git integration) has no such variable, so the
 * button - and the editor's whole lazy chunk with it - is compiled out of
 * production. The Functions endpoint is dead there too, independently: it
 * requires BLOG_EDITOR_ENABLED, which is only set on the internal Pages
 * project. Neither gate alone is trusted; see docs/BLOG_EDITOR_PLAN.md.
 */
export const blogEditorEnabled = process.env.NEXT_PUBLIC_BLOG_EDITOR === "1";
