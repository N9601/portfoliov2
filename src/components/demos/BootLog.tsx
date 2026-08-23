"use client";

import { useEffect, useRef } from "react";
import { createTimeline, onScroll, stagger, utils, type ScrollObserver, type Timeline } from "animejs";
import { prefersReducedMotion } from "@/lib/reducedMotion";

const LINES = [
  "[BOOT] PyroOS bootloader v0.3",
  "[BOOT] A20 line enabled",
  "[BOOT] GDT loaded: 3 descriptors",
  "[BOOT] Real -> Protected mode",
  "[KRNL] IDT installed: 256 vectors",
  "[KRNL] PIC remapped (IRQ0..15 -> 0x20)",
  "[KRNL] VGA text driver ready 80x25",
  "[KRNL] PIT @ 100Hz",
  "[KRNL] heap: 4 MiB @ 0x00200000",
  "[KRNL] scheduler: round-robin, 2 tasks",
  "[ OK ] kernel up in 19ms",
];

/** PyroOS: a VGA-style boot log that types itself when scrolled into view. */
export function BootLog({ accent }: { accent: string }) {
  const ref = useRef<HTMLPreElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rows = Array.from(el.querySelectorAll<HTMLElement>("[data-row]"));
    if (prefersReducedMotion()) return;
    utils.set(rows, { opacity: 0 });
    let tl: Timeline | null = null;
    const play = () => {
      tl?.cancel();
      tl = createTimeline()
        .add(rows, { opacity: [0, 1], x: [-4, 0], duration: 120, delay: stagger(140, { start: 200 }), ease: "out(2)" })
        .add(el.querySelector(".caret")!, { opacity: [1, 0], duration: 500, loop: 6, alternate: true })
        .init();
    };
    const obs: ScrollObserver = onScroll({ target: el, enter: "bottom-=15% top", onEnter: play, onLeaveBackward: () => utils.set(rows, { opacity: 0 }), repeat: true });
    return () => {
      obs.revert();
      tl?.cancel();
      utils.remove(rows);
    };
  }, []);
  return (
    <pre ref={ref} className="m-0 h-full overflow-hidden p-4 font-mono text-[11px] leading-[1.55] text-fg-2" style={{ background: "#04040a" }}>
      {LINES.map((l, i) => (
        <div key={i} data-row style={{ color: l.startsWith("[ OK ]") ? accent : undefined }}>
          {l}
        </div>
      ))}
      <span className="caret inline-block h-[1.1em] w-[0.6em] translate-y-[2px]" style={{ background: accent }} />
    </pre>
  );
}
