"use client";

import { useEffect, useRef } from "react";
import { createTimeline, onScroll, utils, type ScrollObserver, type Timeline } from "animejs";
import { prefersReducedMotion } from "@/lib/reducedMotion";

const N = 18;

/**
 * AlgoWizard: bubble sort as a bar chart. Every comparison lights a
 * pair, every swap is a real animated x-swap via an anime timeline,
 * so scrubbing through is the same thing the platform lets students do.
 */
export function SortViz({ accent }: { accent: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const bars = Array.from(root.querySelectorAll<HTMLElement>("[data-bar]"));
    const W = 100 / N;
    const heights = bars.map((b) => Number(b.dataset.h));
    if (prefersReducedMotion()) return;
    let tl: Timeline | null = null;

    const build = () => {
      tl?.cancel();
      const order = bars.map((_, i) => i); // order[pos] = bar index
      const pos = bars.map((_, i) => i); // pos[bar] = position
      const h = [...heights];
      const t = createTimeline({ defaults: { ease: "inOut(2)" }, loop: true, loopDelay: 1200 });
      let at = 400;
      for (let i = 0; i < N - 1; i++) {
        for (let j = 0; j < N - 1 - i; j++) {
          const a = order[j];
          const b = order[j + 1];
          t.add([bars[a], bars[b]], { backgroundColor: accent, duration: 60 }, at);
          if (h[j] > h[j + 1]) {
            t.add(bars[a], { left: `${(j + 1) * W}%`, duration: 160 }, at);
            t.add(bars[b], { left: `${j * W}%`, duration: 160 }, at);
            [order[j], order[j + 1]] = [b, a];
            [h[j], h[j + 1]] = [h[j + 1], h[j]];
            pos[a] = j + 1;
            pos[b] = j;
            at += 170;
          } else {
            at += 70;
          }
          t.add([bars[a], bars[b]], { backgroundColor: "rgba(245,245,245,0.25)", duration: 120 }, at);
        }
      }
      t.add(bars, { backgroundColor: accent, duration: 300 }, at + 100);
      t.add(bars, { left: (_?: unknown, i = 0) => `${i * W}%`, backgroundColor: "rgba(245,245,245,0.25)", duration: 500 }, at + 1200);
      t.init();
      tl = t;
    };
    const obs: ScrollObserver = onScroll({
      target: root,
      enter: "bottom-=15% top",
      leave: "top bottom",
      repeat: true,
      onEnter: () => (tl ? tl.play() : build()),
      onLeave: () => tl?.pause(),
    });
    return () => {
      obs.revert();
      tl?.cancel();
      utils.remove(bars);
    };
  }, [accent]);

  // deterministic shuffled heights
  const hs = Array.from({ length: N }, (_, i) => 15 + ((i * 37) % N) * (80 / N));
  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden p-4">
      {hs.map((h, i) => (
        <div
          key={i}
          data-bar
          data-h={h}
          className="absolute bottom-4 rounded-t-sm"
          style={{ left: `${(i * 100) / N}%`, width: `calc(${100 / N}% - 3px)`, height: `${h}%`, background: "rgba(245,245,245,0.25)" }}
        />
      ))}
      <div className="eyebrow-sm absolute left-4 top-3">bubble sort · n={N}</div>
    </div>
  );
}
