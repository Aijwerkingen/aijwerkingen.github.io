"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  brandAsset,
  brandVariants,
  type BrandKey,
  type BrandMode,
  type BrandTheme,
  type BrandVariant,
  type FontKey,
} from "@/site.config";
import {
  defaultBrandState,
  getBrandSnapshot,
  getServerBrandSnapshot,
  resetBrandState,
  setBrandState,
  subscribeBrand,
  type BrandState,
} from "./brand-state";

type BrandContextValue = BrandState & {
  variant: BrandVariant;
  /** Resolves a file name against the active (brand, theme) icon directory. */
  asset: (file: string) => string;
  setBrand: (brand: BrandKey) => void;
  setTheme: (theme: BrandTheme) => void;
  setFont: (font: FontKey) => void;
  setMode: (mode: BrandMode) => void;
  reset: () => void;
};

const BrandContext = createContext<BrandContextValue | null>(null);

/**
 * Read-only fallback used when no provider is mounted. It means every brand
 * component keeps rendering the site.config default on its own, so deleting the
 * provider along with the admin drawer degrades to a static brand rather than
 * throwing. See src/admin/AdminDrawer.tsx for the removal note.
 */
const staticBrand: BrandContextValue = {
  ...defaultBrandState,
  variant: brandVariants[defaultBrandState.brand],
  asset: (file) => brandAsset(defaultBrandState.brand, defaultBrandState.theme, file),
  setBrand: () => {},
  setTheme: () => {},
  setFont: () => {},
  setMode: () => {},
  reset: () => {},
};

export function useBrand(): BrandContextValue {
  return useContext(BrandContext) ?? staticBrand;
}

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(
    subscribeBrand,
    getBrandSnapshot,
    getServerBrandSnapshot,
  );

  const setBrand = useCallback((brand: BrandKey) => setBrandState({ brand }), []);
  const setTheme = useCallback((theme: BrandTheme) => setBrandState({ theme }), []);
  const setFont = useCallback((font: FontKey) => setBrandState({ font }), []);
  const setMode = useCallback((mode: BrandMode) => setBrandState({ mode }), []);
  const reset = useCallback(() => resetBrandState(), []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.brand = state.brand;
    // Drives every accent token in globals.css. These two attributes are the
    // whole runtime surface - <html> is not React-owned, so stamping it is safe.
    root.dataset.brandTheme = state.theme;
    // Picks the typeface pair (rules in globals.css).
    root.dataset.font = state.font;
    // Light/dark neutrals (rules in globals.css).
    root.dataset.mode = state.mode;
  }, [state]);

  // NB: the favicon links are deliberately left alone. They are emitted by the
  // static metadata export and owned by React 19's hoisted-<link> handling —
  // rewriting their href here left the mutated links in place AND had React
  // re-insert its own set, so the tab icon (like <title> and the OG image)
  // stays on the build-time default brand.

  const value = useMemo<BrandContextValue>(
    () => ({
      ...state,
      variant: brandVariants[state.brand],
      asset: (file) => brandAsset(state.brand, state.theme, file),
      setBrand,
      setTheme,
      setFont,
      setMode,
      reset,
    }),
    [state, setBrand, setTheme, setFont, setMode, reset],
  );

  return <BrandContext value={value}>{children}</BrandContext>;
}
