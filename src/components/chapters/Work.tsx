"use client";

import type { ReactNode } from "react";
import { SplitIn } from "@/components/text/SplitIn";
import { LsmVisualizer } from "@/components/demos/LsmVisualizer";
import { BootLog } from "@/components/demos/BootLog";
import { SortViz } from "@/components/demos/SortViz";

type Project = {
  num: string;
  title: string;
  role: string;
  year: string;
  tags: string[];
  intro: string;
  points: string[];
  metrics: { value: string; label: string }[];
  link: { label: string; href: string };
  embed: (accent: string) => ReactNode;
  embedLabel: string;
};

const ACCENT = "#a369ff";

const PROJECTS: Project[] = [
  {
    num: "01",
    title: "SolderDB",
    role: "Local-first database · Go",
    year: "2026",
    tags: ["Go", "LSM tree", "Wails", "React", "SSE"],
    intro:
      "A local-first database with PocketBase / Supabase parity, built on a from-scratch Go LSM storage engine and shipped as a single desktop executable.",
    points: [
      "WAL, memtable, SSTables, leveled compaction, bloom filters, CRC32C torn-write detection.",
      "Power-aware compaction pauses background work when the device is throttled.",
      "Realtime over Server-Sent Events; JS and Go SDKs; a CLI for headless ops.",
    ],
    metrics: [
      { value: "1", label: "binary" },
      { value: "0", label: "deps" },
      { value: "LSM", label: "engine" },
    ],
    link: { label: "GitHub", href: "https://github.com/N9601" },
    embed: (a) => <LsmVisualizer accent={a} />,
    embedLabel: "live · memtable → L0 → compaction",
  },
  {
    num: "02",
    title: "PyroOS",
    role: "Hobby kernel · x86 · in progress",
    year: "2026",
    tags: ["Assembly", "C", "x86", "QEMU"],
    intro: "An operating system from the bootloader up. Every interrupt vector, every memory page, every scheduled task, by hand.",
    points: [
      "boot.asm moves the CPU from Real to Protected Mode and installs the GDT and IDT.",
      "Raw VGA text driver, PIC remap, PIT timer, a C kernel growing on top.",
      "NASM + gcc + QEMU. Small enough to understand end to end.",
    ],
    metrics: [
      { value: "x86", label: "bare metal" },
      { value: "256", label: "vectors" },
      { value: "WIP", label: "status" },
    ],
    link: { label: "GitHub", href: "https://github.com/N9601" },
    embed: (a) => <BootLog accent={a} />,
    embedLabel: "boot log · replays on view",
  },
  {
    num: "03",
    title: "AlgoWizard",
    role: "Educational platform · Next.js + Supabase",
    year: "2025 – 26",
    tags: ["React", "Next.js", "TypeScript", "Supabase"],
    intro: "Data structures and algorithms as scrubbable, real-time visualizations. Learn by manipulation, not by reading pseudocode.",
    points: [
      "Every step animated in the browser; users scrub execution and watch state change.",
      "Supabase auth and row-level security; per-user progress across modules.",
      "Render path tuned so heavy simulations stay smooth at high step counts.",
    ],
    metrics: [
      { value: "60", label: "fps target" },
      { value: "RLS", label: "auth" },
      { value: "∞", label: "scrub" },
    ],
    link: { label: "GitHub", href: "https://github.com/N9601" },
    embed: (a) => <SortViz accent={a} />,
    embedLabel: "bubble sort · anime.js timeline",
  },
];

/**
 * Chapter 03. Three projects, each a full viewport. The board sits on
 * the right and slots a RAM stick in as each project arrives. Copy and
 * the live embed occupy the left column.
 */
export function Work() {
  return (
    <section id="work" className="relative">
      <div className="gutter eyebrow sticky top-0 z-20 flex h-0 items-center gap-3 overflow-visible pt-20 md:pt-24">
        <span className="block h-px w-8" style={{ background: "var(--accent)" }} />
        <span>{"03 / Work"}</span>
      </div>
      {PROJECTS.map((p) => (
        <article key={p.num} className="gutter relative flex min-h-[100vh] items-center py-28">
          <div className="col">
            <div className="eyebrow mb-3 flex items-center gap-3">
              <span style={{ color: "var(--accent)" }}>{p.num}</span>
              <span>{p.role}</span>
              <span className="text-fg-4">· {p.year}</span>
            </div>
            <SplitIn as="h2" split="chars" onView className="display display-l text-fg">
              {p.title}
            </SplitIn>
            <SplitIn as="p" onView delay={200} className="mt-4 max-w-lg font-display text-base leading-relaxed text-fg-2">
              {p.intro}
            </SplitIn>

            <div className="mt-6 h-56 overflow-hidden border border-[var(--line)] bg-bg/90">
              <div className="eyebrow-sm flex items-center justify-between border-b border-[var(--line)] px-3 py-1.5">
                <span>{p.embedLabel}</span>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
              </div>
              <div className="h-[calc(100%-1.75rem)]">{p.embed(ACCENT)}</div>
            </div>

            <ul className="mt-5 space-y-1.5">
              {p.points.map((pt) => (
                <li key={pt} className="flex gap-3 font-display text-sm leading-relaxed text-fg-2">
                  <span className="mt-[0.6em] block h-1 w-1 shrink-0 rounded-full" style={{ background: "var(--accent)" }} />
                  {pt}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
              <div className="flex gap-6">
                {p.metrics.map((m) => (
                  <div key={m.label}>
                    <div className="font-display text-2xl font-light text-fg">{m.value}</div>
                    <div className="eyebrow-sm">{m.label}</div>
                  </div>
                ))}
              </div>
              <a
                href={p.link.href}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor
                data-cursor-label="OPEN"
                className="font-mono text-[11px] uppercase tracking-[0.25em] text-fg-2 transition hover:text-[var(--accent)]"
              >
                {p.link.label} ↗
              </a>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {p.tags.map((t) => (
                <span key={t} className="eyebrow-sm border border-[var(--line)] px-2 py-1">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
