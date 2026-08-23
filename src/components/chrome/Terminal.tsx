"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CHAPTERS } from "@/lib/chapters";

/**
 * The third and last piece of chrome: a hidden shell. Press ` anywhere
 * and a drawer drops from the top. Navigation, CV, contact, and a
 * couple of toys all work.
 */

type Line = { kind: "in" | "out" | "accent"; text: string };

const BANNER: Line[] = [
  { kind: "accent", text: "NANDAKISHORE-OS v2 — guest shell" },
  { kind: "out", text: "type 'help' for commands · 'exit' to close" },
];

const HELP = [
  "help             this list",
  "whoami           who runs this machine",
  "ls               list the chapters",
  "ls projects      list shipped + in-flight work",
  "open <chapter>   jump to a chapter (hero, toolbox, work, person, contact)",
  "cv               open the CV",
  "playground       open the easing editor",
  "contact          email / github / linkedin",
  "neofetch         system card",
  "time             current time in Hyderabad",
  "explode          break the board apart",
  "assemble         put it back",
  "clear            wipe the buffer",
  "exit             close terminal",
];

function run(raw: string, go: (path: string) => void): { out: Line[]; close?: boolean } {
  const cmd = raw.trim().toLowerCase();
  const o = (text: string): Line => ({ kind: "out", text });
  const a = (text: string): Line => ({ kind: "accent", text });
  if (!cmd) return { out: [] };
  if (cmd === "help") return { out: HELP.map(o) };
  if (cmd === "whoami")
    return { out: [a("nandakishore reddy"), o("full-stack developer · hyderabad, in"), o("dev / devops / cloud-sec")] };
  if (cmd === "ls") return { out: CHAPTERS.map((c) => o(`${c.index}  ${c.id}/`)) };
  if (cmd === "ls projects" || cmd === "projects")
    return {
      out: [
        o("drwx  solderdb/     go · lsm engine · wails"),
        o("drwx  pyroos/       asm · c · bare metal"),
        o("drwx  algowizard/   react · next · supabase"),
        o("drwx  coefficient/  next · ssr · logic sim"),
        o("drwx  portfolio/    the thing you are inside"),
      ],
    };
  if (cmd.startsWith("open ") || cmd.startsWith("cd ")) {
    const target = cmd.split(/\s+/)[1] || "";
    const match = CHAPTERS.find((c) => c.id.startsWith(target));
    if (match) {
      document.getElementById(match.id)?.scrollIntoView({ behavior: "smooth" });
      return { out: [o(`navigating → #${match.id}`)], close: true };
    }
    return { out: [o(`no such chapter: ${target}`), o(`chapters: ${CHAPTERS.map((c) => c.id).join(", ")}`)] };
  }
  if (cmd === "cv" || cmd === "resume") {
    go("/cv");
    return { out: [o("opening /cv …")], close: true };
  }
  if (cmd === "playground" || cmd === "easings") {
    go("/playground");
    return { out: [o("opening /playground …")], close: true };
  }
  if (cmd === "contact" || cmd === "socials")
    return {
      out: [
        o("email     nandakishorereddyg@outlook.com"),
        o("github    github.com/N9601"),
        o("linkedin  in/gnandhakishorereddy"),
        o("dev.to    @n9601"),
      ],
    };
  if (cmd === "neofetch")
    return {
      out: [
        a("      ▄▄▄        guest@nandakishore-os"),
        a("    ▄█████▄      ---------------------"),
        o("   ███████████   OS:      NANDAKISHORE-OS v2"),
        o("   ███▀ ▀▀███    Host:    one board, one timeline"),
        o("   ███▄ ▄▄███    Kernel:  next 16 / anime 4 / three"),
        o("    ▀█████▀      Uptime:  est. 2023"),
        o("      ▀▀▀        Edu:     B.Tech CSE · VNR VJIET"),
      ],
    };
  if (cmd === "time" || cmd === "date") {
    const t = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date());
    return { out: [o(`${t} IST · hyderabad`)] };
  }
  if (cmd === "explode" || cmd === "assemble") {
    window.dispatchEvent(new CustomEvent("board:command", { detail: cmd }));
    return { out: [a(`${cmd === "explode" ? "breaking the board apart" : "reassembling"} …`)], close: true };
  }
  if (cmd.startsWith("sudo")) return { out: [o("guest is not in the sudoers file. this incident will be reported.")] };
  if (cmd.startsWith("rm ")) return { out: [o("nice try. filesystem is read-only.")] };
  if (cmd === "exit" || cmd === "quit" || cmd === "q") return { out: [], close: true };
  return { out: [o(`command not found: ${cmd} — try 'help'`)] };
}

export function Terminal() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>(BANNER);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || (el as HTMLElement).isContentEditable);
      if ((e.key === "`" || e.key === "~") && !typing) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onEvent = () => setOpen((v) => !v);
    window.addEventListener("keydown", onKey);
    window.addEventListener("terminal:toggle", onEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("terminal:toggle", onEvent);
    };
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, open]);

  const submit = () => {
    const cmd = value;
    setValue("");
    if (cmd.trim().toLowerCase() === "clear") {
      setLines(BANNER);
      return;
    }
    const res = run(cmd, (p) => router.push(p));
    setLines((l) => [...l, { kind: "in", text: cmd }, ...res.out]);
    if (res.close) setTimeout(() => setOpen(false), 350);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[9990] flex justify-center px-0 sm:px-6">
      <div
        className="w-full max-w-3xl border-x-0 border-b border-[var(--line)] bg-bg sm:border-x"
        style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.7)", animation: "termDrop 320ms var(--ease-out)" }}
      >
        <div className="eyebrow-sm flex items-center justify-between border-b border-[var(--line)] px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="block h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
            <span style={{ color: "var(--accent)" }}>guest@nandakishore-os</span>
            <span className="text-fg-4">~ read-only</span>
          </div>
          <button type="button" onClick={() => setOpen(false)} data-cursor data-cursor-label="CLOSE" className="text-fg-3 transition hover:text-fg" aria-label="Close terminal">
            ✕ ESC
          </button>
        </div>
        <div ref={scrollRef} className="max-h-[50vh] overflow-y-auto px-4 py-3 font-mono text-[11px] leading-relaxed" onClick={() => inputRef.current?.focus()}>
          {lines.map((l, i) => (
            <div key={i} className={l.kind === "in" ? "text-fg" : l.kind === "accent" ? "text-[var(--accent)]" : "text-fg-2"} style={{ whiteSpace: "pre-wrap" }}>
              {l.kind === "in" ? (
                <>
                  <span style={{ color: "var(--accent)" }}>❯ </span>
                  {l.text}
                </>
              ) : (
                l.text
              )}
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px]" style={{ color: "var(--accent)" }}>
              ❯
            </span>
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              className="w-full bg-transparent font-mono text-[11px] text-fg outline-none placeholder:text-fg-4"
              style={{ cursor: "text" }}
              placeholder="type a command…"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Terminal command input"
            />
          </div>
        </div>
      </div>
      <style>{`@keyframes termDrop { from { transform: translateY(-100%); opacity: .4 } to { transform: translateY(0); opacity: 1 } }`}</style>
    </div>
  );
}
