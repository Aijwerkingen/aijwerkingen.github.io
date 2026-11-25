"use client";

// The post's details, as form fields - the only way to change frontmatter.
// Editors never see YAML (docs/BLOG_EDITOR_PHASE2_PLAN.md sections 2 and 3).
//
// Reading uses js-yaml's `load`; writing never does. Each change is handed up as
// a line-level edit (md.ts), so a field the editor never touched keeps its exact
// original formatting.

import { useState } from "react";
import { load as yamlLoad } from "js-yaml";
import { formatDate } from "@/app/blog/format";

const SUMMARY_SOFT_LIMIT = 160;

export type PostDetailsValues = {
  title: string;
  description: string;
  tags: string[];
  image: string;
  imageAlt: string;
  dateIso: string;
  author: string;
  hidden: boolean;
  /** False when the block cannot be parsed, so the fields are shown as-is. */
  valid: boolean;
};

/** Reads the frontmatter for display only. Never writes anything back. */
export function readDetails(frontmatter: string): PostDetailsValues {
  let data: Record<string, unknown> = {};
  let valid = true;
  try {
    const parsed = yamlLoad(frontmatter);
    if (parsed && typeof parsed === "object") data = parsed as Record<string, unknown>;
  } catch {
    valid = false;
  }

  const text = (value: unknown) =>
    typeof value === "string" ? value : typeof value === "number" ? String(value) : "";

  const rawDate = data.date;
  const dateIso = rawDate instanceof Date ? rawDate.toISOString().slice(0, 10) : text(rawDate);

  return {
    title: text(data.title),
    description: text(data.description),
    tags: Array.isArray(data.tags) ? data.tags.map(text).filter(Boolean) : [],
    image: text(data.image),
    imageAlt: text(data.imageAlt),
    dateIso,
    author: text(data.author),
    hidden: data.published === false || data.draft === true,
    valid,
  };
}

/** Turns "a, b , ,c" into ["a","b","c"]. */
export function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function PostDetails({
  frontmatter,
  resolveSrc,
  onField,
  onPickCover,
  onClearCover,
}: {
  frontmatter: string;
  /** Resolves a cover path to a previewable src (pending images included). */
  resolveSrc: (src: string) => string;
  /** `valueYaml === null` removes the field. */
  onField: (key: string, valueYaml: string | null, afterKey?: string) => void;
  onPickCover: () => void;
  onClearCover: () => void;
}) {
  const details = readDetails(frontmatter);
  // Local so a half-typed "guides," is not reformatted under the cursor.
  const [tagsText, setTagsText] = useState(() => details.tags.join(", "));

  const setText = (key: string, value: string, afterKey?: string) =>
    onField(key, JSON.stringify(value), afterKey);

  return (
    <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <h3 className="eyebrow">Post details</h3>

      {!details.valid && (
        <p className="mt-3 rounded-lg border border-notice-line bg-notice-soft px-3 py-2 text-sm text-notice">
          Something in this post&apos;s details cannot be read, so they are shown as they are. If you
          need to change them, ask the web team.
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="eyebrow mb-2 block">Title</span>
          <input
            value={details.title}
            onChange={(event) => setText("title", event.target.value)}
            className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="eyebrow mb-2 block">Short summary</span>
          <textarea
            value={details.description}
            onChange={(event) => setText("description", event.target.value)}
            rows={2}
            className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-xs text-ink-soft">
            {details.description.length > SUMMARY_SOFT_LIMIT
              ? `${details.description.length - SUMMARY_SOFT_LIMIT} characters over the usual length - shorter reads better in search results.`
              : "1-2 sentences, shown in search results and link previews."}
          </span>
        </label>

        <label className="block">
          <span className="eyebrow mb-2 block">Tags</span>
          <input
            value={tagsText}
            onChange={(event) => {
              setTagsText(event.target.value);
              onField("tags", JSON.stringify(parseTags(event.target.value)));
            }}
            placeholder="reporting, wellbeing"
            className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-xs text-ink-soft">Separate them with commas.</span>
        </label>

        <div className="block">
          <span className="eyebrow mb-2 block">Cover image</span>
          <div className="flex items-center gap-3">
            {details.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveSrc(details.image)}
                alt=""
                className="h-14 w-24 rounded-md border border-line object-cover"
              />
            ) : (
              <span className="flex h-14 w-24 items-center justify-center rounded-md border border-dashed border-line text-xs text-ink-soft">
                None
              </span>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onPickCover}
                className="cursor-pointer rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
              >
                {details.image ? "Change" : "Add cover image"}
              </button>
              {details.image && (
                <button
                  type="button"
                  onClick={onClearCover}
                  className="cursor-pointer rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 border-t border-line pt-3 text-xs text-ink-soft">
        Published {details.dateIso ? formatDate(details.dateIso) : "unknown date"}
        {details.author ? ` · ${details.author}` : ""} ·{" "}
        <span className="font-semibold text-ink">{details.hidden ? "Draft" : "Live"}</span>
        <span className="block">
          These three come from the post itself and cannot be changed here.
        </span>
      </p>
    </section>
  );
}
