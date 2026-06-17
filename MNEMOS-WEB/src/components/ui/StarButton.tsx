import { Star } from "lucide-react";
import { SITE } from "../../lib/site";
import { cn } from "../../lib/utils";

/**
 * Small, eye-catching "Star us on GitHub" pill with a looping rainbow gradient
 * and a popping star. Clicking opens the repo so the user can star it instantly.
 */
export default function StarButton({
  className,
  label = "Star us on GitHub",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <a
      href={SITE.github}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Star Mnemos on GitHub"
      className={cn(
        "focus-ring animate-rainbow group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-[0_6px_20px_-6px_var(--glow)] transition-transform hover:scale-[1.04] active:scale-95",
        className
      )}
      style={{
        background:
          "linear-gradient(90deg, #9b5bff, #47bfff, #3ecf8e, #ffc450, #ff6b9d, #9b5bff)",
      }}
    >
      <Star size={13} fill="currentColor" className="[animation:star-pop_1.8s_ease-in-out_infinite]" />
      {label}
    </a>
  );
}
