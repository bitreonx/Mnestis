import { useRef, useState, type ReactNode } from "react";
import { cn } from "../../lib/utils";

/**
 * Card with a pointer-tracking spotlight + reactive border highlight.
 * Pure CSS variables updated on mousemove — cheap and smooth.
 */
export default function GlowCard({
  children,
  className,
  accent = "var(--brand)",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  accent?: string;
  as?: "div" | "a";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -200, y: -200, active: false });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top, active: true });
  };

  return (
    <Tag
      ref={ref as never}
      onMouseMove={onMove}
      onMouseLeave={() => setPos((p) => ({ ...p, active: false }))}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors duration-300",
        className
      )}
      style={
        {
          "--mx": `${pos.x}px`,
          "--my": `${pos.y}px`,
          "--accent": accent,
        } as React.CSSProperties
      }
    >
      {/* spotlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(280px circle at var(--mx) var(--my), color-mix(in srgb, var(--accent) 16%, transparent), transparent 60%)",
        }}
      />
      {/* reactive border */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          padding: 1,
          background:
            "radial-gradient(220px circle at var(--mx) var(--my), color-mix(in srgb, var(--accent) 55%, transparent), transparent 65%)",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      <div className="relative z-10">{children}</div>
    </Tag>
  );
}
