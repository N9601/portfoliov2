"use client";

import { CHAPTERS, type ChapterId } from "./chapters";

/**
 * Tiny external store for page scroll state. One scroll observer
 * (ScrubController) writes; the scrub bar, chapters, and the accent
 * token on <html> read. No React state, no re-renders on scroll.
 */
export type ScrubState = {
  /** 0..1 across the whole document */
  progress: number;
  /** index into CHAPTERS */
  chapter: number;
  /** 0..1 inside the current chapter */
  local: number;
  /** true while the bar cursor is being dragged */
  grabbed: boolean;
};

const state: ScrubState = { progress: 0, chapter: 0, local: 0, grabbed: false };
const listeners = new Set<(s: ScrubState) => void>();

export function getScrub(): ScrubState {
  return state;
}

export function setScrub(patch: Partial<ScrubState>) {
  let changed = false;
  for (const k in patch) {
    const key = k as keyof ScrubState;
    if (state[key] !== patch[key]) {
      (state as Record<string, unknown>)[key] = patch[key];
      changed = true;
    }
  }
  if (!changed) return;
  listeners.forEach((l) => l(state));
}

export function subscribeScrub(l: (s: ScrubState) => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Measured layout of every chapter section, in document pixels. */
export type ChapterBounds = { id: ChapterId; top: number; height: number };

export function measureChapters(): ChapterBounds[] {
  return CHAPTERS.map((c) => {
    const el = document.getElementById(c.id);
    return {
      id: c.id,
      top: el ? el.offsetTop : 0,
      height: el ? el.offsetHeight : 1,
    };
  });
}

export function maxScroll(): number {
  return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
}

/** Which chapter owns a given scroll position (probe at 40% viewport). */
export function chapterAt(scrollY: number, bounds: ChapterBounds[]): { chapter: number; local: number } {
  const probe = scrollY + window.innerHeight * 0.4;
  let idx = 0;
  for (let i = 0; i < bounds.length; i++) {
    if (bounds[i].top <= probe) idx = i;
  }
  const b = bounds[idx];
  const local = Math.min(1, Math.max(0, (scrollY - b.top) / Math.max(1, b.height - window.innerHeight)));
  return { chapter: idx, local };
}
