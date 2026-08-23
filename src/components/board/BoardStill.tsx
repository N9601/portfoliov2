"use client";

import { useEffect, useRef } from "react";
import { createBoardScene } from "./scene";

/**
 * Reduced-motion board: one frame, exploded, dimmed, no loop. Still a
 * designed state rather than an empty background.
 */
export function BoardStill() {
  const mountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const board = createBoardScene(mount);
    board.parts.forEach((p) => {
      p.ex = 0.6;
      p.bootEx = 0;
    });
    board.state.explode = 0.6;
    board.state.opacity = 0.5;
    board.state.scale = 0.85;
    board.render(1);
    const onResize = () => {
      board.resize();
      board.render(1);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      board.dispose();
    };
  }, []);
  return <div ref={mountRef} className="pointer-events-none fixed inset-0 z-0 h-[100svh] w-full" aria-hidden />;
}
