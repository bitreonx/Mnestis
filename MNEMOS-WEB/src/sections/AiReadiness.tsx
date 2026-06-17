import { motion, useReducedMotion } from "framer-motion";
import {
  Database,
  Grid3x3,
  Share2,
  Sparkles,
  BrainCircuit,
  Gauge,
  Clock,
  Bot,
  TrendingUp,
} from "lucide-react";
import SectionHeading from "../components/ui/SectionHeading";
import Reveal from "../components/ui/Reveal";

/* ---------- isometric cube primitive ---------- */
function Cube({ s = 22, x = 0, y = 0, hue }: { s: number; x?: number; y?: number; hue: string }) {
  const h = s * 0.5; // half-width for iso
  const d = s * 0.58; // depth
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* top */}
      <polygon points={`0,${-d} ${h},${-d - h * 0.5} ${h * 2},${-d} ${h},${-d + h * 0.5}`} fill={hue} opacity="0.95" />
      {/* left */}
      <polygon points={`0,${-d} ${h},${-d + h * 0.5} ${h},${h * 0.5} 0,0`} fill={hue} opacity="0.55" />
      {/* right */}
      <polygon points={`${h},${-d + h * 0.5} ${h * 2},${-d} ${h * 2},${0} ${h},${h * 0.5}`} fill={hue} opacity="0.3" />
    </g>
  );
}

/* ---------- per-stage mini visuals ---------- */
function VisualRepo() {
  const rows = ["src", "components", "services", "index.ts", "app.ts", "README.md"];
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((r, i) => (
        <motion.div
          key={r}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.06 }}
          className="flex items-center gap-1.5 text-[10px] text-[var(--text-dim)]"
        >
          <span className="h-2 w-2 rounded-[3px]" style={{ background: i < 3 ? "var(--cyan)" : "var(--text-faint)" }} />
          <span className="font-mono">{r}</span>
        </motion.div>
      ))}
    </div>
  );
}

function VisualStructure() {
  const cubes = [
    [40, 70], [62, 58], [84, 70], [40, 92], [62, 80], [84, 92], [51, 105],
  ];
  return (
    <svg viewBox="0 0 130 120" className="h-full w-full">
      {cubes.map(([x, y], i) => (
        <motion.g
          key={i}
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.07, type: "spring", stiffness: 200, damping: 16 }}
        >
          <Cube s={20} x={x} y={y} hue={i % 3 === 0 ? "var(--brand)" : "var(--cyan)"} />
        </motion.g>
      ))}
    </svg>
  );
}

function VisualEnrich() {
  const nodes = [
    [30, 40], [70, 28], [100, 55], [55, 70], [85, 92], [35, 88],
  ];
  const edges: [number, number][] = [[0, 1], [1, 2], [0, 3], [3, 4], [3, 5], [2, 4]];
  return (
    <svg viewBox="0 0 130 120" className="h-full w-full">
      {edges.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]}
          stroke="var(--border-strong)" strokeWidth="1"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
          transition={{ delay: 0.1 + i * 0.05, duration: 0.5 }}
        />
      ))}
      {nodes.map(([x, y], i) => (
        <motion.circle
          key={i} cx={x} cy={y} r={i % 3 === 0 ? 6 : 4.5}
          fill={i % 2 ? "var(--cyan)" : "var(--brand)"}
          initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
          transition={{ delay: i * 0.06, type: "spring", stiffness: 260, damping: 14 }}
          style={{ transformOrigin: `${x}px ${y}px` }}
        />
      ))}
    </svg>
  );
}

function VisualOptimize() {
  return (
    <svg viewBox="0 0 130 120" className="h-full w-full">
      {[0, 1, 2].map((i) => (
        <motion.polygon
          key={i}
          points="65,30 110,55 65,80 20,55"
          transform={`translate(0 ${i * 16})`}
          fill={i === 0 ? "var(--brand)" : "var(--cyan)"}
          opacity={0.25 + i * 0.25}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 0.25 + i * 0.25, y: i * 16 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.12 }}
        />
      ))}
    </svg>
  );
}

function VisualModel() {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 130 130" className="h-full w-full">
      <defs>
        <radialGradient id="modelGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="65" cy="60" r="55" fill="url(#modelGlow)" />
      <motion.g animate={reduce ? {} : { y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        {[0, 1, 2].map((i) => (
          <Cube key={i} s={30} x={42} y={95 - i * 22} hue="var(--brand)" />
        ))}
      </motion.g>
    </svg>
  );
}

const STAGES = [
  { title: "Repository", Visual: VisualRepo },
  { title: "Structure", Visual: VisualStructure },
  { title: "Enrich", Visual: VisualEnrich },
  { title: "Optimize", Visual: VisualOptimize },
  { title: "Intelligence", Visual: VisualModel },
];

const STEPS = [
  { n: "1", icon: Database, title: "Ingest", desc: "We analyze your codebase and understand its structure." },
  { n: "2", icon: Grid3x3, title: "Structure", desc: "We organize and normalize code into cohesive layers." },
  { n: "3", icon: Share2, title: "Enrich", desc: "We add semantic context and relationships." },
  { n: "4", icon: Sparkles, title: "Optimize", desc: "We refine and compress for AI-agent consumption." },
  { n: "★", icon: BrainCircuit, title: "Intelligence Model", desc: "A structured, enriched model ready for AI agents." },
];

const BENEFITS = [
  { icon: Gauge, title: "Better Context", desc: "Understand code deeply" },
  { icon: Clock, title: "Faster Onboarding", desc: "Instant knowledge transfer" },
  { icon: Bot, title: "Smarter Agents", desc: "More accurate assistance" },
  { icon: TrendingUp, title: "Scalable Intelligence", desc: "Continuously improving" },
];

export default function AiReadiness() {
  return (
    <section className="container-px mx-auto max-w-[1200px] py-24 sm:py-32">
      <SectionHeading
        eyebrow="The Pipeline"
        title="AI Readiness"
        subtitle={
          <>
            Transforming your software repository into{" "}
            <span className="gradient-text font-medium">structured intelligence for AI agents.</span>
          </>
        }
      />

      {/* stage panels with flow line */}
      <Reveal delay={0.1}>
        <div className="relative mt-16">
          {/* animated flow line (desktop) */}
          <svg
            className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-24 w-full -translate-y-1/2 lg:block"
            viewBox="0 0 1000 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path d="M40 50 H960" stroke="var(--border)" strokeWidth="2" fill="none" />
            <path
              d="M40 50 H960"
              stroke="var(--brand)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="6 14"
              style={{ animation: "flow-dash 18s linear infinite" }}
              opacity="0.7"
            />
          </svg>

          <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STAGES.map((s, i) => {
              const last = i === STAGES.length - 1;
              const Visual = s.Visual;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 0.8, 0.18, 1] }}
                  className="group relative"
                >
                  <div
                    className="glass relative flex h-44 flex-col rounded-2xl p-4"
                    style={last ? { boxShadow: "var(--shadow-glow)", borderColor: "color-mix(in srgb, var(--brand) 40%, transparent)" } : undefined}
                  >
                    <span className="mb-1 text-[11px] font-medium uppercase tracking-wider text-[var(--text-faint)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-semibold text-[var(--text)]">{s.title}</span>
                    <div className="relative mt-2 flex-1">
                      <Visual />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* steps */}
      <div className="mt-14 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={i * 0.06}>
            <div className="flex gap-3">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--brand)]"
              >
                <step.icon size={17} />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">
                  <span className="mr-1 text-[var(--text-faint)]">{step.n}.</span>
                  {step.title}
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-dim)]">{step.desc}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* benefits bar */}
      <Reveal delay={0.1}>
        <div className="mt-12 grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-[var(--surface-2)]">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--cyan)]" style={{ background: "color-mix(in srgb, var(--cyan) 12%, transparent)" }}>
                <b.icon size={17} />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">{b.title}</p>
                <p className="text-xs text-[var(--text-dim)]">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
