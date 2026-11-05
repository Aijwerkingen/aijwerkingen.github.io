/**
 * Build-time switch for the brand preview panel (name, colour-way, font, mode).
 *
 * Same shape as NEXT_PUBLIC_REPORT_GATE: a NEXT_PUBLIC_* value, so it is inlined
 * as a literal at build time and cannot drift between server and client. The
 * staging deploy sets it to "1"; the production build (Cloudflare git
 * integration) has no such variable, so the panel is compiled out of production
 * and the site keeps the site.config.ts defaults.
 *
 * With the flag off, prod also ignores any localStorage override: see
 * brandPrePaintScript()/readStorage() in ./../brand/brand-state.ts.
 */
export const brandPanelEnabled = process.env.NEXT_PUBLIC_BRAND_PANEL === "1";
