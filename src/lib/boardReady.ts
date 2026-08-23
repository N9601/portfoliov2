"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

let ready = false;
const listeners = new Set<() => void>();
const mark = () => {
  if (ready) return;
  ready = true;
  listeners.forEach((l) => l());
};
if (typeof window !== "undefined") window.addEventListener("board:ready", mark);
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/**
 * True once the board has booted (Board dispatches `board:ready`).
 * Hero text waits on this so words land as the parts do. Falls back to
 * true after `fallbackMs` (board failed / reduced motion / no WebGL).
 */
export function useBoardReady(fallbackMs = 3500): boolean {
  const done = useSyncExternalStore(subscribe, () => ready, () => false);
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (done) return;
    const id = setTimeout(() => setTimedOut(true), fallbackMs);
    return () => clearTimeout(id);
  }, [done, fallbackMs]);
  return done || timedOut;
}
