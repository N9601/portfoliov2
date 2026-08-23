"use client";

import { useEffect, useRef } from "react";
import { animate, onScroll, stagger, utils, type ScrollObserver } from "animejs";
import { SplitIn } from "@/components/text/SplitIn";
import { prefersReducedMotion } from "@/lib/reducedMotion";

const STATS = [
  { value: "1%", unit: "top", label: "of CSE cohort" },
  { value: "8", unit: "fig", label: "revenue scale" },
  { value: "7+", unit: "", label: "languages" },
  { value: "9.18", unit: "cgpa", label: "diploma" },
];

const TIMELINE = [
  { year: "2026 –", title: "B.Tech, Computer Science", org: "VNR VJIET, Hyderabad", kind: "edu" },
  { year: "2026 –", title: "Software Engineer, AI & Automation", org: "Verge Scales, remote", kind: "work" },
  { year: "2026", title: "Top 1% of CSE department", org: "TRR College of Technology", kind: "award" },
  { year: "2023 – 26", title: "Class Representative, three years running", org: "TRR College", kind: "lead" },
  { year: "2023 – 26", title: "Diploma, Computer Science · 9.18 CGPA", org: "TRR College of Technology", kind: "edu" },
];

/**
 * Chapter 04. Who is behind the board. Bio, four numbers, one timeline.
 * The board tilts to a profile view on the right.
 */
export function Person() {
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const list = listRef.current;
    if (!list || prefersReducedMotion()) return;
    const rows = Array.from(list.querySelectorAll<HTMLElement>("li"));
    const line = list.querySelector<HTMLElement>(".tl-line");
    utils.set(rows, { opacity: 0, x: -10 });
    if (line) utils.set(line, { scaleY: 0 });
    const obs: ScrollObserver = onScroll({
      target: list,
      enter: "bottom-=15% top",
      onEnter: () => {
        if (line) animate(line, { scaleY: [0, 1], duration: 900, ease: "inOut(3)" });
        animate(rows, { opacity: [0, 1], x: [-10, 0], duration: 500, delay: stagger(110, { start: 150 }), ease: "out(3)" });
      },
    });
    return () => {
      obs.revert();
      utils.remove(rows);
    };
  }, []);

  return (
    <section id="person" className="relative flex min-h-[100vh] items-center px-5 py-28 md:px-10">
      <div className="w-full max-w-[34rem] lg:max-w-[40rem]">
        <div className="eyebrow mb-4 flex items-center gap-3">
          <span className="block h-px w-8" style={{ background: "var(--accent)" }} />
          <span>{"04 / Person"}</span>
        </div>
        <SplitIn as="h2" split="chars" onView className="display display-l text-fg">
          Nandakishore Reddy
        </SplitIn>
        <SplitIn as="p" onView delay={200} className="mt-5 max-w-lg font-display text-base leading-relaxed text-fg-2 md:text-lg">
          Full-stack developer from Hyderabad. Remote Software Engineer (AI & Automation) at Verge Scales by day; n8n
          pipelines and Go systems on the side. I care about how systems feel: the friction between a click and the thing
          happening, the difference between fast and instant. Now backed by a B.Tech in CSE at VNR VJIET.
        </SplitIn>

        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="font-display text-3xl font-light text-fg">
                {s.value}
                {s.unit && <span className="ml-1 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-3">{s.unit}</span>}
              </div>
              <div className="eyebrow-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <ol ref={listRef} className="relative mt-10 space-y-4 pl-5">
          <span className="tl-line absolute left-0 top-1 h-[calc(100%-0.5rem)] w-px origin-top" style={{ background: "var(--accent)" }} />
          {TIMELINE.map((t) => (
            <li key={t.title} className="relative">
              <span
                className="absolute -left-[1.45rem] top-[0.45em] block h-2 w-2 rounded-full"
                style={{ background: t.kind === "award" ? "var(--red)" : "var(--accent)" }}
              />
              <div className="eyebrow-sm">{t.year}</div>
              <div className="font-display text-base text-fg">{t.title}</div>
              <div className="font-display text-sm text-fg-3">{t.org}</div>
            </li>
          ))}
        </ol>
        <a
          href="/cv"
          data-cursor
          className="mt-8 inline-block font-mono text-[11px] uppercase tracking-[0.25em] text-fg-2 transition hover:text-[var(--accent)]"
        >
          Full CV →
        </a>
      </div>
    </section>
  );
}
