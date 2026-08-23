/** Rasterize public/og.svg -> public/og.png (1200x630). `node scripts/build_og.mjs` */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const src = fileURLToPath(new URL("../public/og.svg", import.meta.url));
const out = fileURLToPath(new URL("../public/og.png", import.meta.url));
const png = await sharp(readFileSync(src), { density: 150 }).resize(1200, 630).png().toFile(out);
console.log(`Wrote ${out} (${Math.round(png.size / 1024)} KB)`);
