"use client";

import { useEffect, useRef, useState } from "react";
import {
  helplines,
  getHelpline,
  defaultCountryCode,
  type HelplineEntry,
} from "@/data/helplines";
import { content } from "@/content.config";

const c = content.crisis;

/**
 * Dynamic crisis-helpline notice.
 *
 * 1. On mount, detects the visitor's country via a free IP-geolocation API.
 * 2. Shows the matching helpline with phone + link.
 * 3. The country name is clickable → opens a searchable dropdown to switch.
 * 4. Falls back to the default (NL) if geolocation fails or the country has
 *    no entry, with a link to /helplines for the full directory.
 *
 * Designed for two placements: the report-page <aside> and the footer.
 */

/* ------------------------------------------------------------------ */
/*  Variant styling                                                   */
/* ------------------------------------------------------------------ */

type Variant = "notice" | "footer";

const variantStyles: Record<
  Variant,
  { wrapper: string; heading: string; link: string }
> = {
  notice: {
    wrapper: "",
    heading: "font-semibold text-ink",
    link: "link",
  },
  footer: {
    wrapper: "",
    heading: "font-semibold",
    link: "font-semibold underline underline-offset-4",
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function CrisisHelpline({ variant = "notice" }: { variant?: Variant }) {
  const [entry, setEntry] = useState<HelplineEntry>(
    () => getHelpline(defaultCountryCode)!,
  );
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [geoResolved, setGeoResolved] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const styles = variantStyles[variant];

  /* Auto-detect country by IP on mount */
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("https://ipapi.co/json/", {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        const code: string | undefined = data?.country_code;
        if (code) {
          const match = getHelpline(code);
          if (match) {
            setEntry(match);
            setGeoResolved(true);
          }
        }
      } catch {
        /* geolocation failed - keep default */
      }
    })();

    return () => controller.abort();
  }, []);

  /* Close dropdown on outside click or Escape */
  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  /* Focus search input when dropdown opens */
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const filtered = search
    ? helplines.filter((h) =>
        h.country.toLowerCase().includes(search.toLowerCase()),
      )
    : helplines;

  function select(h: HelplineEntry) {
    setEntry(h);
    setOpen(false);
    setSearch("");
    setGeoResolved(true);
  }

  return (
    <p>
      <span className={styles.heading}>{c.notCrisis}</span>{" "}
      {c.dangerLead}
      {entry.emergency ? ` (${entry.emergency})` : ""}.{" "}
      {/* Country selector */}
      <span className="relative inline-block" ref={dropdownRef}>
        {c.inCountryPrefix}{" "}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`${styles.link} inline cursor-pointer`}
          aria-expanded={open}
          aria-haspopup="listbox"
          title={c.chooseCountryTitle}
        >
          {entry.country}
          <svg
            aria-hidden="true"
            viewBox="0 0 12 12"
            className="ml-0.5 mb-0.5 inline h-3 w-3"
          >
            <path
              d="M3 5l3 3 3-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {/* Dropdown */}
        {open && (
          <span
            className="absolute left-0 top-full z-50 mt-1 flex w-64 flex-col rounded-lg border border-line bg-surface shadow-lg"
            role="listbox"
            aria-label="Select country"
          >
            <span className="border-b border-line px-3 py-2">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={c.searchPlaceholder}
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft"
                aria-label="Search countries"
              />
            </span>
            <span className="max-h-52 overflow-y-auto">
              {filtered.length === 0 ? (
                <span className="block px-3 py-2 text-sm text-ink-soft">
                  {c.noMatch}
                </span>
              ) : (
                filtered.map((h) => (
                  <button
                    key={h.code}
                    type="button"
                    role="option"
                    aria-selected={h.code === entry.code}
                    onClick={() => select(h)}
                    className={`block w-full cursor-pointer px-3 py-1.5 text-left text-sm transition-colors hover:bg-canvas ${
                      h.code === entry.code
                        ? "font-semibold text-accent-strong"
                        : "text-ink"
                    }`}
                  >
                    {h.country}
                  </button>
                ))
              )}
            </span>
          </span>
        )}
      </span>
      ,{" "}
      <a
        href={entry.url}
        className={styles.link}
        target="_blank"
        rel="noopener noreferrer"
      >
        {entry.name}
      </a>{" "}
      ({entry.phone}) {c.support}
      {!geoResolved && (
        <>
          {" "}
          <span className="text-ink-soft">{c.detectedNote}</span>
        </>
      )}
      {" "}
      <a href="/helplines" className={styles.link}>
        {c.seeAll}
      </a>
    </p>
  );
}
