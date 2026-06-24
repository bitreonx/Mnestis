import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "../../lib/utils";

type Props = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  newTab?: boolean;
  className?: string;
  strength?: number;
  "aria-label"?: string;
};

/**
 * Magnetic, physics-based button. Cursor drags the button a few px, the label
 * counter-parallaxes, a glow tracks the pointer, and press scales down.
 */
export default function MagneticButton({
  children,
  href,
  onClick,
  variant = "primary",
  newTab,
  className,
  strength = 0.4,
  ...rest
}: Props) {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);

  const x = useSpring(mx, { stiffness: 250, damping: 18, mass: 0.4 });
  const y = useSpring(my, { stiffness: 250, damping: 18, mass: 0.4 });
  const lx = useTransform(x, (v) => v * 0.35);
  const ly = useTransform(y, (v) => v * 0.35);

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const relX = e.clientX - (r.left + r.width / 2);
    const relY = e.clientY - (r.top + r.height / 2);
    mx.set(relX * strength);
    my.set(relY * strength);
    gx.set(((e.clientX - r.left) / r.width) * 100);
    gy.set(((e.clientY - r.top) / r.height) * 100);
  };
  const reset = () => {
    mx.set(0);
    my.set(0);
    gx.set(50);
    gy.set(50);
  };

  const isPrimary = variant === "primary";
  const glow = useTransform(
    [gx, gy],
    ([px, py]) =>
      `radial-gradient(120px circle at ${px}% ${py}%, rgba(255,255,255,0.35), transparent 60%)`
  );

  const cls = cn(
    "focus-ring relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-full px-7 py-3.5 text-[0.95rem] font-semibold transition-colors",
    isPrimary
      ? "text-white"
      : "text-[var(--text)] border border-[var(--border-strong)] bg-[var(--surface)] hover:bg-[var(--surface-2)]",
    className
  );

  const inner = (
    <>
      {isPrimary && (
        <>
          <span className="absolute inset-0 -z-10" style={{ background: "var(--brand)" }} />
          <span
            className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              boxShadow:
                "0 10px 40px -6px var(--glow), 0 0 0 1px rgba(255,255,255,0.15) inset",
            }}
          />
          <motion.span
            className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            style={{ background: glow }}
          />
        </>
      )}
      <motion.span style={{ x: lx, y: ly }} className="relative z-10 inline-flex items-center gap-2">
        {children}
      </motion.span>
    </>
  );

  const motionProps = {
    style: { x, y },
    whileTap: { scale: 0.94 },
    transition: { type: "spring" as const, stiffness: 400, damping: 17 },
    onMouseMove: handleMove,
    onMouseLeave: reset,
    className: cn("group", cls),
  };

  if (href) {
    const external = href.startsWith("http");
    return (
      <motion.a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        target={newTab || external ? "_blank" : undefined}
        rel={newTab || external ? "noopener noreferrer" : undefined}
        {...rest}
        {...motionProps}
      >
        {inner}
      </motion.a>
    );
  }
  return (
    <motion.button
      ref={ref as React.RefObject<HTMLButtonElement>}
      onClick={onClick}
      {...rest}
      {...motionProps}
    >
      {inner}
    </motion.button>
  );
}
