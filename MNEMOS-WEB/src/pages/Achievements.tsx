import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Trophy,
  Zap,
  Package,
  GitBranch,
  Sparkles,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import SeoHead from "../components/SeoHead";
import SectionHeading from "../components/ui/SectionHeading";
import Reveal from "../components/ui/Reveal";
import CopyCommand from "../components/ui/CopyCommand";
import AnimatedCounter from "../components/ui/AnimatedCounter";
import { PAGES, SEO } from "../lib/seo";
import { BENCHMARKS } from "../lib/site";

type AchievementType = "feat" | "fix" | "seo" | "perf" | "growth";

interface Achievement {
  date: string;
  title: string;
  type: AchievementType;
  detail: string;
  metric?: string;
}

const TYPE_STYLE: Record<
  AchievementType,
  { color: string; icon: typeof Zap }
> = {
  feat: { color: "var(--cyan)", icon: Zap },
  fix: { color: "#f59e0b", icon: Package },
  seo: { color: "var(--brand)", icon: TrendingUp },
  perf: { color: "var(--mint)", icon: GitBranch },
  growth: { color: "#ec4899", icon: Sparkles },
};

function groupByDay(entries: Achievement[]): Map<string, Achievement[]> {
  const map = new Map<string, Achievement[]>();
  for (const e of entries) {
    const list = map.get(e.date) ?? [];
    list.push(e);
    map.set(e.date, list);
  }
  return map;
}

export default function Achievements() {
  const [entries, setEntries] = useState<Achievement[]>([]);
  const [stars, setStars] = useState<number | null>(null);
  const [version, setVersion] = useState("0.3.3");

  useEffect(() => {
    fetch("/data/achievements.json")
      .then((r) => r.json())
      .then(setEntries)
      .catch(() => setEntries([]));

    fetch("https://registry.npmjs.org/mnestis/latest")
      .then((r) => r.json())
      .then((pkg) => setVersion(pkg.version ?? "0.3.3"))
      .catch(() => {});

    fetch("https://api.github.com/repos/bitreonx/Mnestis")
      .then((r) => r.json())
      .then((repo) => setStars(repo.stargazers_count ?? null))
      .catch(() => {});
  }, []);

  const grouped = groupByDay(entries);
  const days = [...grouped.keys()].sort((a, b) => b.localeCompare(a));
  const compression = BENCHMARKS.find((b) => b.label === "Compression");

  return (
    <>
      <SeoHead page={PAGES.achievements} />

      {/* Hero glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[var(--brand)] opacity-[0.12] blur-[120px]" />
        <div className="absolute right-1/4 top-32 h-[280px] w-[280px] rounded-full bg-[var(--cyan)] opacity-[0.08] blur-[90px]" />
      </div>

      <section className="container-px mx-auto max-w-[1100px] scroll-mt-24 pb-24 pt-28 sm:pt-32">
        <SectionHeading
          eyebrow="Ship log"
          title={
            <>
              What we shipped —{" "}
              <span className="font-serif italic text-[var(--brand)]">with proof</span>
            </>
          }
          subtitle="Every feature below is in the codebase, tested, and reproducible. Not marketing slides — runnable benchmarks and MCP tools."
        />

        {/* Live stat cards */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "npm version", value: version, suffix: "", hero: false },
            {
              label: "GitHub stars",
              value: stars ?? 0,
              suffix: "",
              hero: false,
              display: stars === null ? "—" : undefined,
            },
            {
              label: "Express compression",
              value: compression?.value ?? 19.9,
              suffix: "×",
              hero: true,
            },
            {
              label: "Task accuracy",
              value: 100,
              suffix: "%",
              hero: false,
            },
          ].map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.05}>
              <div
                className="card relative h-full overflow-hidden p-6"
                style={
                  stat.hero
                    ? {
                        borderColor: "color-mix(in srgb, var(--brand) 40%, var(--border))",
                        boxShadow: "var(--shadow-glow)",
                      }
                    : undefined
                }
              >
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-faint)]">
                  {stat.label}
                </p>
                <p
                  className="mt-2 text-3xl font-semibold tracking-tight"
                  style={{ color: stat.hero ? "var(--brand)" : "var(--text)" }}
                >
                  {stat.display ?? (
                    <>
                      <AnimatedCounter
                        value={typeof stat.value === "number" ? stat.value : 0}
                        suffix={stat.suffix}
                        decimals={Number.isInteger(stat.value) ? 0 : 1}
                      />
                    </>
                  )}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* vs competitors — honest positioning */}
        <Reveal delay={0.1}>
          <div className="mt-10 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="border-b border-[var(--border)] px-6 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                <Trophy size={16} style={{ color: "var(--brand)" }} />
                Where we win vs Graphify · Ponytail · Obsidian vaults
              </h3>
            </div>
            <div className="grid gap-px bg-[var(--border)] sm:grid-cols-3">
              {[
                {
                  title: "Token pack()",
                  us: "Greedy knapsack — prints saved % on every context compile",
                  them: "Graphify: scoped query · Ponytail: no memory layer",
                },
                {
                  title: "Obsidian vault",
                  us: "`mnestis export vault` → `.mentis/vault/` with wikilinks",
                  them: "Manual notes · no auto-generated architecture vault",
                },
                {
                  title: "Hybrid recall",
                  us: "Vector + BM25 + graph BFS in engine + MCP",
                  them: "Graph-only or behavior-skills only",
                },
              ].map((row) => (
                <div key={row.title} className="bg-[var(--surface-solid)] p-5">
                  <p className="text-sm font-semibold text-[var(--brand)]">{row.title}</p>
                  <p className="mt-2 text-sm text-[var(--mint)]">{row.us}</p>
                  <p className="mt-2 text-xs text-[var(--text-faint)]">{row.them}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Timeline */}
        <div className="mt-16 space-y-12">
          {days.map((day, di) => (
            <Reveal key={day} delay={di * 0.04}>
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <span className="font-mono text-xs uppercase tracking-widest text-[var(--text-faint)]">
                    {day}
                  </span>
                  <span className="h-px flex-1 bg-[var(--border)]" />
                </div>
                <ul className="space-y-3">
                  {(grouped.get(day) ?? []).map((e, ei) => {
                    const style = TYPE_STYLE[e.type];
                    const Icon = style.icon;
                    return (
                      <motion.li
                        key={e.title}
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: ei * 0.05 }}
                        className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:border-[color-mix(in_srgb,var(--brand)_35%,var(--border))] hover:bg-[var(--surface-2)]"
                      >
                        <div className="flex flex-wrap items-start gap-3">
                          <span
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                            style={{
                              background: `color-mix(in srgb, ${style.color} 14%, transparent)`,
                              color: style.color,
                            }}
                          >
                            <Icon size={16} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                                style={{
                                  background: `color-mix(in srgb, ${style.color} 12%, transparent)`,
                                  color: style.color,
                                }}
                              >
                                {e.type}
                              </span>
                              <h3 className="font-semibold text-[var(--text)]">{e.title}</h3>
                            </div>
                            <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-dim)]">
                              {e.detail}
                            </p>
                            {e.metric && (
                              <p className="mt-2 font-mono text-xs text-[var(--cyan)]">{e.metric}</p>
                            )}
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Reproduce */}
        <Reveal delay={0.15}>
          <div className="mt-16 rounded-2xl border border-[var(--border)] bg-[var(--bg-1)] p-8 text-center">
            <p className="text-sm font-medium text-[var(--text)]">Don&apos;t trust us — run it</p>
            <p className="mt-2 text-sm text-[var(--text-dim)]">
              Benchmarks and token savings are reproducible on your machine.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <CopyCommand command="npm run bench:compare" />
              <CopyCommand command="mnestis memory context fix-auth --budget 4000" />
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
              <a
                href={SEO.github}
                className="inline-flex items-center gap-1 text-[var(--text-dim)] transition-colors hover:text-[var(--brand)]"
              >
                GitHub <ExternalLink size={12} />
              </a>
              <Link to="/docs" className="text-[var(--text-dim)] hover:text-[var(--brand)]">
                Documentation
              </Link>
              <Link to="/#compare" className="text-[var(--text-dim)] hover:text-[var(--brand)]">
                Full comparison
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
