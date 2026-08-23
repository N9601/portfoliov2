# Portfolio v2 — design plan

One object, one timeline, one idea per screen. The motherboard is the
narrative spine: it stays fixed on screen for the whole page and scroll
scrubs a single anime.js timeline that assembles it, breaks it apart,
turns each part into a chapter, and reassembles it at the end.

## Stack

- Next.js 16 (app router), React 19, Tailwind 4, TypeScript
- anime.js v4 as the only animation engine: `onScroll` for scrubbing,
  `createScope` for breakpoints + reduced motion, Three adapter for the
  3D parts. No GSAP, no Lenis, no bespoke rAF loops outside the renderer.
- Three.js for the board. One WebGL context, lazy-loaded, paused offscreen.

## Page map (single page, 5 chapters + 2 routes)

| # | Chapter  | Board state                                | Content                                                                 |
|---|----------|--------------------------------------------|-------------------------------------------------------------------------|
| 0 | Boot     | Dark, parts fly in (intro timeline)        | Loader is the board powering on. No separate curtain.                   |
| 1 | Hero     | Assembled, idle sway                       | Split-char headline, cycling "builds ___." line, copy-email pill.       |
| 2 | Toolbox  | Exploded, parts orbit the demo stage       | Pinned gallery, 5 beats: Frontend, Backend, 3D, Automation, Infra. Each beat's demo is a *board part* pulled to centre (CPU, RAM, GPU, traces, ports) plus anime.js demo overlays. |
| 3 | Work     | RAM slots empty; projects slide in as sticks | 3 projects max. Each has a live embed (LSM visualizer, shader, n8n replay). |
| 4 | Person   | Board tilts to profile view                | About + experience on one screen, one timeline of dates.               |
| 5 | Contact  | Reassembles, LEDs power on                 | Links grid (9 doors), email pill, location/time.                       |

Routes: `/` (above), `/cv` (printable resume, drives the PDF build),
`/playground` (easing editor + demo lab, the fun stuff that doesn't
belong in the pitch).

## Chrome (max three fixed elements)

1. Cursor (desktop only)
2. Scrub bar: bottom-centre, draggable cursor, one tick per chapter,
   code card per chapter. Replaces every progress bar and dot nav.
3. Terminal easter egg (keyboard `~`)

Cut: grain, scanlines, vignette, pulse dots, sound toggle, "Currently"
card, konami, floating card, manifesto, marquee.

## Design tokens

- Background `#080808`, foreground `#f5f5f5`, one neutral ramp.
- One accent per chapter (`--accent-current`), set on `<html>` by the
  scrub timeline; every component reads it. Palette: blue `#4d9cff`,
  mint `#00ffaa`, lavender `#a369ff`, coral `#ff7d36`, cyan `#26f2d5`,
  red `#ff1133` (contact / "record" state).
- Type: Space Grotesk (display), JetBrains Mono (UI/code). Two sizes of
  eyebrow, one display scale driven by `clamp()`.

## Mobile first

- Board scales to a phone and sits behind stacked chapters.
- Scrub bar becomes a bottom sheet handle.
- Toolbox gallery is a horizontal snap carousel instead of pinned scroll.
- Hover-only effects have touch equivalents or are removed.

## Motion rules

- Everything scroll-linked is *scrubbed* (sync), never triggered, so
  scrolling back always reverses.
- Reduced motion: board rendered once in the exploded state, chapters
  fade in, no scrubbing. Still looks designed, not "disabled".
- Budget: 16 ms/frame on a 2020 laptop, one canvas, no full-screen
  blend-mode layers.

## Build order (status)

1. [x] Shell: layout, tokens, fonts, scrub bar, reduced-motion scope.
2. [x] Board: port Motherboard scene, expose parts registry, boot timeline.
3. [x] Master scroll timeline across all chapters (explode, spin, focus,
       reassemble, RAM slotting, tilt, power-up), verified by scrubbing.
4. [x] Toolbox chapter with per-beat board-part focus + anime.js demos.
5. [x] Work chapter with three live embeds (LSM, boot log, sort).
6. [x] Person chapter.
7. [x] `/cv`, `/playground`, metadata, README. OG image reused from v1.

8. [x] Mobile Toolbox as a horizontal snap carousel; board scaled and
       re-centred on phones.
9. [x] Terminal easter egg (` key): navigation, cv, playground, contact,
       `explode` / `assemble` drive the board.
10. [x] Fresh OG image (`public/og.svg` → `npm run build:og`).

## Next

- Look at it in a real browser and tune by eye: explode distances,
  focus point vs stage ring, Toolbox beat copy length on laptops.
- Lighthouse pass on a mid-range phone; drop pixel ratio further if the
  board dips under 60fps.
