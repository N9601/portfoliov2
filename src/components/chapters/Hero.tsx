"use client";

import { useEffect, useRef, useState } from "react";
import { createTimeline, stagger, utils } from "animejs";
import { SplitIn } from "@/components/text/SplitIn";
import { Cycler } from "@/components/text/Cycler";
import { useBoardReady } from "@/lib/boardReady";
import { prefersReducedMotion } from "@/lib/reducedMotion";

const EMAIL = "nandakishorereddyg@outlook.com";
const WORDS = ["the web", "React apps", "Go services", "WebGL scenes", "n8n pipelines", "anything"];

/**
 * Chapter 01. The board boots behind this; the words land as the parts
 * do. One headline, one cycling line, one copyable email, one cue.
 */
export function Hero() {
  const ready = useBoardReady();
  const chromeRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Header marks + pill fade in after the headline
  useEffect(() => {
    const el = chromeRef.current;
    if (!el || !ready) return;
    const items = el.querySelectorAll<HTMLElement>("[data-in]");
    if (prefersReducedMotion()) {
      items.forEach((i) => (i.style.opacity = "1"));
      return;
    }
    const tl = createTimeline()
      .add(items, { opacity: [0, 1], y: [10, 0], duration: 800, delay: stagger(90, { start: 700 }), ease: "outQuint" })
      .init();
    return () => {
      tl.cancel();
      utils.remove(items);
    };
  }, [ready]);

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
    <section id="hero" className="relative flex h-[100svh] min-h-[640px] w-full items-center">
      <div ref={chromeRef} className="gutter relative z-20 w-full">
        <div className="col">
          <div data-in className="eyebrow mb-5 flex items-center gap-3" style={{ opacity: 0 }}>
            <span className="block h-px w-8" style={{ background: "var(--accent)" }} />
            <span>{"01 / Hero"}</span>
          </div>
          <SplitIn as="h1" split="chars" when={ready} className="display display-xl text-fg">
            Making
            <br />
            <span className="text-fg-2">systems</span>{" "}
            <span className="italic" style={{ color: "var(--accent)" }}>
              feel
            </span>
            <br />
            <span className="text-fg-2">alive</span>
            <span className="red-dot text-red">.</span>
          </SplitIn>
          <SplitIn
            as="p"
            when={ready}
            delay={500}
            className="mt-6 max-w-md font-display text-base font-medium leading-snug text-fg-2 md:text-lg"
          >
            A full-stack developer from Hyderabad
            <br />
            who builds <Cycler words={WORDS} when={ready} />
          </SplitIn>

          <div data-in className="mt-8 flex flex-wrap items-center gap-3" style={{ opacity: 0 }}>
            <button
              type="button"
              onClick={copy}
              data-cursor
              data-cursor-label={copied ? "COPIED" : "COPY"}
              className="group flex h-11 items-center gap-3 border border-[var(--line)] bg-bg/80 pl-4 pr-3 font-mono text-[12px] text-fg-2 transition hover:border-fg/30 hover:text-fg"
            >
              <span style={{ color: "var(--accent)" }}>$</span>
              <span>mail {EMAIL}</span>
              <span className="ml-2 border-l border-[var(--line)] pl-3 text-fg-4 transition group-hover:text-fg">
                {copied ? "✓" : "⧉"}
              </span>
            </button>
            <a
              href="#toolbox"
              data-cursor
              className="flex h-11 items-center gap-2 border px-5 font-mono text-[11px] uppercase tracking-[0.25em] text-fg transition hover:bg-fg/[0.06]"
              style={{ borderColor: "var(--accent)" }}
            >
              Open the toolbox <span style={{ color: "var(--accent)" }}>↓</span>
            </a>
          </div>
        </div>

        {/* scroll cue */}
        <div data-in className="absolute bottom-[-22vh] right-0 hidden items-center gap-3 md:flex" style={{ opacity: 0 }}>
          <span className="eyebrow" style={{ writingMode: "vertical-rl" }}>
            Scroll
          </span>
          <span className="relative block h-20 w-px overflow-hidden bg-fg/15">
            <span className="absolute inset-x-0 top-0 h-6" style={{ background: "var(--accent)", animation: "cue 2.4s ease-in-out infinite" }} />
          </span>
        </div>
      </div>
      <style>{`
        @keyframes cue { 0%{transform:translateY(-100%);opacity:0} 30%{opacity:1} 100%{transform:translateY(400%);opacity:0} }
      `}</style>
    </section>
  );
}
