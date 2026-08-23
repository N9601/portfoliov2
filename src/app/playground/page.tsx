import type { Metadata } from "next";
import Link from "next/link";
import { EasingPlayground } from "@/components/demos/EasingPlayground";

export const metadata: Metadata = {
  title: "Playground",
  description: "Easing editor and motion experiments, powered by anime.js.",
};

export default function PlaygroundPage() {
  return (
    <main className="relative z-10 min-h-screen">
      <header className="flex items-center justify-between px-5 pt-6 md:px-10 md:pt-8">
        <Link href="/" data-cursor className="eyebrow text-fg">
          <span style={{ color: "var(--accent)" }}>█</span> Nandakishore Reddy
          <span className="ml-3 text-fg-4">/ Playground</span>
        </Link>
        <Link href="/#contact" data-cursor className="eyebrow text-fg-2 transition hover:text-fg">
          Back to site →
        </Link>
      </header>
      <EasingPlayground />
    </main>
  );
}
