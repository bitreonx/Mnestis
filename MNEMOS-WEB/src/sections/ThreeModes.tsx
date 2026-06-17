import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { MODES } from "../lib/site";
import SectionHeading from "../components/ui/SectionHeading";

function ModePreview({ id, color }: { id: string; color: string }) {
  if (id === "vibe") {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <p className="text-sm font-semibold text-[var(--text)]">What does this product do?</p>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-dim)]">
            It's a checkout platform. Users browse a catalog, build a cart, and pay —
            with order tracking and refunds handled end-to-end.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {["Browse", "Checkout", "Fulfil"].map((j) => (
            <div key={j} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
              <div className="mx-auto mb-1.5 h-7 w-7 rounded-full" style={{ background: color, opacity: 0.85 }} />
              <p className="text-xs font-medium text-[var(--text-dim)]">{j}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <span className="text-sm text-[var(--text-dim)]">Health</span>
          <span className="text-sm font-semibold" style={{ color }}>Excellent · 92</span>
        </div>
      </div>
    );
  }
  if (id === "coder") {
    return (
      <div className="space-y-3 font-mono">
        <div className="flex gap-2">
          {["Overview", "Architecture", "Flows", "Smells"].map((t, i) => (
            <span
              key={t}
              className="rounded-md border px-2.5 py-1 text-[11px]"
              style={{
                borderColor: i === 1 ? color : "var(--border)",
                color: i === 1 ? color : "var(--text-faint)",
                background: i === 1 ? "color-mix(in srgb, var(--cyan) 12%, transparent)" : "transparent",
              }}
            >
              {t}
            </span>
          ))}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <div className="grid grid-cols-3 gap-2">
            {["auth", "billing", "catalog", "orders", "search", "users"].map((d) => (
              <div key={d} className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-center text-[11px] text-[var(--text-dim)]">
                {d}
              </div>
            ))}
          </div>
          <svg viewBox="0 0 200 40" className="mt-3 w-full">
            <path d="M10 30 C60 30 60 10 100 10 S140 30 190 30" stroke={color} strokeWidth="1.5" fill="none" />
            {[10, 100, 190].map((x, i) => (
              <circle key={i} cx={x} cy={i === 1 ? 10 : 30} r="3.5" fill={color} />
            ))}
          </svg>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[11px] text-[var(--text-dim)]">
          <span style={{ color: "var(--warn, #e0a93c)" }}>⚠ 2 god modules</span> · 1 circular dep
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3 font-mono text-[12px]">
      <div className="rounded-xl border border-[var(--border)] bg-[#0c0916] p-4 text-[var(--lilac)]">
        <p className="text-[var(--text-faint)]">// AI Pack v1</p>
        <p><span style={{ color }}>"version"</span>: "1.0.0",</p>
        <p><span style={{ color }}>"domains"</span>: 31, <span style={{ color }}>"flows"</span>: 268,</p>
        <p><span style={{ color }}>"score"</span>: 92, <span style={{ color }}>"issues"</span>: [ … ]</p>
      </div>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <p className="text-[11px] text-[var(--text-faint)]">REPAIR · circular dependency</p>
        <p className="mt-1 text-[12px] text-[var(--text-dim)]">Extract <span style={{ color }}>shared/types.ts</span> to break auth ↔ billing cycle.</p>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[11px] text-[var(--text-dim)]">
        <span style={{ color }}>$</span> curl localhost:4000/copilot/pack/local
      </div>
    </div>
  );
}

export default function ThreeModes() {
  const [active, setActive] = useState<string>(MODES[0].id);
  const mode = MODES.find((m) => m.id === active)!;

  return (
    <section id="modes" className="container-px mx-auto max-w-[1200px] scroll-mt-24 py-24 sm:py-32">
      <SectionHeading
        eyebrow="Three Modes"
        title="One memory. Three minds."
        subtitle="Modes are routes, not toggles — each a purpose-built cockpit for who's looking."
      />

      {/* switcher */}
      <div className="mt-12 flex justify-center">
        <div
          className="relative inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] p-1.5 backdrop-blur"
          role="tablist"
          aria-label="Mode"
        >
          {MODES.map((m) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={active === m.id}
              onClick={() => setActive(m.id)}
              className="focus-ring relative z-10 rounded-full px-5 py-2 text-sm font-medium transition-colors"
              style={{ color: active === m.id ? "#fff" : "var(--text-dim)" }}
            >
              {active === m.id && (
                <motion.span
                  layoutId="mode-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 -z-10 rounded-full"
                  style={{ background: "var(--brand)" }}
                />
              )}
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.22, 0.8, 0.18, 1] }}
            className="order-2 flex flex-col justify-center lg:order-1"
          >
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: mode.color }}>
              {mode.audience} · feels like {mode.feel}
            </span>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text)]">
              {mode.tagline}
            </h3>
            <ul className="mt-6 space-y-3">
              {mode.points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[var(--text-dim)]">
                  <span
                    className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full"
                    style={{ background: "color-mix(in srgb, var(--brand) 18%, transparent)", color: mode.color }}
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span className="text-[0.97rem]">{p}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            key={`${mode.id}-preview`}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 0.8, 0.18, 1] }}
            className="card order-1 p-5 lg:order-2"
          >
            <div className="mb-4 flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 font-mono text-xs text-[var(--text-faint)]">
                mnemos / {mode.id}
              </span>
            </div>
            <ModePreview id={mode.id} color={mode.color} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
