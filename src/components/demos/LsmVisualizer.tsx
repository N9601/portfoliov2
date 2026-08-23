"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Miniature live LSM-tree visualizer — a web-scale echo of the one
 * built into SolderDB's Wails control center.
 *
 * Writes append to the WAL and land in the memtable. When the memtable
 * fills, it flushes to an L0 SSTable on "disk". When a level collects
 * three tables, they compact into one table on the next level down.
 * Real engine, toy scale.
 */

const MEMTABLE_CAP = 8;
const LEVEL_FAN = 3; // tables per level before compaction

type Table = { id: number; entries: number; fresh: boolean };

let nextId = 1;

function randomKey() {
  const chars = "abcdef0123456789";
  let k = "";
  for (let i = 0; i < 4; i++)
    k += chars[Math.floor(Math.random() * chars.length)];
  return k;
}

export function LsmVisualizer({ accent }: { accent: string }) {
  const [memtable, setMemtable] = useState<string[]>([]);
  const [levels, setLevels] = useState<Table[][]>([[], [], []]);
  const [wal, setWal] = useState<string[]>([]);
  const [stats, setStats] = useState({ writes: 0, flushes: 0, compactions: 0 });
  const [auto, setAuto] = useState(false);
  const autoRef = useRef<number | null>(null);

  const write = () => {
    const key = randomKey();
    setWal((w) => [`PUT ${key} → ok`, ...w].slice(0, 3));
    setStats((s) => ({ ...s, writes: s.writes + 1 }));
    setMemtable((m) => {
      const next = [...m, key];
      if (next.length < MEMTABLE_CAP) return next;

      // Memtable full → flush to L0, maybe cascade compactions
      setStats((s) => ({ ...s, flushes: s.flushes + 1 }));
      setLevels((ls) => {
        const out = ls.map((l) => l.map((t) => ({ ...t, fresh: false })));
        out[0] = [
          { id: nextId++, entries: MEMTABLE_CAP, fresh: true },
          ...out[0],
        ];
        // Cascade: level full → merge into single table one level down
        for (let lvl = 0; lvl < out.length - 1; lvl++) {
          if (out[lvl].length > LEVEL_FAN) {
            const merged = out[lvl].reduce((n, t) => n + t.entries, 0);
            out[lvl] = [];
            out[lvl + 1] = [
              { id: nextId++, entries: merged, fresh: true },
              ...out[lvl + 1],
            ];
            setStats((s) => ({ ...s, compactions: s.compactions + 1 }));
          }
        }
        // Bottom level just accumulates into one big table
        if (out[out.length - 1].length > LEVEL_FAN) {
          const merged = out[out.length - 1].reduce(
            (n, t) => n + t.entries,
            0
          );
          out[out.length - 1] = [{ id: nextId++, entries: merged, fresh: true }];
          setStats((s) => ({ ...s, compactions: s.compactions + 1 }));
        }
        return out;
      });
      return [];
    });
  };

  const reset = () => {
    setMemtable([]);
    setLevels([[], [], []]);
    setWal([]);
    setStats({ writes: 0, flushes: 0, compactions: 0 });
    setAuto(false);
  };

  // Auto-writer
  useEffect(() => {
    if (!auto) {
      if (autoRef.current) clearInterval(autoRef.current);
      autoRef.current = null;
      return;
    }
    autoRef.current = window.setInterval(write, 260);
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
      autoRef.current = null;
    };
  }, [auto]);

  const fill = memtable.length / MEMTABLE_CAP;

  return (
    <div className="border border-fg/15 bg-fg/[0.02]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-fg/10 px-4 py-2.5">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: accent }}>
          {"/// Live LSM engine"}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={write}
            data-cursor="hover"
            className="border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-fg transition hover:bg-fg/[0.06]"
            style={{ borderColor: accent }}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setAuto((v) => !v)}
            data-cursor="hover"
            className="border border-fg/20 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.25em] transition hover:bg-fg/[0.06]"
            style={auto ? { borderColor: accent, color: accent } : { color: "rgba(245,245,245,0.7)" }}
          >
            {auto ? "❚❚ Auto" : "▸ Auto"}
          </button>
          <button
            type="button"
            onClick={reset}
            data-cursor="hover"
            className="border border-fg/20 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-fg/70 transition hover:bg-fg/[0.06]"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* WAL */}
        <div>
          <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-fg/40">
            WAL · append-only
          </div>
          <div className="h-[3.4em] overflow-hidden border border-fg/10 px-3 py-1.5 font-mono text-[10px] leading-relaxed text-fg/55">
            {wal.length === 0 ? (
              <span className="text-fg/25">— idle · hit Write —</span>
            ) : (
              wal.map((l, i) => (
                <div key={l + i} style={{ opacity: 1 - i * 0.35 }}>
                  {l}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Memtable */}
        <div>
          <div className="mb-1.5 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.3em] text-fg/40">
            <span>Memtable · RAM</span>
            <span>
              {memtable.length} / {MEMTABLE_CAP}
            </span>
          </div>
          <div className="relative border border-fg/10 p-2">
            <div
              className="absolute inset-y-0 left-0 transition-all duration-200"
              style={{
                width: `${fill * 100}%`,
                background: `${accent}14`,
              }}
            />
            <div className="relative flex min-h-[26px] flex-wrap gap-1.5">
              {memtable.map((k, i) => (
                <span
                  key={k + i}
                  className="border px-1.5 py-0.5 font-mono text-[9px] tracking-[0.15em]"
                  style={{
                    borderColor: `${accent}60`,
                    color: accent,
                    animation: "lsmPop 200ms cubic-bezier(.2,.85,.2,1)",
                  }}
                >
                  {k}
                </span>
              ))}
              {memtable.length === 0 && (
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-fg/25">
                  empty — flushed to disk
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Disk levels */}
        <div>
          <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-fg/40">
            SSTables · disk
          </div>
          <div className="space-y-1.5">
            {levels.map((tables, lvl) => (
              <div key={lvl} className="flex items-center gap-2">
                <span className="w-6 shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] text-fg/35">
                  L{lvl}
                </span>
                <div className="flex min-h-[26px] flex-1 flex-wrap items-center gap-1.5 border border-fg/10 px-2 py-1">
                  {tables.length === 0 ? (
                    <span className="font-mono text-[9px] text-fg/20">∅</span>
                  ) : (
                    tables.map((t) => (
                      <span
                        key={t.id}
                        className="border px-2 py-0.5 font-mono text-[9px] tracking-[0.1em]"
                        style={{
                          borderColor: t.fresh ? accent : "rgba(245,245,245,0.2)",
                          color: t.fresh ? accent : "rgba(245,245,245,0.55)",
                          animation: t.fresh
                            ? "lsmPop 350ms cubic-bezier(.2,.85,.2,1)"
                            : undefined,
                        }}
                      >
                        ▦ {t.entries}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 border-t border-fg/10 pt-3 font-mono text-[9px] uppercase tracking-[0.25em] text-fg/45">
          <span>
            writes <span className="text-fg">{stats.writes}</span>
          </span>
          <span>
            flushes <span style={{ color: accent }}>{stats.flushes}</span>
          </span>
          <span>
            compactions <span className="text-orange">{stats.compactions}</span>
          </span>
        </div>
      </div>

      <style>{`
        @keyframes lsmPop {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
