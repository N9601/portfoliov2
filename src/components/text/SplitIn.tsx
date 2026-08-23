"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { createTimeline, onScroll, splitText, stagger, utils, type ScrollObserver, type Timeline } from "animejs";
import { prefersReducedMotion } from "@/lib/reducedMotion";

type Props = {
  as?: ElementType;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
  /** "chars" or "words" */
  split?: "chars" | "words";
  /** ms between units */
  step?: number;
  /** wait for this boolean before playing (e.g. board ready) */
  when?: boolean;
  /** play on scroll into view instead of immediately */
  onView?: boolean;
  delay?: number;
};

/**
 * animejs.com's text-appear: units slide in from .35em with an
 * outIn(2) stagger and outQuint motion. Children are rendered as-is
 * (nested spans keep their classes) and split in place.
 */
export function SplitIn({
  as: Tag = "div",
  className,
  style,
  children,
  split = "words",
  step = 25,
  when = true,
  onView = false,
  delay = 0,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!when) {
      el.style.opacity = "0";
      return;
    }
    el.style.opacity = "1";
    if (prefersReducedMotion()) return;

    const s = splitText(el, {
      words: { class: "word" },
      chars: split === "chars" && { class: "char" },
    });
    const units = split === "chars" ? s.chars : s.words;
    const tl: Timeline = createTimeline({ autoplay: !onView, delay })
      .add(units, {
        x: [".35em", 0],
        opacity: [0, 1],
        duration: 1000,
        delay: stagger(step, { ease: "outIn(2)" }),
        ease: "outQuint",
      })
      .init();
    let obs: ScrollObserver | null = null;
    if (onView) {
      obs = onScroll({ target: el, enter: "bottom-=10% top", onEnter: () => tl.play() });
    }
    return () => {
      obs?.revert();
      tl.cancel();
      utils.remove(units);
      s.revert();
    };
  }, [when, split, step, onView, delay]);

  return (
    <Tag ref={ref} className={className} style={{ opacity: 0, ...style }}>
      {children}
    </Tag>
  );
}
