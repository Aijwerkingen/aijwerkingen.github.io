import Link from "next/link";
import { BrandName } from "@/brand/BrandLockup";
import type { Block, Span } from "@/content/rich";

/**
 * Renderers for the rich-text spans/blocks defined in `src/content/rich.ts`.
 *
 * These are server components that emit ordinary markup plus, where a span
 * asks for it, the client-side <BrandName> (so the brand still switches under
 * the admin preview). All copy comes from `src/content.config.ts`.
 */

function isExternal(href: string): boolean {
  return /^(https?:|mailto:|tel:)/.test(href);
}

function SpanNode({ span }: { span: Span }) {
  if (typeof span === "string") return <>{span}</>;
  if ("brand" in span) return <BrandName />;
  if ("strong" in span) return <strong>{span.strong}</strong>;

  // A link. External/mail links get a plain <a> (new tab for http[s]); internal
  // paths use next/link so client navigation still works. The `.link` class
  // styles links that sit OUTSIDE `.prose-doc`; inside it, `.prose-doc a` also
  // applies (same accent underline), so this is safe everywhere.
  if (isExternal(span.href)) {
    const isHttp = /^https?:/.test(span.href);
    return (
      <a
        href={span.href}
        className="link"
        {...(isHttp
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {span.text}
      </a>
    );
  }
  return (
    <Link href={span.href} className="link">
      {span.text}
    </Link>
  );
}

/** Renders a list of spans inline (no wrapping element). */
export function RichLine({ spans }: { spans: readonly Span[] }) {
  return (
    <>
      {spans.map((span, i) => (
        <SpanNode key={i} span={span} />
      ))}
    </>
  );
}

/** Renders a long-form document body from a list of blocks. */
export function Prose({ blocks }: { blocks: readonly Block[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if ("h2" in block) return <h2 key={i}>{block.h2}</h2>;
        if ("h3" in block) return <h3 key={i}>{block.h3}</h3>;
        if ("ul" in block)
          return (
            <ul key={i}>
              {block.ul.map((item, j) => (
                <li key={j}>
                  <RichLine spans={item} />
                </li>
              ))}
            </ul>
          );
        if ("ol" in block)
          return (
            <ol key={i}>
              {block.ol.map((item, j) => (
                <li key={j}>
                  <RichLine spans={item} />
                </li>
              ))}
            </ol>
          );
        if ("note" in block)
          return (
            <aside
              key={i}
              role="note"
              className="notice mt-0 mb-8 border-line bg-canvas text-ink-soft"
            >
              <p>
                <RichLine spans={block.note} />
              </p>
            </aside>
          );
        return (
          <p key={i}>
            <RichLine spans={block.p} />
          </p>
        );
      })}
    </>
  );
}
