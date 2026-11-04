"use client";

import { useEffect, useRef } from "react";

import { siteConfig } from "@/site.config";

const CONTACT_FORM_URL = siteConfig.contactEmbed.url;

export function ContactForm() {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function resize(event: MessageEvent) {
      if (event.origin !== new URL(CONTACT_FORM_URL).origin) return;
      const height = Number((event.data as { height?: unknown })?.height);
      if (Number.isFinite(height) && height > 400) {
        frameRef.current?.style.setProperty("height", `${Math.min(height, 2400)}px`);
      }
    }
    window.addEventListener("message", resize);
    return () => window.removeEventListener("message", resize);
  }, []);

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <iframe
        ref={frameRef}
        src={CONTACT_FORM_URL}
        title="AISafetyWatch contact form"
        className="h-[900px] w-full"
        referrerPolicy="no-referrer"
        allowFullScreen={false}
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
      />
    </div>
  );
}

export { CONTACT_FORM_URL };
