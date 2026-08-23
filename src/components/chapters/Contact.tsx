"use client";

import { useEffect, useRef, useState } from "react";
import { animate, onScroll, stagger, utils, type ScrollObserver } from "animejs";
import { SplitIn } from "@/components/text/SplitIn";
import { prefersReducedMotion } from "@/lib/reducedMotion";

const EMAIL = "nandakishorereddyg@outlook.com";

const LINKS = [
  { label: "GitHub", href: "https://github.com/N9601", color: "#4d9cff", external: true },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/gnandhakishorereddy/", color: "#00ffaa", external: true },
  { label: "dev.to", href: "https://dev.to/n9601", color: "#a369ff", external: true },
  { label: "Email", href: `mailto:${EMAIL}`, color: "#ff7d36" },
  { label: "Call", href: "tel:+918555042086", color: "#26f2d5" },
  { label: "Download CV", href: "/Nandakishore_Reddy_CV.pdf", color: "#ff1133" },
  { label: "Work", href: "#work", color: "#ffcc2a" },
  { label: "Toolbox", href: "#toolbox", color: "#b7ff54" },
  { label: "Playground", href: "/playground", color: "#e962bf" },
];

/**
 * Chapter 05. The board faces front and powers up. One line, one
 * email, nine doors (the animejs.com links grid), a footer row.
 */
export function Contact() {
  const gridRef = useRef<HTMLUListElement>(null);
  const [copied, setCopied] = useState(false);
  const [time, setTime] = useState("--:--");

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || prefersReducedMotion()) return;
    const cells = Array.from(grid.querySelectorAll<HTMLElement>("li"));
    if (grid.getBoundingClientRect().bottom < 0) return;
    utils.set(cells, { opacity: 0, y: 12 });
    const obs: ScrollObserver = onScroll({
      target: grid,
      enter: "bottom-=10% top",
      onEnter: () =>
        animate(cells, {
          opacity: [0, 1],
          y: [12, 0],
          duration: 500,
          delay: stagger(50, { grid: [3, 3], from: "first" }),
          ease: "out(3)",
        }),
    });
    return () => {
      obs.revert();
      utils.remove(cells);
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <section id="contact" className="gutter relative flex min-h-[100vh] flex-col justify-between pb-24 pt-28 md:pb-28">
      <div className="mx-auto w-full max-w-5xl text-center">
        <div className="eyebrow mb-5 flex items-center justify-center gap-3">
          <span className="block h-px w-8" style={{ background: "var(--accent)" }} />
          <span>{"05 / Contact"}</span>
        </div>
        <SplitIn as="h2" split="chars" onView className="display display-xl text-fg">
          Let&apos;s build
          <br />
          something <span style={{ color: "var(--accent)" }}>alive</span>
          <span className="red-dot text-red">.</span>
        </SplitIn>

        <button
          type="button"
          onClick={copy}
          data-cursor
          data-cursor-label={copied ? "COPIED" : "COPY"}
          className="group mt-8 inline-flex h-12 items-center gap-3 border border-[var(--line)] bg-fg/[0.04] pl-4 pr-3 font-mono text-[12px] text-fg-2 transition hover:text-fg"
        >
          <span style={{ color: "var(--accent)" }}>$</span>
          <span className="break-all">mail {EMAIL}</span>
          <span className="ml-2 border-l border-[var(--line)] pl-3 text-fg-4 transition group-hover:text-fg">
            {copied ? "✓" : "⧉"}
          </span>
        </button>

        <ul
          ref={gridRef}
          className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-px overflow-hidden border border-[var(--line)] bg-[var(--line)] text-left sm:grid-cols-3"
        >
          {LINKS.map((l) => (
            <li key={l.label} className="bg-bg" style={{ "--dot": l.color } as React.CSSProperties}>
              <a
                href={l.href}
                target={l.external ? "_blank" : undefined}
                rel={l.external ? "noopener noreferrer" : undefined}
                data-cursor
                data-cursor-label={l.external ? "OPEN" : "GO"}
                className="group relative flex items-center justify-between py-4 pl-10 pr-5 font-mono text-[11px] uppercase tracking-[0.25em] text-fg-2 transition hover:bg-fg/[0.04] hover:text-fg"
              >
                <span
                  className="absolute left-4 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
                  style={{ background: l.color, boxShadow: `0 0 10px ${l.color}80` }}
                />
                {l.label}
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-fg-4 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-[var(--dot)]"
                  aria-hidden
                >
                  <polygon fill="currentColor" points="17.737 11.987 12.5 17.225 11.263 15.987 14.388 12.862 6.5 12.862 6.5 11.112 14.388 11.112 11.263 7.987 12.5 6.75" />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <footer className="eyebrow-sm mx-auto mt-20 flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-5">
        <span>© {new Date().getFullYear()} Nandakishore Reddy</span>
        <span>Hyderabad, IN · {time} IST</span>
        <span>Next.js · anime.js · Three.js</span>
      </footer>
    </section>
  );
}
