"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  animate,
  createAnimatable,
  createDraggable,
  createTimeline,
  stagger,
  utils,
  type Draggable,
} from "animejs";
import { CHAPTERS } from "@/lib/chapters";
import { getScrub, maxScroll, measureChapters, setScrub, subscribeScrub } from "@/lib/scrub";
import { prefersReducedMotion } from "@/lib/reducedMotion";

/**
 * The page's single progress instrument (after animejs.com's sub-nav):
 * a tick-marked bar with one click-target per chapter, a draggable
 * cursor that scrubs the page, a ghost cursor trailing the pointer,
 * and a code card that slides up for the current chapter.
 *
 * Desktop: fixed bottom-centre. Phones: a slimmer bottom sheet handle
 * with the same bar and no code card.
 */
export function ScrubBar() {
  const home = usePathname() === "/";
  const cardRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const codeRefs = useRef<(HTMLPreElement | null)[]>([]);
  const buttonRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const card = cardRef.current;
    const bar = barRef.current;
    const cursor = cursorRef.current;
    const ghost = ghostRef.current;
    if (!home || !card || !bar || !cursor || !ghost) return;
    const reduced = prefersReducedMotion();
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const buttons = buttonRefs.current.filter(Boolean) as HTMLAnchorElement[];
    const cards = codeRefs.current.filter(Boolean) as HTMLPreElement[];

    // Buttons sized to their chapter's share of the page
    const layout = () => {
      const b = measureChapters();
      const total = b.reduce((a, x) => a + x.height, 0) || 1;
      buttons.forEach((btn, i) => {
        btn.style.width = `${(b[i].height / total) * 100}%`;
      });
    };
    layout();
    const onResize = () => layout();
    window.addEventListener("resize", onResize);
    const settle = setTimeout(layout, 800);

    const scrollToProgress = (p: number) => {
      window.scrollTo({ top: maxScroll() * utils.clamp(p, 0, 1), behavior: "auto" });
    };
    const progressFromEvent = (e: MouseEvent) => {
      const r = bar.getBoundingClientRect();
      return utils.snap(1 / 65).round(4).clamp(0, 1)((e.clientX - r.left) / r.width);
    };

    // Show/hide near the page edges
    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      card.style.pointerEvents = "auto";
      if (reduced) {
        utils.set(card, { opacity: 1, y: 0 });
        return;
      }
      createTimeline()
        .add(card, { opacity: 1, y: ["100%", 0], duration: 250 })
        .add(buttons, { opacity: [0, 0.5], duration: 250, delay: stagger(20) })
        .add(cursor, { opacity: [0, 1], scale: [0, 1.2, 1], duration: 250 }, "<<+=250")
        .init();
    };
    const hide = () => {
      if (!shown) return;
      shown = false;
      card.style.pointerEvents = "none";
      if (reduced) {
        utils.set(card, { opacity: 0 });
        return;
      }
      createTimeline().add(card, { opacity: 0, y: "100%", duration: 250 }).init();
    };

    const ghostAnim = createAnimatable(ghost, { x: 150, scale: 250, opacity: 150 });
    const ghostShow = () => {
      ghostAnim.opacity(1);
      ghostAnim.scale(1);
    };
    const ghostHide = () => {
      ghostAnim.opacity(0);
      ghostAnim.scale(0);
    };
    const grow = () => animate(cursor, { scale: 1.25, duration: 250 });
    const shrink = () => animate(cursor, { scale: 1, duration: 150 });

    utils.set(cursor, { x: 0, scale: 1 });
    const drag: Draggable = createDraggable(cursor, {
      y: false,
      container: bar,
      containerFriction: 1,
      containerPadding: [0, -1, 0, -1],
      onGrab: () => {
        setScrub({ grabbed: true });
        grow();
        ghostHide();
      },
      onRelease: (d) => {
        setScrub({ grabbed: false });
        shrink();
        if (d.progressX < 0.02 || d.progressX > 0.98) hide();
        else show();
      },
      onUpdate: (d) => {
        if (d.grabbed) scrollToProgress(d.progressX);
      },
    });
    drag.progressX = 0;

    const onBarClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t && !t.classList.contains("scrub-cursor")) {
        e.preventDefault();
        scrollToProgress(progressFromEvent(e));
      }
    };
    const onBarMove = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t && !t.classList.contains("scrub-cursor") && !drag.grabbed) {
        ghostAnim.x(progressFromEvent(e) * bar.offsetWidth - 2);
        ghostShow();
      } else {
        ghostHide();
      }
    };
    bar.addEventListener("click", onBarClick);
    if (!coarse) {
      bar.addEventListener("mousemove", onBarMove);
      bar.addEventListener("mouseenter", ghostShow);
      bar.addEventListener("mouseleave", ghostHide);
      cursor.addEventListener("mouseenter", grow);
      cursor.addEventListener("mouseleave", shrink);
    }

    // Store -> bar
    let lastChapter = -1;
    cards.forEach((c) => utils.set(c, { y: "120%", opacity: 0 }));
    const unsub = subscribeScrub((s) => {
      if (!s.grabbed) drag.progressX = s.progress;
      if (pctRef.current) pctRef.current.textContent = `${utils.round(s.progress * 100, 0)}%`;
      if (s.progress < 0.02 || s.progress > 0.985) hide();
      else show();
      if (s.chapter !== lastChapter) {
        const prev = lastChapter;
        lastChapter = s.chapter;
        if (labelRef.current) labelRef.current.textContent = CHAPTERS[s.chapter].label.toUpperCase();
        buttons.forEach((b, i) => b.classList.toggle("is-active", i === s.chapter));
        if (!coarse) {
          if (prev >= 0 && cards[prev]) animate(cards[prev], { y: "120%", opacity: 0, ease: "inOut(3)", duration: 250 });
          if (cards[s.chapter]) animate(cards[s.chapter], { y: 0, opacity: 1, ease: "inOut(3)", duration: 350 });
        }
      }
    });
    // initial state
    const init = getScrub();
    drag.progressX = init.progress;

    return () => {
      clearTimeout(settle);
      unsub();
      window.removeEventListener("resize", onResize);
      bar.removeEventListener("click", onBarClick);
      bar.removeEventListener("mousemove", onBarMove);
      bar.removeEventListener("mouseenter", ghostShow);
      bar.removeEventListener("mouseleave", ghostHide);
      cursor.removeEventListener("mouseenter", grow);
      cursor.removeEventListener("mouseleave", shrink);
      drag.revert();
      ghostAnim.revert();
      utils.remove([card, cursor, ghost, ...cards]);
    };
  }, [home]);

  if (!home) return null;
  return (
    <div
      className="pointer-events-none fixed bottom-3 left-1/2 z-40 w-[min(21rem,calc(100vw-1.5rem))] -translate-x-1/2 overflow-hidden md:bottom-5"
      style={{ height: "12rem", paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-hidden
    >
      {CHAPTERS.map((c, i) => (
        <pre
          key={c.id}
          ref={(el) => {
            codeRefs.current[i] = el;
          }}
          className="scrub-card absolute inset-x-0 bottom-12 m-0 hidden overflow-hidden border border-[var(--line)] bg-bg/92 p-3 font-mono text-[10px] leading-[1.35] text-fg-2 md:block"
          style={{ opacity: 0 }}
        >
          <code>{c.code}</code>
        </pre>
      ))}
      <div
        ref={cardRef}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-11 border border-[var(--line)] bg-bg/92"
        style={{ opacity: 0 }}
      >
        <div className="eyebrow-sm flex items-center justify-between px-3 pt-1">
          <span ref={labelRef}>{CHAPTERS[0].label.toUpperCase()}</span>
          <span ref={pctRef}>0%</span>
        </div>
        <div ref={barRef} className="scrub-bar">
          {CHAPTERS.map((c, i) => (
            <a
              key={c.id}
              ref={(el) => {
                buttonRefs.current[i] = el;
              }}
              href={`#${c.id}`}
              className="scrub-button"
              title={c.label}
            />
          ))}
          <div ref={cursorRef} className="scrub-cursor" />
          <div ref={ghostRef} className="scrub-cursor scrub-cursor-ghost" />
        </div>
      </div>
    </div>
  );
}
