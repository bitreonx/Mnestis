interface MnemosLogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export function MnemosLogo({ size = 28, showWordmark = false, className = '' }: MnemosLogoProps) {
  if (showWordmark) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`} aria-label="Mnemos">
        <img
          src="/logo.svg"
          alt=""
          aria-hidden
          className="mnemos-logo-mark"
          width={size}
          height={size}
          draggable={false}
        />
        <span style={{ fontWeight: 700, fontSize: size * 0.72, letterSpacing: '-0.03em' }}>Mnemos</span>
      </span>
    );
  }

  return (
    <img
      src="/logo.svg"
      alt="Mnemos"
      className={`mnemos-logo-mark ${className}`}
      width={size}
      height={size}
      draggable={false}
    />
  );
}
