"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { onScroll, animate, type ScrollObserver } from "animejs";
import { CHAPTERS } from "@/lib/chapters";
import { chapterAt, measureChapters, setScrub, type ChapterBounds } from "@/lib/scrub";
import "@/lib/devEngine";

/**
 * The one scroll observer for the page. Writes progress / chapter into
 * the scrub store and keeps the `--accent` token on <html> in sync
 * with the current chapter (tweened, so borders and dots cross-fade).
 */
export function ScrubController() {
  const home = usePathname() === "/";
  useEffect(() => {
    if (!home) return;
    let bounds: ChapterBounds[] = measureChapters();
    const root = document.documentElement;
    root.style.setProperty("--accent", CHAPTERS[0].accent);
    let lastChapter = -1;
    const accentProxy = { c: CHAPTERS[0].accent };

    const update = (progress: number) => {
      const { chapter, local } = chapterAt(window.scrollY, bounds);
      setScrub({ progress, chapter, local });
      if (chapter !== lastChapter) {
        lastChapter = chapter;
        root.dataset.chapter = CHAPTERS[chapter].id;
        animate(accentProxy, {
          c: CHAPTERS[chapter].accent,
          duration: 450,
          ease: "inOut(3)",
          onUpdate: () => root.style.setProperty("--accent", accentProxy.c),
        });
      }
    };

    const obs: ScrollObserver = onScroll({
      target: document.body,
      enter: "max",
      leave: "min",
      sync: 0.9,
      onUpdate: ({ progress }) => update(progress),
    });

    let resizeT: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        bounds = measureChapters();
      }, 150);
    };
    window.addEventListener("resize", onResize);
    // fonts/images settle after first paint; re-measure once
    const t = setTimeout(() => {
      bounds = measureChapters();
      update(obs.progress);
    }, 800);

    return () => {
      clearTimeout(t);
      clearTimeout(resizeT);
      window.removeEventListener("resize", onResize);
      obs.revert();
    };
  }, [home]);
  return null;
}
