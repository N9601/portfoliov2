/**
 * The single source of truth for the page's chapters. The scrub bar,
 * the board timeline, the nav, and the accent token all read this.
 * Order here is page order.
 */
export type ChapterId = "hero" | "toolbox" | "work" | "person" | "contact";

export type Chapter = {
  id: ChapterId;
  index: string; // "01"
  label: string;
  accent: string;
  /** Snippet shown in the scrub card while the chapter is on screen */
  code: string;
};

export const CHAPTERS: Chapter[] = [
  {
    id: "hero",
    index: "01",
    label: "Hero",
    accent: "#4d9cff",
    code: `const board = createBoard('#spine');
animate(board.parts, {
  ex: 0,
  delay: stagger(45),
  ease: 'out(3)',
});`,
  },
  {
    id: "toolbox",
    index: "02",
    label: "Toolbox",
    accent: "#00ffaa",
    code: `createTimeline({ autoplay: onScroll({ sync: true }) })
  .add(board.parts, { ex: 1 }, stagger(14, { from: 'center' }))
  .add(board, { rotY: -TAU }, '<');`,
  },
  {
    id: "work",
    index: "03",
    label: "Work",
    accent: "#a369ff",
    code: `// projects slot in as RAM sticks
animate(board.ram, {
  ex: [1, 0],
  delay: stagger(220),
  ease: 'out(4)',
});`,
  },
  {
    id: "person",
    index: "04",
    label: "Person",
    accent: "#ff7d36",
    code: `animate(board, {
  rotY: -TAU + 0.9,
  x: 1.8,
  ease: 'inOut(3)',
});`,
  },
  {
    id: "contact",
    index: "05",
    label: "Contact",
    accent: "#ff1133",
    code: `animate(board.leds, {
  intensity: 2.4,
  ease: 'outExpo',
});
await navigator.clipboard.writeText(EMAIL);`,
  },
];

export const chapterIndex = (id: ChapterId) =>
  CHAPTERS.findIndex((c) => c.id === id);
