import { BrandIcon, BRAND_KEYS } from "../lib/logos";

/** Marquee of AI-developer tools. Illustrative of the ecosystem — not endorsements. */
export default function TrustedBy() {
  const row = [...BRAND_KEYS, ...BRAND_KEYS];
  return (
    <section className="border-y border-[var(--border)] py-12">
      <div className="container-px mx-auto max-w-[1200px]">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-faint)]">
          Built for the AI developers using
        </p>

        <div
          className="relative mt-8 overflow-hidden"
          style={{
            maskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
          }}
        >
          <div className="flex w-max animate-marquee items-center gap-14">
            {row.map((tool, i) => (
              <div
                key={`${tool}-${i}`}
                className="flex shrink-0 items-center gap-2.5 text-[var(--text-dim)] opacity-80 transition-opacity hover:opacity-100"
              >
                <BrandIcon name={tool} size={28} />
                <span className="text-lg font-semibold tracking-tight text-[var(--text)]">{tool}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
