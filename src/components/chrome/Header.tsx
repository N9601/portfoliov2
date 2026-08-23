"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { CHAPTERS } from "@/lib/chapters";
import { subscribeScrub } from "@/lib/scrub";

/**
 * Slim persistent header: name mark, chapter links (the current one
 * lit in the chapter accent), availability. Static markup; only the
 * active class changes on scroll, via the scrub store.
 */
export function Header() {
  const home = usePathname() === "/";
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!home || !navRef.current) return;
    const links = Array.from(navRef.current.querySelectorAll<HTMLAnchorElement>("a[data-chapter]"));
    let last = -1;
    return subscribeScrub((s) => {
      if (s.chapter === last) return;
      last = s.chapter;
      links.forEach((l, i) => l.classList.toggle("is-active", i === s.chapter));
    });
  }, [home]);

  return (
    <header
      className="gutter pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between py-4 md:py-5"
      style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
    >
      <a href={home ? "#hero" : "/"} data-cursor className="pointer-events-auto eyebrow flex items-center gap-2 text-fg">
        <span className="block h-2.5 w-2.5" style={{ background: "var(--accent)" }} />
        Nandakishore Reddy
      </a>
      {home && (
        <nav ref={navRef} className="pointer-events-auto hidden items-center gap-6 md:flex" aria-label="Chapters">
          {CHAPTERS.map((c, i) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              data-chapter={c.id}
              data-cursor
              className={`nav-link eyebrow-sm transition-colors hover:text-fg ${i === 0 ? "is-active" : ""}`}
            >
              <span className="mr-1.5 text-fg-4">{c.index}</span>
              {c.label}
            </a>
          ))}
        </nav>
      )}
      <div className="pointer-events-auto eyebrow-sm flex items-center gap-2 text-fg-2">
        <span className="relative inline-block h-2 w-2">
          <span className="absolute inset-0 rounded-full bg-red" style={{ animation: "pulse 1.6s ease-out infinite" }} />
          <span className="relative block h-2 w-2 rounded-full bg-red" />
        </span>
        <span className="hidden sm:inline">Available for work</span>
      </div>
      <style>{`
        .nav-link.is-active { color: var(--accent); }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,17,51,.7)} 50%{box-shadow:0 0 0 10px rgba(255,17,51,0)} }
      `}</style>
    </header>
  );
}
