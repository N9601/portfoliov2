"use client";

import { useEffect, useRef } from "react";
import { createTimeline, splitText, stagger, utils, type TextSplitter, type Timeline } from "animejs";
import { prefersReducedMotion } from "@/lib/reducedMotion";

type Props = {
  words: string[];
  /** start cycling once true */
  when?: boolean;
  className?: string;
};

/**
 * animejs.com's "animate anything" word cycler: chars collapse from the
 * last one while a dot stretches back to the start, then the next
 * word's chars pop in from the first while the dot rides out again.
 */
export function Cycler({ words, when = true, className }: Props) {
  const wordRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const word = wordRef.current;
    const dot = dotRef.current;
    if (!word || !dot || !when || prefersReducedMotion()) return;
    let idx = 0;
    let current: TextSplitter | null = null;
    let loop: Timeline | null = null;
    let stopped = false;

    const resplit = (html?: string) => {
      current?.revert();
      if (html !== undefined) word.innerHTML = html;
      current = splitText(word, { words: { class: "word" }, chars: { class: "char" } });
      return current;
    };

    const cycle = () => {
      if (stopped) return;
      const chars = resplit().chars;
      loop = createTimeline({
        delay: 1600,
        onComplete: () => {
          if (stopped) return;
          idx = (idx + 1) % words.length;
          const next = resplit(words[idx]);
          loop = createTimeline({ onComplete: cycle })
            .add(
              next.chars,
              { opacity: [0, 1], scaleX: [0, 1], x: [10, 0], duration: 150, delay: stagger(25, { from: "first", ease: "in(3)", start: 100 }) },
              0
            )
            .add(
              dot,
              { x: [-word.offsetWidth, 0], scaleX: [8, 1], transformOrigin: ["0% 0%", "0% 0%"], color: "var(--fg-2)", duration: next.chars.length * 25 + 75, ease: "out(3)" },
              0
            )
            .add({ duration: 750 })
            .init();
        },
      })
        .add(chars, { opacity: 0, scaleX: 0, duration: 100, delay: stagger(25, { from: "last", ease: "in(3)" }) }, 0)
        .add(
          dot,
          { x: -word.offsetWidth, transformOrigin: ["100% 0%", "100% 0%"], scaleX: [4, 1], duration: chars.length * 25 + 100, color: "var(--accent)", delay: 50, ease: "out(3)" },
          0
        )
        .init();
    };
    // give the surrounding SplitIn a beat to land first
    const t = setTimeout(cycle, 1400);

    return () => {
      stopped = true;
      clearTimeout(t);
      loop?.cancel();
      current?.revert();
      utils.remove([word, dot]);
    };
  }, [when, words]);

  return (
    <span className={`cycler relative inline-block whitespace-nowrap ${className ?? ""}`}>
      <span ref={wordRef} className="relative text-fg">
        {words[0]}
      </span>
      <span ref={dotRef} aria-hidden className="cycler-dot absolute text-fg-2" style={{ right: "-.3em", bottom: 0 }}>
        .
      </span>
    </span>
  );
}
