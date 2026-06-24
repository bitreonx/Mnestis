import { motion, useReducedMotion } from "framer-motion";
import { MNESTISMark, BrandIcon, BRAND_KEYS, type BrandKey } from "../../lib/logos";

const TOOLS: BrandKey[] = [...BRAND_KEYS];

/**
 * The MNESTIS mark at the centre with AI-tool chips orbiting on two rings.
 * Chips counter-rotate so their glyphs stay upright. Pure transforms — crisp.
 */
export default function OrbitRing({ size = 360 }: { size?: number }) {
  const reduce = useReducedMotion();
  const rings = [
    { radius: size * 0.34, duration: 32, dir: 1, tools: TOOLS.slice(0, 3), offset: 0 },
    { radius: size * 0.48, duration: 46, dir: -1, tools: TOOLS.slice(3), offset: 60 },
  ];

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* glow core */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          background:
            "radial-gradient(circle, var(--glow) 0%, transparent 65%)",
          filter: "blur(6px)",
        }}
      />

      {/* dashed orbit guides */}
      {rings.map((r, i) => (
        <div
          key={`guide-${i}`}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed"
          style={{ width: r.radius * 2, height: r.radius * 2, borderColor: "var(--border)" }}
        />
      ))}

      {/* center mark */}
      <motion.div
        className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-3xl"
        style={{
          width: size * 0.26,
          height: size * 0.26,
          background: "var(--surface-solid)",
          border: "1px solid var(--border-strong)",
          boxShadow: "var(--shadow-glow)",
          color: "var(--brand)",
        }}
        animate={reduce ? {} : { y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <MNESTISMark size={size * 0.13} />
      </motion.div>

      {/* orbiting rings */}
      {rings.map((r, ri) => (
        <motion.div
          key={`ring-${ri}`}
          className="absolute left-1/2 top-1/2"
          style={{ width: 0, height: 0 }}
          animate={reduce ? {} : { rotate: 360 * r.dir }}
          transition={{ duration: r.duration, repeat: Infinity, ease: "linear" }}
        >
          {r.tools.map((tool, ti) => {
            const angle = (ti / r.tools.length) * Math.PI * 2 + (r.offset * Math.PI) / 180;
            const x = Math.cos(angle) * r.radius;
            const y = Math.sin(angle) * r.radius;
            return (
              <motion.div
                key={tool}
                className="absolute flex items-center justify-center"
                style={{ left: x, top: y }}
                animate={reduce ? {} : { rotate: -360 * r.dir }}
                transition={{ duration: r.duration, repeat: Infinity, ease: "linear" }}
              >
                <div
                  className="grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-solid)] text-[var(--text)] shadow-[var(--shadow-card)] transition-transform hover:scale-110"
                  title={tool}
                >
                  <BrandIcon name={tool} size={24} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ))}
    </div>
  );
}
