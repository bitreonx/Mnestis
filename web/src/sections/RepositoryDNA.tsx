import { motion, useReducedMotion } from "framer-motion";
import { DNA_STRANDS } from "../lib/site";
import SectionHeading from "../components/ui/SectionHeading";
import Reveal from "../components/ui/Reveal";

const RUNGS = 22;

function Helix() {
  const reduce = useReducedMotion();
  const colors = ["var(--brand)", "var(--cyan)"];
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-[360px]">
      <div
        className="absolute inset-0 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--glow), transparent 70%)" }}
        aria-hidden
      />
      <svg viewBox="0 0 200 440" className="relative h-full w-full" aria-hidden>
        {Array.from({ length: RUNGS }).map((_, i) => {
          const t = i / (RUNGS - 1);
          const y = 16 + t * 408;
          return (
            <motion.g
              key={i}
              initial={reduce ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.5 }}
            >
              <motion.g
                animate={reduce ? {} : { rotateY: 360 }}
                style={{ transformOrigin: `100px ${y}px`, transformBox: "fill-box" }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear", delay: -i * 0.27 }}
              >
                {(() => {
                  const phase = t * Math.PI * 4;
                  const x1 = 100 + Math.sin(phase) * 70;
                  const x2 = 100 - Math.sin(phase) * 70;
                  const depth = (Math.cos(phase) + 1) / 2; // 0..1
                  return (
                    <>
                      <line
                        x1={x1}
                        y1={y}
                        x2={x2}
                        y2={y}
                        stroke="var(--border-strong)"
                        strokeWidth={1.5}
                        opacity={0.35 + depth * 0.4}
                      />
                      <circle cx={x1} cy={y} r={4.5 + depth * 2} fill={colors[0]} opacity={0.55 + depth * 0.45} />
                      <circle cx={x2} cy={y} r={4.5 + (1 - depth) * 2} fill={colors[1]} opacity={0.55 + (1 - depth) * 0.45} />
                    </>
                  );
                })()}
              </motion.g>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}

export default function RepositoryDNA() {
  return (
    <section className="relative overflow-hidden border-y border-[var(--border)] bg-[var(--bg-1)]">
      <div className="container-px mx-auto grid max-w-[1200px] items-center gap-12 py-24 sm:py-32 lg:grid-cols-2">
        <div>
          <SectionHeading
            center={false}
            eyebrow="Repository DNA"
            title={
              <>
                A queryable fingerprint of
                <br className="hidden sm:block" /> your entire codebase.
              </>
            }
            subtitle="MNESTIS distills millions of lines into a few kilobytes of structured DNA. It's the first thing any agent should read — compressed, stable, and @-mention ready."
          />

          <div className="mt-9 space-y-3">
            {DNA_STRANDS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.07}>
                <div className="group flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 transition-colors hover:border-[var(--border-strong)]">
                  <span
                    className="h-9 w-1 rounded-full transition-all group-hover:h-10"
                    style={{ background: s.color }}
                  />
                  <div>
                    <p className="font-semibold tracking-tight text-[var(--text)]">{s.label}</p>
                    <p className="text-sm text-[var(--text-dim)]">{s.value}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.1}>
          <Helix />
        </Reveal>
      </div>
    </section>
  );
}
