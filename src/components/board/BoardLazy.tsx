"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { prefersReducedMotion } from "@/lib/reducedMotion";

const BoardScene = dynamic(() => import("./Board").then((m) => m.Board), {
  ssr: false,
  loading: () => null,
});
const BoardStill = dynamic(() => import("./BoardStill").then((m) => m.BoardStill), {
  ssr: false,
  loading: () => null,
});

/**
 * Picks the live board or, under prefers-reduced-motion, a single
 * rendered frame of it in the exploded state. Either way the visitor
 * gets the object; only the choreography differs.
 */
export function BoardLazy() {
  // Server snapshot is "none" so SSR/hydration match; the client
  // snapshot picks the live or still board on first render.
  const mode = useSyncExternalStore(
    () => () => {},
    () => (prefersReducedMotion() ? "still" : "live"),
    () => "none"
  );
  if (mode === "live") return <BoardScene />;
  if (mode === "still") return <BoardStill />;
  return null;
}
