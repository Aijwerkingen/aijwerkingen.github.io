"use client";

// ─────────────────────────────────────────────────────────────────────────────
// TEMPORARY - brand preview panel (D1 naming + D11 colour-way, spec §22).
//
// REMOVING THIS: delete this `src/admin/` directory and the single
// `<AdminDrawer />` line in src/app/layout.tsx. Nothing else imports it. The
// site then renders the site.config.ts default brand everywhere, because
// `useBrand()` falls back to a static default when no override is ever written
// (see src/brand/BrandProvider.tsx). Once the naming decision is locked, that
// deletion plus setting `defaultBrandKey`/`defaultBrandTheme` is the whole job.
//
// Scope: this previews *rendered* brand only. Titles, JSON-LD, canonical URLs,
// the sitemap and OG images are generated at build time from site.config.ts and
// are intentionally NOT affected - brand identity for crawlers stays single-
// sourced (ADR-008).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useId, useRef, useState } from "react";
import {
  brandThemeLabels,
  brandThemes,
  brandVariants,
  defaultBrandKey,
  defaultBrandTheme,
  type BrandKey,
  type BrandTheme,
} from "@/site.config";
import { useBrand } from "@/brand/BrandProvider";
import { BrandLockup } from "@/brand/BrandLockup";

export function AdminDrawer() {
  const [open, setOpen] = useState(false);
  const { brand, theme, setBrand, setTheme, reset } = useBrand();
  const panelRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    // Move focus into the panel so keyboard users land where the dialog opened.
    panelRef.current?.focus();

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    handleRef.current?.focus();
  }

  const isDefault =
    brand === defaultBrandKey && theme === defaultBrandTheme;

  return (
    <>
      {/* Deliberately low-key: a thin tab on the page edge, legible only if you
          are looking for it, but still a real focusable control. */}
      <button
        ref={handleRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open brand preview panel"
        aria-expanded={open}
        className="fixed top-1/2 right-0 z-40 flex -translate-y-1/2 cursor-pointer
          flex-col items-center gap-1 rounded-l-lg border border-r-0 border-line
          bg-surface/70 px-1.5 py-3 opacity-30 backdrop-blur-sm transition
          hover:opacity-100 focus-visible:opacity-100"
      >
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="size-1 rounded-full bg-ink-soft" />
        ))}
      </button>

      {open && (
        <div
          onClick={close}
          className="fixed inset-0 z-40 bg-inverse/25 backdrop-blur-[2px]"
          aria-hidden="true"
        />
      )}

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!open}
        tabIndex={-1}
        // Kept mounted so the slide transition can run; `inert` takes it out of
        // the tab order and the a11y tree entirely while closed.
        inert={!open}
        className={`fixed top-0 right-0 z-50 flex h-full w-[min(22rem,100vw)] flex-col
          border-l border-line bg-surface shadow-2xl transition-transform duration-300
          ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-start justify-between border-b border-line px-5 py-4">
          <div>
            <h2 id={titleId} className="font-display text-base font-bold">
              Brand preview
            </h2>
            <p className="mt-0.5 text-xs text-ink-soft">
              Saved to this browser only.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close brand preview panel"
            className="-mr-1 cursor-pointer rounded-md p-1 text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
          >
            <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex items-center justify-center rounded-xl border border-line bg-canvas px-4 py-6">
            <BrandLockup size={32} wordmarkClassName="text-lg" />
          </div>

          <Field label="Name">
            <Segmented
              options={Object.entries(brandVariants).map(([key, variant]) => ({
                value: key as BrandKey,
                label: variant.name,
              }))}
              value={brand}
              onChange={setBrand}
              name="brand-name"
            />
          </Field>

          <Field label="Theme">
            <Segmented
              options={brandThemes.map((value) => ({
                value,
                label: brandThemeLabels[value],
                swatch: value,
              }))}
              value={theme}
              onChange={setTheme}
              name="brand-theme"
            />
          </Field>

          <button
            type="button"
            onClick={reset}
            disabled={isDefault}
            className="mt-7 w-full cursor-pointer rounded-lg border border-line px-3 py-2
              text-sm font-medium text-ink-soft transition-colors hover:bg-canvas
              hover:text-ink disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
          >
            {isDefault ? "Showing defaults" : "Reset to defaults"}
          </button>

          <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-ink-soft">
            Affects what you see on the page. The tab icon, page titles,
            structured data and social share images are generated at build time
            and keep using the default name.
          </p>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="mt-6">
      <legend className="eyebrow mb-2">{label}</legend>
      {children}
    </fieldset>
  );
}

type Option<T> = { value: T; label: string; swatch?: BrandTheme };

/**
 * Radio group styled as a segmented control - real radios keep arrow-key
 * navigation and screen-reader semantics for free.
 */
function Segmented<T extends string>({
  options,
  value,
  onChange,
  name,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  name: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-line bg-canvas p-1.5">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-md px-2 py-2
              text-sm font-semibold transition-colors ${
                selected
                  ? "bg-surface text-ink shadow-sm ring-1 ring-line"
                  : "text-ink-soft hover:text-ink"
              }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.swatch && (
              <span
                data-brand-theme={option.swatch}
                className="size-3 rounded-full bg-accent ring-1 ring-black/10"
              />
            )}
            <span className="truncate">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}
