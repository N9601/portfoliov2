# Portfolio v2

One object, one timeline. A fixed WebGL motherboard is the spine of the
page; scroll scrubs a single anime.js timeline that boots it, breaks it
apart, pulls parts into the Toolbox stage, slots RAM sticks in as
projects arrive, tilts it for the bio, and powers it up for contact.

See [PLAN.md](PLAN.md) for the design rationale and page map.

## Stack

Next.js 16 · React 19 · Tailwind 4 · anime.js 4 · Three.js

## Run

```bash
npm install
npm run dev
```

`npm run build` for production, `npm run lint` for ESLint,
`npm run build:og` to re-rasterize the social image from `public/og.svg`.

Press ` anywhere on the site for the terminal (`help` lists commands;
`explode` and `assemble` drive the board).

## Layout

```
src/
  app/            routes: / (the page), /cv (printable), /playground (easing editor)
  lib/
    chapters.ts   chapter registry: order, labels, accents, scrub-card snippets
    scrub.ts      scroll store + chapter measurement (no React state)
    boardReady.ts hook that resolves when the board has booted
  components/
    board/        scene.ts (Three scene + parts registry), Board.tsx (boot + scroll timeline)
    chrome/       Cursor, ScrubController (the one scroll observer), ScrubBar, Terminal
    chapters/     Hero, Toolbox, Work, Person, Contact
    demos/        anime.js demos for the Toolbox stage and the Work embeds
    text/         SplitIn (split-text reveal), Cycler (rotating word)
```

## How the choreography works

`Board.tsx` measures every chapter section in document pixels and adds
tweens to one timeline at those positions (`[from, to]` values, so
scrubbing backwards is deterministic). The timeline autoplays from
`onScroll({ sync: true })`, so its time is the page's scroll position.
The scene's render loop just reads `board.state` and each part's
`ex` / `focus` every frame.

The boot fly-in animates separate fields (`bootEx`, `bootPower`) so it
never shares a property with the scroll timeline.

## Accessibility

`prefers-reduced-motion` renders a single frame of the exploded board,
skips scrubbing and text reveals, and keeps every chapter readable.
