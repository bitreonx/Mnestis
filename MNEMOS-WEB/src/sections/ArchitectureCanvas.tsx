import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, Move } from "lucide-react";
import SectionHeading from "../components/ui/SectionHeading";

type Node = { id: string; x: number; y: number; r: number; color: string };
type Level = { id: string; label: string; nodes: Node[]; edges: [string, string][] };

const C = ["var(--brand)", "var(--cyan)", "var(--lilac)", "var(--mint)"];

const LEVELS: Level[] = [
  {
    id: "capabilities",
    label: "Capabilities",
    nodes: [
      { id: "Commerce", x: 30, y: 35, r: 34, color: C[0] },
      { id: "Identity", x: 70, y: 30, r: 28, color: C[1] },
      { id: "Insights", x: 55, y: 70, r: 26, color: C[2] },
    ],
    edges: [["Commerce", "Identity"], ["Commerce", "Insights"], ["Identity", "Insights"]],
  },
  {
    id: "domains",
    label: "Domains",
    nodes: [
      { id: "auth", x: 22, y: 28, r: 22, color: C[1] },
      { id: "billing", x: 48, y: 22, r: 24, color: C[0] },
      { id: "catalog", x: 72, y: 34, r: 22, color: C[0] },
      { id: "orders", x: 38, y: 60, r: 24, color: C[2] },
      { id: "search", x: 66, y: 68, r: 20, color: C[3] },
      { id: "users", x: 18, y: 72, r: 18, color: C[1] },
    ],
    edges: [
      ["auth", "billing"], ["billing", "orders"], ["catalog", "orders"],
      ["catalog", "search"], ["auth", "users"], ["orders", "search"],
    ],
  },
  {
    id: "services",
    label: "Services",
    nodes: [
      { id: "api", x: 26, y: 26, r: 18, color: C[0] },
      { id: "worker", x: 52, y: 20, r: 16, color: C[2] },
      { id: "gateway", x: 76, y: 30, r: 18, color: C[1] },
      { id: "db", x: 40, y: 54, r: 16, color: C[3] },
      { id: "cache", x: 66, y: 58, r: 14, color: C[1] },
      { id: "queue", x: 24, y: 64, r: 15, color: C[2] },
      { id: "cdn", x: 82, y: 66, r: 13, color: C[0] },
    ],
    edges: [
      ["gateway", "api"], ["api", "db"], ["api", "cache"],
      ["worker", "queue"], ["worker", "db"], ["gateway", "cdn"], ["api", "worker"],
    ],
  },
  {
    id: "files",
    label: "Files",
    nodes: Array.from({ length: 14 }).map((_, i) => ({
      id: `f${i}`,
      x: 12 + ((i * 37) % 76),
      y: 16 + ((i * 53) % 68),
      r: 7 + (i % 4) * 2,
      color: C[i % 4],
    })),
    edges: Array.from({ length: 12 }).map((_, i) => [`f${i}`, `f${(i + 3) % 14}`] as [string, string]),
  },
];

export default function ArchitectureCanvas() {
  const [level, setLevel] = useState(1);
  const current = LEVELS[level];
  const find = (id: string) => current.nodes.find((n) => n.id === id);

  return (
    <section className="relative overflow-hidden border-y border-[var(--border)] bg-[var(--bg-1)]">
      <div className="container-px mx-auto max-w-[1200px] py-24 sm:py-32">
        <SectionHeading
          eyebrow="Architecture Canvas"
          title="Zoom from product to a single file."
          subtitle="One continuous map — capabilities, domains, services, files. Pan and zoom like a designer, not an academic."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* zoom rail */}
          <div className="flex flex-col gap-2">
            {LEVELS.map((l, i) => (
              <button
                key={l.id}
                onClick={() => setLevel(i)}
                className="focus-ring group flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-all"
                style={{
                  borderColor: i === level ? "var(--brand)" : "var(--border)",
                  background: i === level ? "color-mix(in srgb, var(--brand) 10%, transparent)" : "var(--surface)",
                }}
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">{l.label}</p>
                  <p className="text-xs text-[var(--text-dim)]">{l.nodes.length} nodes</p>
                </div>
                <ZoomIn
                  size={16}
                  className="text-[var(--text-faint)] transition-colors"
                  style={{ color: i === level ? "var(--brand)" : undefined }}
                />
              </button>
            ))}
            <p className="mt-2 flex items-center gap-1.5 px-1 text-xs text-[var(--text-faint)]">
              <Move size={12} /> Drag the canvas to pan
            </p>
          </div>

          {/* canvas */}
          <div className="card relative aspect-[16/11] overflow-hidden p-0">
            <div className="absolute inset-0 bg-dots opacity-50" aria-hidden />
            <motion.svg
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
              className="relative h-full w-full cursor-grab active:cursor-grabbing"
              drag
              dragConstraints={{ left: -40, right: 40, top: -40, bottom: 40 }}
              dragElastic={0.12}
            >
              <AnimatePresence mode="wait">
                <motion.g
                  key={current.id}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.5, ease: [0.22, 0.8, 0.18, 1] }}
                  style={{ transformOrigin: "50px 50px" }}
                >
                  {current.edges.map(([a, b], i) => {
                    const na = find(a);
                    const nb = find(b);
                    if (!na || !nb) return null;
                    return (
                      <motion.line
                        key={`${a}-${b}`}
                        x1={na.x}
                        y1={na.y}
                        x2={nb.x}
                        y2={nb.y}
                        stroke="var(--border-strong)"
                        strokeWidth={0.4}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.7 }}
                        transition={{ delay: 0.1 + i * 0.03, duration: 0.5 }}
                      />
                    );
                  })}
                  {current.nodes.map((n, i) => (
                    <motion.g
                      key={n.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.04, type: "spring", stiffness: 260, damping: 18 }}
                      style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                    >
                      <circle cx={n.x} cy={n.y} r={n.r / 4 + 3.5} fill={n.color} opacity={0.18} />
                      <circle cx={n.x} cy={n.y} r={n.r / 4} fill={n.color} />
                      {current.id !== "files" && (
                        <text
                          x={n.x}
                          y={n.y + n.r / 4 + 4}
                          textAnchor="middle"
                          fontSize="2.6"
                          fill="var(--text-dim)"
                          fontFamily="var(--font-mono)"
                        >
                          {n.id}
                        </text>
                      )}
                    </motion.g>
                  ))}
                </motion.g>
              </AnimatePresence>
            </motion.svg>

            <div className="pointer-events-none absolute bottom-3 right-3 rounded-md border border-[var(--border)] bg-[var(--surface-solid)] px-2.5 py-1 font-mono text-[11px] text-[var(--text-dim)]">
              zoom · {current.label.toLowerCase()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
