interface HealthRingProps {
  value: number;
  size?: number;
  label?: string;
  /** show the "/ 100" scale under the number */
  showScale?: boolean;
}

function ringTone(score: number): 'good' | 'ok' | 'warn' | 'bad' | 'neutral' {
  if (Number.isNaN(score)) return 'neutral';
  if (score >= 80) return 'good';
  if (score >= 60) return 'ok';
  if (score >= 40) return 'warn';
  return 'bad';
}

/**
 * Apple-glass radial health gauge. Animated arc, tone-colored glow,
 * metallic center value. Used as the health centerpiece across cockpits.
 */
export function HealthRing({ value, size = 104, label, showScale = true }: HealthRingProps) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;
  const tone = ringTone(safe);

  return (
    <div
      className={`health-ring health-ring--${tone}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ?? 'Health'} ${safe} out of 100`}
    >
      <svg viewBox="0 0 120 120">
        <circle className="health-ring-track" cx="60" cy="60" r={radius} />
        <circle
          className="health-ring-value"
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="health-ring-center">
        <strong>{safe}</strong>
        {showScale && <span>/ 100</span>}
      </div>
    </div>
  );
}
