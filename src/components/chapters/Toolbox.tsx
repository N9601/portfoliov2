"use client";

import { useEffect, useRef } from "react";
import { animate, onScroll, stagger, utils, svg, type ScrollObserver } from "animejs";
import { prefersReducedMotion } from "@/lib/reducedMotion";
import { useMedia } from "@/lib/useMedia";
import { DEMO_FACTORIES, type Demo, type DemoKey } from "@/components/demos/demos";

type Beat = {
  id: string;
  demo: DemoKey;
  part: string;
  accent: string;
  eyebrow: string;
  title: string;
  blurb: string;
  links: { label: string; href: string }[];
  tags: string[];
};

/**
 * Chapter 02. Five beats scroll past a pinned stage. Each beat pulls
 * one group of board parts into the stage (Board.tsx owns that), swaps
 * the anime.js demo overlay, the accent, the floating labels, and
 * reveals its link list with the line + stagger animation.
 *
 * Order here must match TOOLBOX_FOCUS in Board.tsx.
 */
export const BEATS: Beat[] = [
  {
    id: "frontend",
    demo: "grid",
    part: "RAM",
    accent: "#4d9cff",
    eyebrow: "Frontend",
    title: "Interfaces that feel inevitable",
    blurb: "Component systems in React and Next.js, typed end to end, with motion that explains the UI instead of decorating it.",
    links: [
      { label: "Design systems", href: "#work" },
      { label: "Motion & micro-interactions", href: "#work" },
      { label: "Accessibility first", href: "#person" },
    ],
    tags: ["react", "next.js", "typescript", "tailwind", "anime.js", "a11y"],
  },
  {
    id: "backend",
    demo: "clock",
    part: "CPU",
    accent: "#00ffaa",
    eyebrow: "Backend",
    title: "Runs like clockwork",
    blurb: "Go and Node services on Postgres and Supabase. Typed APIs, row-level security, and a storage engine written from scratch.",
    links: [
      { label: "Typed REST APIs", href: "#work" },
      { label: "Row-level security", href: "#work" },
      { label: "LSM storage engine", href: "#work" },
    ],
    tags: ["go", "node.js", "supabase", "postgres", "rest", "lsm-tree"],
  },
  {
    id: "interaction",
    demo: "drag",
    part: "GPU",
    accent: "#a369ff",
    eyebrow: "3D & Interaction",
    title: "Springs, physics, and 60fps",
    blurb: "WebGL scenes with Three.js and hand-written shaders, gestures with real inertia, and a frame budget that never slips.",
    links: [
      { label: "Shader pipelines", href: "#work" },
      { label: "Gesture-driven UI", href: "#toolbox" },
      { label: "Performance budgets", href: "#person" },
    ],
    tags: ["three.js", "webgl", "glsl", "canvas", "draggable", "springs"],
  },
  {
    id: "automation",
    demo: "track",
    part: "I/O",
    accent: "#ff7d36",
    eyebrow: "Automation",
    title: "Pipelines on rails",
    blurb: "Event-driven n8n workflows gluing storefronts, CRMs, and ad platforms together, with retries and idempotency built in.",
    links: [
      { label: "Event-driven flows", href: "#person" },
      { label: "Webhooks & cron", href: "#person" },
      { label: "Ops dashboards", href: "#person" },
    ],
    tags: ["n8n", "webhooks", "cron", "zapier", "shopify", "meta ads"],
  },
  {
    id: "infra",
    demo: "responsive",
    part: "Power",
    accent: "#26f2d5",
    eyebrow: "Infra & Cloud",
    title: "Ships anywhere, adapts everywhere",
    blurb: "Docker images through GitHub Actions to Vercel and Cloudflare. IAM, secrets, and TLS handled before the first deploy.",
    links: [
      { label: "CI / CD", href: "#work" },
      { label: "Edge deploys", href: "#work" },
      { label: "IAM & secrets", href: "#person" },
    ],
    tags: ["docker", "github actions", "vercel", "cloudflare", "iam", "tls"],
  },
];

const N = BEATS.length;

export function Toolbox() {
  const mobile = useMedia("(max-width: 767px)");
  return mobile ? <ToolboxMobile /> : <ToolboxPinned />;
}

/**
 * Phones: no pinning. A horizontal snap strip, one card per beat, each
 * with its own demo that runs only while the card is on screen.
 */
function ToolboxMobile() {
  const stripRef = useRef<HTMLDivElement>(null);
  const stageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const demos: (Demo | null)[] = BEATS.map((b, i) => {
      const stage = stageRefs.current[i];
      return stage ? DEMO_FACTORIES[b.demo](stage) : null;
    });
    const cards = Array.from(strip.querySelectorAll<HTMLElement>("[data-card]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = Number((e.target as HTMLElement).dataset.card);
          const d = demos[i];
          if (!d) continue;
          if (e.isIntersecting && !prefersReducedMotion()) d.enter();
          else d.leave();
        }
      },
      { root: null, threshold: 0.5 }
    );
    cards.forEach((c) => io.observe(c));
    return () => {
      io.disconnect();
      demos.forEach((d) => d?.destroy());
    };
  }, []);

  return (
    <section id="toolbox" className="relative py-20" style={{ "--accent": BEATS[0].accent } as React.CSSProperties}>
      <div className="eyebrow mb-4 flex items-center gap-3 px-5">
        <span className="block h-px w-8" style={{ background: "var(--accent)" }} />
        <span>{"02 / Toolbox"}</span>
      </div>
      <h2 className="display display-m px-5 text-fg">
        The complete
        <br />
        toolbox
      </h2>
      <p className="eyebrow-sm mt-3 px-5">swipe →</p>
      <div ref={stripRef} className="strip mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-4">
        {BEATS.map((b, i) => (
          <article
            key={b.id}
            data-card={i}
            className="flex w-[82vw] max-w-[22rem] shrink-0 snap-center flex-col border border-[var(--line)] bg-bg/70 p-4 backdrop-blur-md"
            style={{ "--accent": b.accent } as React.CSSProperties}
          >
            <div className="eyebrow flex items-center gap-2" style={{ color: "var(--accent)" }}>
              <span>
                0{i + 1} / {b.eyebrow}
              </span>
              <span className="text-fg-4">· {b.part}</span>
            </div>
            <div className="relative mx-auto my-3 aspect-square w-full max-w-[260px]">
              <div
                ref={(el) => {
                  stageRefs.current[i] = el;
                }}
                className="stage"
                style={{ inset: 0 }}
              />
            </div>
            <h3 className="font-display text-xl font-medium leading-tight text-fg">{b.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-2">{b.blurb}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {b.tags.map((t) => (
                <span key={t} className="eyebrow-sm border border-[var(--line)] px-2 py-1">
                  {t}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ToolboxPinned() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGPathElement>(null);
  const leftRef = useRef<HTMLUListElement>(null);
  const rightRef = useRef<HTMLUListElement>(null);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const spacerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    if (!root || !stage || !left || !right) return;
    const reduced = prefersReducedMotion();
    const demos: Demo[] = BEATS.map((b) => {
      const d = DEMO_FACTORIES[b.demo](stage);
      utils.set(d.el, { opacity: 0.001 });
      return d;
    });
    const observers: ScrollObserver[] = [];
    const labelsL = Array.from(left.querySelectorAll<HTMLLIElement>("li"));
    const labelsR = Array.from(right.querySelectorAll<HTMLLIElement>("li"));
    let active = -1;
    const setLabels = (tags: string[]) => {
      labelsL.forEach((li, i) => (li.textContent = tags[i] ?? ""));
      labelsR.forEach((li, i) => (li.textContent = tags[i + 3] ?? ""));
    };

    const activate = (i: number) => {
      if (active === i) return;
      const prev = active;
      active = i;
      const beat = BEATS[i];
      root.style.setProperty("--accent", beat.accent);
      if (prev >= 0) {
        demos[prev].leave();
        animate(demos[prev].el, { opacity: 0.001, duration: 250, ease: "inOut(3)" });
        const pt = textRefs.current[prev];
        if (pt) {
          animate(pt, { opacity: 0, y: -12, duration: 250, ease: "out(3)" });
          const ul = pt.querySelector<HTMLElement>(".feature-links");
          if (ul) animate(ul, { opacity: 0, duration: 200 });
        }
        animate([...labelsL, ...labelsR], { opacity: 0, duration: 150 });
      }
      demos[i].enter();
      animate(demos[i].el, { opacity: 1, duration: 250, ease: "inOut(3)" });
      const t = textRefs.current[i];
      if (t) {
        animate(t, { opacity: [0, 1], y: [12, 0], duration: 350, ease: "out(3)" });
        const ul = t.querySelector<HTMLElement>(".feature-links");
        if (ul) {
          animate(ul, { opacity: 1, "--scaleX": { to: [0, 1], duration: 300, ease: "inOut(2.4)" }, duration: 350, ease: "inOut(3)" });
          animate(ul.querySelectorAll("li"), { opacity: [0.001, 1], duration: 250, delay: stagger(100, { start: 350 }), ease: "inOut(3)" });
          animate(ul.querySelectorAll(".icon"), { x: ["-.25rem", 0], duration: 250, delay: stagger(100, { start: 350 }), ease: "inOut(3)" });
        }
      }
      setTimeout(() => {
        if (active !== i) return;
        setLabels(beat.tags);
        animate(labelsL, { opacity: [0, 1], x: ["-.5rem", 0], duration: 300, delay: stagger(60) });
        animate(labelsR, { opacity: [0, 1], x: [".5rem", 0], duration: 300, delay: stagger(60) });
      }, 160);
    };

    if (reduced) {
      activate(0);
      demos[0].leave();
      return () => demos.forEach((d) => d.destroy());
    }

    BEATS.forEach((_, i) => {
      const spacer = spacerRefs.current[i];
      if (!spacer) return;
      observers.push(
        onScroll({
          target: spacer,
          enter: "center top",
          leave: "center bottom",
          repeat: true,
          onEnter: () => activate(i),
          onEnterForward: () => activate(i),
          onEnterBackward: () => activate(i),
        })
      );
    });

    let ringAnim: ReturnType<typeof animate> | null = null;
    if (ringRef.current) {
      ringAnim = animate(svg.createDrawable(ringRef.current), {
        draw: ["0 0", "0 1"],
        ease: "linear",
        autoplay: onScroll({ target: root, enter: "top top", leave: "bottom bottom", sync: 0.2 }),
      });
    }
    return () => {
      observers.forEach((o) => o.revert());
      ringAnim?.revert();
      demos.forEach((d) => d.destroy());
      utils.remove([...labelsL, ...labelsR]);
    };
  }, []);

  return (
    <section
      id="toolbox"
      ref={rootRef}
      className="relative"
      style={{ height: `${(N + 1) * 100}vh`, "--accent": BEATS[0].accent } as React.CSSProperties}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {BEATS.map((b, i) => (
          <div
            key={b.id}
            ref={(el) => {
              spacerRefs.current[i] = el;
            }}
            style={{ height: i === N - 1 ? "200vh" : "100vh" }}
          />
        ))}
      </div>

      <div className="sticky top-0 h-[100vh] overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" aria-hidden />
        <div className="eyebrow absolute left-5 top-20 z-20 flex items-center gap-3 md:left-10 md:top-24">
          <span className="block h-px w-8" style={{ background: "var(--accent)" }} />
          <span>{"02 / Toolbox"}</span>
        </div>

        {/* beat copy */}
        <div className="absolute left-5 top-32 z-20 w-[calc(100%-2.5rem)] md:bottom-16 md:left-10 md:top-auto md:w-[26rem]">
          {BEATS.map((b, i) => (
            <div
              key={b.id}
              ref={(el) => {
                textRefs.current[i] = el;
              }}
              className="absolute left-0 top-0 w-full md:bottom-0 md:top-auto"
              style={{ opacity: 0 }}
            >
              <div className="eyebrow mb-3 flex items-center gap-3" style={{ color: "var(--accent)" }}>
                <span>
                  0{i + 1} / {b.eyebrow}
                </span>
                <span className="text-fg-4">· {b.part}</span>
              </div>
              <h2 className="display display-m font-medium text-fg">{b.title}</h2>
              <p className="mt-4 max-w-sm font-display text-sm leading-relaxed text-fg-2 md:text-base">{b.blurb}</p>
              <ul className="feature-links mt-5 hidden md:block" style={{ opacity: 0 }}>
                {b.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      data-cursor
                      className="group flex items-center gap-2 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-2 transition-colors hover:text-[var(--accent)]"
                    >
                      <svg viewBox="0 0 24 24" className="icon h-4 w-4 text-fg-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" aria-hidden>
                        <polygon fill="currentColor" points="17.737 11.987 12.5 17.225 11.263 15.987 14.388 12.862 6.5 12.862 6.5 11.112 14.388 11.112 11.263 7.987 12.5 6.75" />
                      </svg>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* stage: the focused board part sits behind this (Board.tsx) */}
        <div className="absolute left-1/2 top-[58%] z-10 aspect-square w-[min(440px,86vw)] -translate-x-1/2 -translate-y-1/2 md:left-[64%] md:top-1/2">
          <svg viewBox="0 0 440 440" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
            <circle cx="220" cy="220" r="212" fill="none" stroke="var(--accent)" strokeOpacity="0.12" strokeWidth="1" />
            <path ref={ringRef} d="M220 8 a212 212 0 1 1 -0.01 0" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div ref={stageRef} className="stage" />
          <ul ref={leftRef} className="toolbox-labels toolbox-labels-left" aria-hidden>
            <li /><li /><li />
          </ul>
          <ul ref={rightRef} className="toolbox-labels toolbox-labels-right" aria-hidden>
            <li /><li /><li />
          </ul>
        </div>
      </div>
    </section>
  );
}
