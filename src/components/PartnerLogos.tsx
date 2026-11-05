import { siteConfig } from "@/site.config";

/**
 * Partner institution logos. Each sits on a white tile so the institutions'
 * multi-colour artwork stays legible in dark mode and is never recoloured.
 */
export function PartnerLogos({ className = "" }: { className?: string }) {
  return (
    <ul
      className={`flex flex-wrap items-center justify-center gap-4 ${className}`}
    >
      {siteConfig.partners.map((partner) => (
        <li key={partner.name}>
          <a
            href={partner.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={partner.name}
            className="flex h-16 items-center rounded-xl border border-line bg-white px-6 shadow-sm transition-shadow hover:shadow-md"
          >
            {/* Static export has no image optimizer, so a plain <img> is the
                honest primitive (see blog post page). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={partner.logo}
              alt={partner.name}
              width={partner.width}
              height={partner.height}
              className="h-8 w-auto max-w-[15rem]"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
