"use client";

import { useEffect, useRef } from "react";
import { animate, createTimeline, onScroll, stagger, utils, type Timeline } from "animejs";
import { createBoardScene, type BoardScene, type PartKind } from "./scene";
import { maxScroll, measureChapters } from "@/lib/scrub";

const TAU = Math.PI * 2;

/** Which part group each Toolbox beat pulls to the stage. */
export const TOOLBOX_FOCUS: PartKind[] = ["ram", "cpu", "gpu", "port", "cap"];

/**
 * The spine. A fixed, full-viewport WebGL canvas that lives for the
 * whole page. On mount the board boots (parts fly in, LEDs power up),
 * then a single anime.js timeline, measured in document pixels and
 * scrubbed by scroll, choreographs every chapter:
 *
 *   hero     assembled, idle
 *   toolbox  exploded; one part group per beat pulled to the stage
 *   work     reassembles; RAM sticks slot in one per project
 *   person   tilts to a profile view on the right
 *   contact  faces front, LEDs surge
 */
export function Board() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const board: BoardScene = createBoardScene(mount);
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __board?: BoardScene }).__board = board;
    }

    // ---- Boot ------------------------------------------------------
    // Skip the fly-in when the page is restored mid-scroll; the scroll
    // timeline owns the parts from then on.
    const restoredMidPage = window.scrollY > window.innerHeight * 0.5;
    {
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      board.state.scale = mobile ? 0.7 : 0.9;
      board.state.x = mobile ? 0 : 1.9;
    }
    let scrollTl: Timeline | null = null;
    let booted = false;

    const buildScrollTimeline = () => {
      scrollTl?.revert();
      const vh = window.innerHeight;
      const b = Object.fromEntries(measureChapters().map((c) => [c.id, c])) as Record<
        string,
        { top: number; height: number }
      >;
      const end = maxScroll();
      const parts = board.parts;
      const s = board.state;
      // Phones: smaller board, no sideways offsets, focus point under the
      // stage (which sits centred, slightly below the middle).
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      const M = mobile ? 0.7 : 0.9; // scale multiplier
      const X = mobile ? 0 : 1; // x offset multiplier
      const R = mobile ? 0 : 1.9; // the "right column" x position
      // focus point is in root space; the root already sits at R during
      // the toolbox, so the focused part just comes forward
      s.focusX = 0;
      s.focusY = mobile ? -0.5 : 0.1;
      s.focusZ = mobile ? 1.8 : 2.8;

      // Every tween is written as [from, to] so seeking backwards and
      // forwards is deterministic regardless of boot state.
      const tl = createTimeline({
        defaults: { ease: "inOut(3)" },
        autoplay: onScroll({
          target: document.body,
          enter: "max",
          leave: "min",
          sync: true,
        }),
      });

      // hero -> explode while the toolbox scrolls up over it
      const heroSpan = Math.max(vh * 0.5, b.toolbox.top);
      tl.add(
        parts,
        { ex: [0, 1], duration: 0.45 * heroSpan, delay: stagger((0.25 * heroSpan) / parts.length, { from: "center" }) },
        heroSpan * 0.2
      );
      tl.add(s, { explode: [0, 1], duration: 0.6 * heroSpan }, heroSpan * 0.25);
      tl.add(
        s,
        { scale: [1 * M, 0.78 * M], opacity: [1, 0.5], duration: vh * 0.8 },
        Math.max(0, b.toolbox.top - vh * 0.8)
      );

      // toolbox -> slow spin, one focused part group per beat
      const tbStart = b.toolbox.top;
      const tbSpan = Math.max(1, b.toolbox.height - vh);
      tl.add(s, { rotY: [0, -TAU], duration: tbSpan, ease: "linear" }, tbStart - vh * 0.3);
      const L = tbSpan / TOOLBOX_FOCUS.length;
      TOOLBOX_FOCUS.forEach((kind, i) => {
        const group = board.byKind(kind);
        const at = tbStart + i * L;
        tl.add(
          group,
          { focus: [0, 1], duration: 0.3 * L, ease: "out(3)", delay: stagger(0.04 * L) },
          at - 0.25 * L
        );
        const outAt = i === TOOLBOX_FOCUS.length - 1 ? b.work.top - vh * 1.1 : at + 0.7 * L;
        tl.add(group, { focus: [1, 0], duration: 0.25 * L, ease: "in(2)", delay: stagger(0.03 * L) }, outAt);
      });

      // work -> reassemble everything except the RAM, board to the right
      const nonRam = parts.filter((p) => p.kind !== "ram");
      const ram = board.byKind("ram");
      tl.add(
        nonRam,
        { ex: [1, 0], duration: vh * 0.7, ease: "out(3)", delay: stagger((vh * 0.4) / nonRam.length, { from: "last" }) },
        b.work.top - vh * 0.9
      );
      tl.add(
        s,
        { explode: [1, 0], scale: [0.78 * M, 1 * M], opacity: [0.5, mobile ? 0.45 : 1], duration: vh * 0.9 },
        b.work.top - vh * 0.9
      );
      // RAM sticks slot in one per project (3 projects, 4th stick rides with the last)
      const wSpan = Math.max(1, b.work.height - vh);
      ram.forEach((stick, i) => {
        const slot = Math.min(i, 2);
        const at = b.work.top + ((slot + 0.5) / 3) * wSpan - vh * 0.25;
        tl.add(stick, { ex: [1, 0], duration: vh * 0.45, ease: "out(4)" }, at + (i === 3 ? vh * 0.1 : 0));
      });

      // person -> profile tilt
      tl.add(
        s,
        { rotY: [-TAU, -TAU + 0.95], rotX: [0, 0.12], x: [R, R + 0.3 * X], duration: vh },
        b.person.top - vh * 0.7
      );

      // contact -> face front, power surge (anchored to the scroll end so
      // nothing runs past the scrollable range)
      const faceAt = Math.min(b.contact.top - vh * 0.7, end - vh * 1.2);
      tl.add(
        s,
        { rotY: [-TAU + 0.95, -TAU], rotX: [0.12, 0], x: [R + 0.3 * X, 0], scale: [1 * M, 0.95 * M], opacity: [mobile ? 0.45 : 1, 0.45], duration: vh * 0.8 },
        faceAt
      );
      tl.add(s, { power: [1, 2.2], duration: vh * 0.35, ease: "outExpo" }, end - vh * 0.4);

      // pad the timeline so its duration equals the scrollable height
      tl.add({ duration: 1 }, end - 1);
      tl.init();
      // init() leaves not-yet-started children at their end values;
      // a full forward/backward pass renders every `from` correctly.
      tl.seek(tl.duration);
      tl.seek(utils.clamp(window.scrollY, 0, end));
      scrollTl = tl;
      if (process.env.NODE_ENV !== "production") {
        (window as unknown as { __scrollTl?: Timeline }).__scrollTl = tl;
      }
    };

    const finishBoot = () => {
      booted = true;
      buildScrollTimeline();
      window.dispatchEvent(new CustomEvent("board:ready"));
    };

    // The boot animates its own fields (bootEx / bootPower) so it never
    // shares a property with the scroll timeline.
    if (restoredMidPage) {
      board.parts.forEach((p) => (p.bootEx = 0));
      board.state.bootPower = 1;
      finishBoot();
    } else {
      board.state.bootPower = 0.15;
      createTimeline({ defaults: { ease: "out(3)" } })
        .add(board.parts, { bootEx: [1, 0], duration: 1100, delay: stagger(28, { start: 350 }) }, 0)
        .add(board.state, { bootPower: [0.15, 1], duration: 900, ease: "outExpo" }, 900)
        .init().onComplete = finishBoot;
    }

    // ---- Render loop ----------------------------------------------
    const start = performance.now();
    let raf = 0;
    let docVisible = document.visibilityState === "visible";
    const loop = () => {
      // Nothing to draw while the board is faded out (end of the page)
      if (board.state.opacity > 0.02) board.render((performance.now() - start) / 1000);
      raf = docVisible ? requestAnimationFrame(loop) : 0;
    };
    raf = requestAnimationFrame(loop);
    const onVis = () => {
      docVisible = document.visibilityState === "visible";
      if (docVisible && !raf) raf = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVis);

    const onCommand = (e: Event) => {
      const cmd = (e as CustomEvent<string>).detail;
      animate(board.state, {
        kick: cmd === "explode" ? 1 : 0,
        duration: cmd === "explode" ? 900 : 700,
        ease: cmd === "explode" ? "out(3)" : "outBack",
      });
    };
    window.addEventListener("board:command", onCommand);

    const onPointer = (e: PointerEvent) => {
      board.setPointer((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", board.bumpActivity, { passive: true });

    let resizeT: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      board.resize();
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        if (booted) buildScrollTimeline();
      }, 200);
    };
    window.addEventListener("resize", onResize);
    // layout settles after fonts; rebuild once so beat positions are exact
    const settle = setTimeout(() => {
      if (booted) buildScrollTimeline();
    }, 1200);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeT);
      clearTimeout(settle);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("board:command", onCommand);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", board.bumpActivity);
      window.removeEventListener("resize", onResize);
      scrollTl?.revert();
      utils.remove([board.state, ...board.parts]);
      board.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="pointer-events-none fixed inset-0 z-0 h-[100svh] w-full"
      aria-hidden
    />
  );
}
