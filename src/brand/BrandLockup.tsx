"use client";

import { useBrand } from "./BrandProvider";

/** The active brand name as plain text, for use inside prose. */
export function BrandName() {
  const { variant } = useBrand();
  return <>{variant.name}</>;
}

/**
 * The wordmark, typeset rather than shipped as an image: it stays selectable and
 * searchable, scales without a second asset, and picks up the accent colour from
 * CSS. The two-tone split mirrors the supplied lockup artwork.
 */
export function BrandWordmark({ className = "" }: { className?: string }) {
  const { variant } = useBrand();
  const { lead, tail, accent } = variant.wordmark;

  return (
    <span className={`font-display font-extrabold tracking-tight ${className}`}>
      <span className={accent === "lead" ? "text-accent" : "text-ink"}>{lead}</span>
      <span className={accent === "tail" ? "text-accent" : "text-ink"}>{tail}</span>
    </span>
  );
}

/**
 * The app-icon tile. Decorative by default — it sits next to the wordmark, so
 * announcing it again would just double up for screen readers.
 */
export function BrandMark({
  size = 36,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const { asset } = useBrand();

  // next/image is no help here: its optimizer is disabled under
  // `output: "export"` (next.config.ts), so it would emit this same <img> after
  // shipping extra client runtime for a 34px icon.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset("appicon-accent-512.png")}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}

/** Mark + wordmark, the standard horizontal lockup used in the header. */
export function BrandLockup({
  size = 36,
  className = "",
  wordmarkClassName = "text-xl",
}: {
  size?: number;
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark size={size} />
      <BrandWordmark className={wordmarkClassName} />
    </span>
  );
}
