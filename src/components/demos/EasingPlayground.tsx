"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, spring, cubicBezier, eases, utils, type JSAnimation } from "animejs";
import { prefersReducedMotion } from "@/lib/reducedMotion";

/**
 * A pocket version of animejs.com/easing-editor: a strip of square
 * curve tiles (coloured by family), a big curve plot with a playhead,
 * a ball that runs the chosen ease on loop, and a copyable code
 * snippet. Powered by anime.js's own easing functions, so what you see
 * is exactly what `ease: '...'` produces.
 */

type EaseFn = (t: number) => number;
type Curve = {
  id: string;
  label: string;
  family: "spring" | "bezier" | "power" | "sine" | "expo" | "back" | "elastic" | "bounce" | "circ";
  code: string;
  fn: EaseFn;
  // springs overshoot: give the plot headroom
  range?: [number, number];
};

const FAMILY_COLOR: Record<Curve["family"], string> = {
  spring: "#ff7d36",
  bezier: "#ffcc2a",
  power: "#b7ff54",
  sine: "#00ffaa",
  expo: "#26f2d5",
  circ: "#4d9cff",
  back: "#a369ff",
  elastic: "#e962bf",
  bounce: "#ff4b4b",
};

const springCurve = (label: string, p: { stiffness?: number; damping?: number; mass?: number }) => {
  const s = spring(p);
  return {
    id: `spring-${label}`,
    label: `spring ${label}`,
    family: "spring" as const,
    code: `spring({ stiffness: ${p.stiffness ?? 100}, damping: ${p.damping ?? 10}, mass: ${p.mass ?? 1} })`,
    fn: s.ease,
    range: [-0.3, 1.3] as [number, number],
  };
};

const CURVES: Curve[] = [
  springCurve("default", { stiffness: 100, damping: 10, mass: 1 }),
  springCurve("snappy", { stiffness: 300, damping: 20, mass: 1 }),
  springCurve("bouncy", { stiffness: 120, damping: 6, mass: 1 }),
  springCurve("strong", { stiffness: 500, damping: 30, mass: 2 }),
  { id: "bez-in", label: "bezier in", family: "bezier", code: "cubicBezier(.42, 0, 1, 1)", fn: cubicBezier(0.42, 0, 1, 1) },
  { id: "bez-out", label: "bezier out", family: "bezier", code: "cubicBezier(0, 0, .58, 1)", fn: cubicBezier(0, 0, 0.58, 1) },
  { id: "bez-inout", label: "bezier inOut", family: "bezier", code: "cubicBezier(.42, 0, .58, 1)", fn: cubicBezier(0.42, 0, 0.58, 1) },
  { id: "pow-in", label: "power in", family: "power", code: "'in(3)'", fn: eases.in(3) },
  { id: "pow-out", label: "power out", family: "power", code: "'out(3)'", fn: eases.out(3) },
  { id: "pow-inout", label: "power inOut", family: "power", code: "'inOut(3)'", fn: eases.inOut(3) },
  { id: "pow-outin", label: "power outIn", family: "power", code: "'outIn(3)'", fn: eases.outIn(3) },
  { id: "sine-in", label: "inSine", family: "sine", code: "'inSine'", fn: eases.inSine },
  { id: "sine-out", label: "outSine", family: "sine", code: "'outSine'", fn: eases.outSine },
  { id: "sine-inout", label: "inOutSine", family: "sine", code: "'inOutSine'", fn: eases.inOutSine },
  { id: "expo-in", label: "inExpo", family: "expo", code: "'inExpo'", fn: eases.inExpo },
  { id: "expo-out", label: "outExpo", family: "expo", code: "'outExpo'", fn: eases.outExpo },
  { id: "expo-inout", label: "inOutExpo", family: "expo", code: "'inOutExpo'", fn: eases.inOutExpo },
  { id: "circ-out", label: "outCirc", family: "circ", code: "'outCirc'", fn: eases.outCirc },
  { id: "circ-inout", label: "inOutCirc", family: "circ", code: "'inOutCirc'", fn: eases.inOutCirc },
  { id: "back-out", label: "outBack", family: "back", code: "'outBack(1.7)'", fn: eases.outBack(1.7), range: [-0.2, 1.2] },
  { id: "back-inout", label: "inOutBack", family: "back", code: "'inOutBack(1.7)'", fn: eases.inOutBack(1.7), range: [-0.2, 1.2] },
  { id: "elastic-out", label: "outElastic", family: "elastic", code: "'outElastic(1, .5)'", fn: eases.outElastic(1, 0.5), range: [-0.3, 1.3] },
  { id: "elastic-inout", label: "inOutElastic", family: "elastic", code: "'inOutElastic(1, .5)'", fn: eases.inOutElastic(1, 0.5), range: [-0.3, 1.3] },
  { id: "bounce-out", label: "outBounce", family: "bounce", code: "'outBounce'", fn: eases.outBounce },
  { id: "bounce-inout", label: "inOutBounce", family: "bounce", code: "'inOutBounce'", fn: eases.inOutBounce },
];

const SAMPLES = 120;

/** Sample an easing into an SVG path inside a w x h box with y flipped. */
function curvePath(fn: EaseFn, w: number, h: number, range: [number, number] = [0, 1], pad = 0) {
  const [lo, hi] = range;
  const span = hi - lo;
  let d = "";
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const v = fn(t);
    const x = pad + t * (w - pad * 2);
    const y = pad + (1 - (v - lo) / span) * (h - pad * 2);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

export function EasingPlayground() {
  const [activeId, setActiveId] = useState(CURVES[0].id);
  const [copied, setCopied] = useState(false);
  const active = useMemo(() => CURVES.find((c) => c.id === activeId)!, [activeId]);
  const color = FAMILY_COLOR[active.family];

  const plotRef = useRef<SVGSVGElement>(null);
  const headRef = useRef<SVGCircleElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const W = 400;
  const H = 300;
  const PAD = 24;
  const range = useMemo<[number, number]>(() => active.range ?? [0, 1], [active]);
  const path = useMemo(() => curvePath(active.fn, W, H, range, PAD), [active, range]);

  // Run the ball + playhead on the chosen ease, looping.
  useEffect(() => {
    const ball = ballRef.current;
    const head = headRef.current;
    const track = trackRef.current;
    if (!ball || !head || !track) return;
    if (prefersReducedMotion()) {
      utils.set(ball, { x: 0 });
      return;
    }
    const [lo, hi] = range;
    const span = hi - lo;
    const dist = () => Math.max(0, track.clientWidth - ball.offsetWidth);
    const proxy = { t: 0 };
    const anims: JSAnimation[] = [];
    anims.push(
      animate(proxy, {
        t: 1,
        duration: active.family === "spring" ? 1800 : 1400,
        ease: "linear",
        loop: true,
        loopDelay: 500,
        onUpdate: () => {
          const v = active.fn(proxy.t);
          const x = PAD + proxy.t * (W - PAD * 2);
          const y = PAD + (1 - (v - lo) / span) * (H - PAD * 2);
          head.setAttribute("cx", x.toFixed(2));
          head.setAttribute("cy", y.toFixed(2));
          ball.style.transform = `translate3d(${(v * dist()).toFixed(2)}px, 0, 0)`;
        },
      })
    );
    return () => {
      anims.forEach((a) => a.cancel());
    };
  }, [active, range]);

  const snippet = `animate('.ball', {\n  x: 240,\n  ease: ${active.code},\n});`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section
      id="easings"
      className="relative overflow-hidden px-5 py-16 md:px-10 md:py-24"
      style={{ "--accent": color } as React.CSSProperties}
    >
      <div className="absolute inset-0 grid-bg opacity-10" aria-hidden />
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.35em] text-fg/50">
          <span className="block h-px w-8" style={{ background: color }} />
          <span>{"Playground / Easings"}</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2
            className="font-display font-light leading-[0.95] tracking-[-0.04em] text-fg"
            style={{ fontSize: "clamp(2.25rem, 5vw, 4.5rem)" }}
          >
            Easing <span style={{ color }}>editor</span>.
          </h2>
          <p className="max-w-sm font-display text-base text-fg-2">
            The curves I reach for. Pick one to see it on a plot and on a
            ball, then copy the snippet.
          </p>
        </div>

        {/* curve strip */}
        <div className="strip mt-10 -mx-5 overflow-x-auto px-5 md:-mx-10 md:px-10">
          <ul className="flex w-max gap-px">
            {CURVES.map((c) => {
              const col = FAMILY_COLOR[c.family];
              const isActive = c.id === activeId;
              return (
                <li key={c.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveId(c.id)}
                    data-cursor
                    data-cursor-label={c.label.toUpperCase()}
                    aria-pressed={isActive}
                    className={`easing-tile group relative flex h-28 w-28 flex-col justify-between border p-2 text-left transition ${
                      isActive ? "bg-fg/[0.06]" : "bg-bg/60 hover:bg-fg/[0.04]"
                    }`}
                    style={{ borderColor: isActive ? col : "rgba(245,245,245,0.1)", color: col }}
                  >
                    <svg viewBox="0 0 100 100" className="h-14 w-full" aria-hidden>
                      <path d={curvePath(c.fn, 100, 100, c.range ?? [0, 1], 6)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-fg-2 group-hover:text-fg">
                      {c.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* editor pane */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="relative border border-[var(--line)] bg-bg/70 backdrop-blur-md">
            <svg ref={plotRef} viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-label={`${active.label} easing curve`}>
              <defs>
                <pattern id="ease-grid" width="25" height="25" patternUnits="userSpaceOnUse">
                  <path d="M25 0H0V25" fill="none" stroke="rgba(245,245,245,0.06)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width={W} height={H} fill="url(#ease-grid)" />
              {/* 0 and 1 guide lines */}
              {[0, 1].map((v) => {
                const y = PAD + (1 - (v - range[0]) / (range[1] - range[0])) * (H - PAD * 2);
                return <line key={v} x1={PAD} x2={W - PAD} y1={y} y2={y} stroke="rgba(245,245,245,0.18)" strokeDasharray="3 4" />;
              })}
              <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 6px ${color}80)` }} />
              <circle ref={headRef} r="6" cx={PAD} cy={H - PAD} fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
            </svg>
            <div className="absolute left-3 top-3 font-mono text-[10px] uppercase tracking-[0.3em] text-fg-3">
              {active.family} · {active.label}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* ball track */}
            <div className="border border-[var(--line)] bg-bg/70 p-5 backdrop-blur-md">
              <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-fg-3">Preview</div>
              <div ref={trackRef} className="relative h-12 w-full border-y border-dashed border-[var(--line)]">
                <div
                  ref={ballRef}
                  className="ball absolute left-0 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full"
                  style={{ background: color, boxShadow: `0 0 24px ${color}80`, willChange: "transform" }}
                />
              </div>
            </div>
            {/* code preview */}
            <div className="code-preview flex-1 border border-[var(--line)] bg-bg/70 backdrop-blur-md">
              <header className="flex items-center justify-between border-b border-fg/10 px-4 py-2.5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-fg-3">anime.js</h3>
                <button
                  type="button"
                  onClick={copy}
                  data-cursor
                  className="font-mono text-[10px] uppercase tracking-[0.25em] transition"
                  style={{ color }}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </header>
              <pre className="m-0 overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-fg-2">
                <code>{snippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
