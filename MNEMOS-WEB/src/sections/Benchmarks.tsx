import { BENCHMARKS } from "../lib/site";
import SectionHeading from "../components/ui/SectionHeading";
import AnimatedCounter from "../components/ui/AnimatedCounter";
import Reveal from "../components/ui/Reveal";
import CopyCommand from "../components/ui/CopyCommand";

export default function Benchmarks() {
  return (
    <section id="benchmarks" className="container-px mx-auto max-w-[1200px] scroll-mt-24 py-24 sm:py-32">
      <SectionHeading
        eyebrow="Benchmarks"
        title="Numbers from real repositories."
        subtitle="Reproducible locally from mnemos-bench. Less context, more signal — every build, every repo."
      />

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BENCHMARKS.map((b, i) => (
          <Reveal key={b.label} delay={i * 0.06}>
            <div className="card group relative overflow-hidden p-7">
              <div
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: "var(--glow)" }}
                aria-hidden
              />
              <div className="flex items-baseline gap-1">
                <span className="gradient-text text-4xl font-semibold tracking-tight sm:text-5xl">
                  <AnimatedCounter value={b.value} suffix={b.suffix} />
                </span>
              </div>
              <p className="mt-3 font-medium text-[var(--text)]">{b.label}</p>
              <p className="text-sm text-[var(--text-dim)]">{b.hint}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <CopyCommand command="npm run bench:regression" />
          <CopyCommand command="npm run bench:ai-eval" />
        </div>
      </Reveal>
    </section>
  );
}
