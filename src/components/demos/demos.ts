"use client";

import {
  animate,
  createTimeline,
  createDraggable,
  spring,
  stagger,
  utils,
  svg,
  type Timeline,
  type Draggable,
  type JSAnimation,
} from "animejs";

/**
 * Self-contained demo widgets, ported from the feature gallery on
 * animejs.com. Each one builds its DOM imperatively inside `stage`
 * (a 400x400 box), exposes enter/leave so the gallery can pause
 * whatever isn't on screen, and tears itself down on destroy.
 */
export type Demo = {
  el: HTMLElement;
  enter: () => void;
  leave: () => void;
  destroy: () => void;
};

const make = (cls: string, tag = "div") => {
  const el = document.createElement(tag);
  el.className = cls;
  return el;
};

/* ------------------------------------------------------------------ */
/* 1. Stagger grid: 13x13 dots breathing from the center              */
/* ------------------------------------------------------------------ */
export function createStaggerGrid(stage: HTMLElement): Demo {
  const el = make("demo demo-grid");
  const GRID = 13;
  const dots: HTMLElement[] = [];
  for (let i = 0; i < GRID * GRID; i++) {
    const d = make("dot");
    el.appendChild(d);
    dots.push(d);
  }
  stage.appendChild(el);

  const opts = { grid: [GRID, GRID] as [number, number], from: "center" as const };
  const tl: Timeline = createTimeline({ loop: true, autoplay: false, defaults: { duration: 800 } })
    .add(
      dots,
      { scale: stagger([1.1, 0.75], opts), ease: "inOutQuad" },
      stagger(200, opts)
    )
    .add(
      dots,
      { scale: 1, ease: "inOutQuad" },
      stagger(200, { ...opts, start: "-=600" })
    )
    .init();

  return {
    el,
    enter: () => tl.play(),
    leave: () => tl.pause(),
    destroy: () => {
      tl.cancel();
      utils.remove(dots);
      el.remove();
    },
  };
}

/* ------------------------------------------------------------------ */
/* 2. Clockwork: 192 ticks around a ring + a sweeping hand            */
/* ------------------------------------------------------------------ */
export function createClock(stage: HTMLElement): Demo {
  const el = make("demo demo-clock");
  const ticks: HTMLElement[] = [];
  const COUNT = 96;
  const R = 160;
  for (let i = 0; i < COUNT; i++) {
    const t = make("tick");
    const deg = (360 / COUNT) * i;
    const rad = (deg * Math.PI) / 180;
    utils.set(t, { x: R * Math.sin(rad), y: -R * Math.cos(rad), rotate: deg });
    el.appendChild(t);
    ticks.push(t);
  }
  const hand = make("ticker");
  el.appendChild(hand);
  const core = make("core");
  el.appendChild(core);
  stage.appendChild(el);

  const tl = createTimeline({ loop: true, autoplay: false })
    .add(ticks, { y: "-=10", opacity: [0.35, 1], duration: 60 }, stagger(20))
    .add(hand, { rotate: 360, duration: COUNT * 20, ease: "linear" }, "<")
    .add(ticks, { y: "+=10", opacity: 0.35, duration: 60 }, stagger(20, { start: 0 }))
    .init();

  return {
    el,
    enter: () => tl.play(),
    leave: () => tl.pause(),
    destroy: () => {
      tl.cancel();
      utils.remove([...ticks, hand]);
      el.remove();
    },
  };
}

/* ------------------------------------------------------------------ */
/* 3. Draggable: throw a disc around a dashed ring, spring it back     */
/* ------------------------------------------------------------------ */
export function createDraggableDemo(stage: HTMLElement): Demo {
  const el = make("demo demo-drag");
  const container = make("drag-container");
  const disc = make("draggable");
  container.appendChild(disc);
  el.appendChild(container);
  const hint = make("drag-hint");
  hint.textContent = "DRAG ME";
  disc.appendChild(hint);
  stage.appendChild(el);

  let drag: Draggable | null = null;
  const idle: JSAnimation = animate(disc, {
    scale: [1, 1.06],
    duration: 1200,
    loop: true,
    alternate: true,
    ease: "inOutSine",
    autoplay: false,
  });

  return {
    el,
    enter: () => {
      idle.play();
      if (!drag) {
        drag = createDraggable(disc, {
          container,
          containerFriction: 0.2,
          releaseEase: spring({ stiffness: 120, damping: 6 }),
          onGrab: () => idle.pause(),
          onSettle: () => idle.play(),
        });
      } else {
        drag.enable();
      }
    },
    leave: () => {
      idle.pause();
      drag?.disable();
    },
    destroy: () => {
      idle.cancel();
      drag?.revert();
      el.remove();
    },
  };
}

/* ------------------------------------------------------------------ */
/* 4. SVG: a circuit path draws itself while a "car" follows it        */
/* ------------------------------------------------------------------ */
export function createMotionTrack(stage: HTMLElement): Demo {
  const el = make("demo demo-track");
  const NS = "http://www.w3.org/2000/svg";
  const svgEl = document.createElementNS(NS, "svg");
  svgEl.setAttribute("viewBox", "0 0 400 400");
  svgEl.classList.add("track-svg");
  const d =
    "M80 120 H240 a40 40 0 0 1 40 40 V230 a40 40 0 0 1 -40 40 H130 a30 30 0 0 0 -30 30 v0 a30 30 0 0 0 30 30 H300 M80 120 a30 30 0 0 0 -30 30 v60 a30 30 0 0 0 30 30 H180";
  const ghost = document.createElementNS(NS, "path");
  ghost.setAttribute("d", d);
  ghost.classList.add("track-ghost");
  const path = document.createElementNS(NS, "path");
  path.setAttribute("d", d);
  path.classList.add("track-path");
  const car = document.createElementNS(NS, "polygon");
  car.setAttribute("points", "-8,-6 8,0 -8,6");
  car.classList.add("track-car");
  svgEl.append(ghost, path, car);
  el.appendChild(svgEl);
  stage.appendChild(el);

  const drawable = svg.createDrawable(path);
  const tl = createTimeline({ loop: true, autoplay: false })
    .add(drawable, { draw: ["0 0", "0 1"], duration: 2400, ease: "inOut(3)" }, 0)
    .add(car, { ...svg.createMotionPath(path), duration: 2400, ease: "inOut(3)" }, 0)
    .add(drawable, { draw: ["0 1", "1 1"], duration: 1400, ease: "inOut(3)" }, "-=200")
    .add(car, { opacity: [1, 0], duration: 300 }, "<+=800")
    .add(car, { opacity: [0, 1], duration: 300 })
    .init();

  return {
    el,
    enter: () => tl.play(),
    leave: () => tl.pause(),
    destroy: () => {
      tl.cancel();
      el.remove();
    },
  };
}

/* ------------------------------------------------------------------ */
/* 5. Responsive: a dotted viewport flips orientation, dots re-flow    */
/* ------------------------------------------------------------------ */
export function createResponsiveDemo(stage: HTMLElement): Demo {
  const el = make("demo demo-responsive");
  const viewport = make("viewport");
  const circles: HTMLElement[] = [];
  for (let i = 0; i < 3; i++) {
    const c = make("circle");
    viewport.appendChild(c);
    circles.push(c);
  }
  el.appendChild(viewport);
  stage.appendChild(el);

  const landscape = { width: 300, height: 180 };
  const portrait = { width: 180, height: 300 };
  utils.set(viewport, landscape);

  const tl = createTimeline({ loop: true, autoplay: false, defaults: { ease: "inOut(3)" } })
    // landscape: dots spread on the x axis, wobble on y
    .add(circles, { x: stagger([-90, 90]), y: 0, duration: 500 }, 0)
    .add(circles, { y: [-40, 40, -40], duration: 1200 }, stagger(100))
    // flip to portrait
    .add(viewport, { ...portrait, duration: 600 }, "+=200")
    .add(circles, { x: 0, y: stagger([-90, 90]), duration: 600 }, "<")
    .add(circles, { x: [-40, 40, -40], duration: 1200 }, stagger(100))
    // and back
    .add(viewport, { ...landscape, duration: 600 }, "+=200")
    .add(circles, { y: 0, x: stagger([-90, 90]), duration: 600 }, "<")
    .init();

  return {
    el,
    enter: () => tl.play(),
    leave: () => tl.pause(),
    destroy: () => {
      tl.cancel();
      utils.remove([viewport, ...circles]);
      el.remove();
    },
  };
}

export const DEMO_FACTORIES = {
  grid: createStaggerGrid,
  clock: createClock,
  drag: createDraggableDemo,
  track: createMotionTrack,
  responsive: createResponsiveDemo,
} as const;

export type DemoKey = keyof typeof DEMO_FACTORIES;
