// Inline, single-stroke icons drawn on a 24px grid. Inline rather than an icon
// package because the set is tiny and `output: "export"` rewards shipping no
// extra runtime; `currentColor` lets them inherit the active accent.

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3l7 3v5.5c0 4.2-2.9 8.1-7 9.5-4.1-1.4-7-5.3-7-9.5V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function PulseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 12h3.5l2-6 3.5 12 2.5-8 1.5 2H21" />
    </svg>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20 12a7 7 0 01-7 7H8l-4 3v-4.4A7 7 0 018 5h5a7 7 0 017 7z" />
    </svg>
  );
}

export function NoteIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v4h4M9 12h7M9 16h5" />
    </svg>
  );
}

/** A chip: the AI technology the person is asked to pick. */
export function ChipIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <rect x="10.4" y="10.4" width="3.2" height="3.2" rx="0.8" />
      <path d="M10 7V4M14 7V4M10 20v-3M14 20v-3M7 10H4M7 14H4M20 10h-3M20 14h-3" />
    </svg>
  );
}

/**
 * A screen: where and how the person was using the tool. Deliberately a plain
 * monitor - a cursor arrow closed up into a blob at the 20px render size.
 */
export function ScreenIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="4.5" width="18" height="12" rx="2" />
      <path d="M12 16.5V20M8.5 20h7" />
    </svg>
  );
}

/**
 * A face with a downturned mouth: the effects are psychological, so the icon
 * carries feeling rather than observation. Eyes are filled dots and the mouth is
 * one bezier - at 20px a stroked outline for either turns into a smudge, and the
 * features need vertical room between them or the whole thing reads as a blob.
 */
export function FaceIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="9.3" cy="10.3" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.7" cy="10.3" r="1" fill="currentColor" stroke="none" />
      <path d="M8.5 16.6q3.5-3.1 7 0" />
    </svg>
  );
}
