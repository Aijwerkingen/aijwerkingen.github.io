// Runtime brand state (name + colour-way).
//
// Server-rendered output — <title>, JSON-LD, canonical, sitemap — always uses the
// build-time default from site.config.ts. This module only layers a *client-side*
// override on top, so the admin drawer can preview the other name/theme without a
// rebuild. It is deliberately dependency-free and safe to import from server code
// (see `brandPrePaintScript`); the store half no-ops when there is no `window`.

import {
  brandThemes,
  brandVariants,
  defaultBrandKey,
  defaultBrandTheme,
  type BrandKey,
  type BrandTheme,
} from "@/site.config";

export type BrandState = { brand: BrandKey; theme: BrandTheme };

export const BRAND_STORAGE_KEY = "brand-preview";

export const defaultBrandState: BrandState = {
  brand: defaultBrandKey,
  theme: defaultBrandTheme,
};

function isBrandKey(value: unknown): value is BrandKey {
  return typeof value === "string" && Object.hasOwn(brandVariants, value);
}

function isBrandTheme(value: unknown): value is BrandTheme {
  return (
    typeof value === "string" && (brandThemes as readonly string[]).includes(value)
  );
}

/** Anything unrecognised falls back to the default — never trust stored JSON. */
function parseBrandState(raw: string | null): BrandState {
  if (!raw) return defaultBrandState;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return defaultBrandState;
    const { brand, theme } = parsed as Record<string, unknown>;
    return {
      brand: isBrandKey(brand) ? brand : defaultBrandState.brand,
      theme: isBrandTheme(theme) ? theme : defaultBrandState.theme,
    };
  } catch {
    return defaultBrandState;
  }
}

function readStorage(): BrandState {
  try {
    return parseBrandState(window.localStorage.getItem(BRAND_STORAGE_KEY));
  } catch {
    // Private mode / blocked storage — the default is always a valid answer.
    return defaultBrandState;
  }
}

const listeners = new Set<() => void>();

// `getSnapshot` must return a referentially stable value, so the state lives in
// this module-level variable and is only reassigned when it actually changes.
let snapshot: BrandState = defaultBrandState;

if (typeof window !== "undefined") {
  // Module init runs before hydration, so the first client-side getSnapshot()
  // already reflects storage and React reconciles in a single pass instead of
  // reporting a mismatch against the server-rendered default.
  snapshot = readStorage();

  window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== BRAND_STORAGE_KEY) return;
    commit(readStorage(), { persist: false });
  });
}

function commit(next: BrandState, { persist }: { persist: boolean }) {
  if (next.brand === snapshot.brand && next.theme === snapshot.theme) return;
  snapshot = next;
  if (persist) {
    try {
      window.localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Preview is still applied for this session; persistence is best-effort.
    }
  }
  for (const listener of listeners) listener();
}

export function subscribeBrand(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function getBrandSnapshot(): BrandState {
  return snapshot;
}

export function getServerBrandSnapshot(): BrandState {
  return defaultBrandState;
}

export function setBrandState(patch: Partial<BrandState>): void {
  commit({ ...snapshot, ...patch }, { persist: true });
}

export function resetBrandState(): void {
  try {
    window.localStorage.removeItem(BRAND_STORAGE_KEY);
  } catch {
    // Nothing stored to clear.
  }
  commit(defaultBrandState, { persist: false });
}

/**
 * Inline, render-blocking script that stamps the stored colour-way onto <html>
 * before first paint, so a previewing admin never sees the default accent flash
 * to the stored one. Built from the config values rather than written as a
 * literal, both to keep brand strings out of app code (ADR-008) and so adding a
 * variant to site.config.ts needs no change here.
 *
 * Public visitors have no stored value, so this is a no-op read for them.
 */
export function brandPrePaintScript(): string {
  const keys = JSON.stringify(Object.keys(brandVariants));
  const themes = JSON.stringify(brandThemes);
  return `(function(){try{var v=JSON.parse(localStorage.getItem(${JSON.stringify(
    BRAND_STORAGE_KEY,
  )})||"{}");var d=document.documentElement;if(${keys}.indexOf(v.brand)>-1)d.dataset.brand=v.brand;if(${themes}.indexOf(v.theme)>-1)d.dataset.brandTheme=v.theme;}catch(e){}})();`;
}
