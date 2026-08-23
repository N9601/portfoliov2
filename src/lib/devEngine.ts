"use client";

import { engine, utils, createTimeline, animate, onScroll } from "animejs";

/**
 * Dev-only: expose the anime.js engine so automated checks can tick it
 * by hand where requestAnimationFrame never fires (hidden panes).
 */
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  (window as unknown as { __anime?: unknown }).__anime = { engine, utils, createTimeline, animate, onScroll };
}
