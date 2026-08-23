"use client";

import { useEffect, useRef } from "react";

/**
 * Custom cursor: a dot that tracks instantly, a ring that lags, and a
 * label read from the nearest `[data-cursor-label]`. Mounted only on
 * fine pointers (CSS hides the native cursor there). Colours come from
 * `--accent`, so the ring recolours with the chapter for free.
 */
export function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const ring = ringRef.current;
    const dot = dotRef.current;
    const label = labelRef.current;
    if (!ring || !dot || !label) return;

    const target = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    let hover = false;

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
    };
    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor]");
      const next = !!el;
      const text = el?.dataset.cursorLabel ?? "";
      if (next !== hover) {
        hover = next;
        ring.classList.toggle("is-hover", hover);
      }
      if (label.textContent !== text) label.textContent = text;
    };

    let raf = 0;
    const loop = () => {
      pos.x += (target.x - pos.x) * 0.18;
      pos.y += (target.y - pos.y) * 0.18;
      ring.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="cursor-ring pointer-events-none fixed left-0 top-0 z-[10001] hidden items-center justify-center rounded-full border [@media(pointer:fine)]:flex"
        style={{
          width: 28,
          height: 28,
          borderColor: "var(--accent)",
          background: "color-mix(in srgb, var(--accent) 6%, transparent)",
          transition:
            "width 220ms var(--ease-out), height 220ms var(--ease-out), background 220ms, border-color 300ms",
          mixBlendMode: "difference",
        }}
      >
        <span ref={labelRef} className="font-mono text-[10px] uppercase tracking-widest text-fg" />
      </div>
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[10002] hidden h-1 w-1 rounded-full bg-fg [@media(pointer:fine)]:block"
      />
      <style>{`.cursor-ring.is-hover{width:64px!important;height:64px!important;background:color-mix(in srgb,var(--accent) 14%,transparent)!important}`}</style>
    </>
  );
}
