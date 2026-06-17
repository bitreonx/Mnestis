import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { SITE } from "../../lib/site";
import DecryptText from "./DecryptText";
import StarButton from "./StarButton";
import { GitHubIcon } from "../../lib/logos";

const DISMISS_KEY = "mnemos-bubble-dismissed";

/**
 * "Made by" creator cluster: avatar enlarges on hover, the byline decrypts in
 * character-by-character, and a spring-loaded bubble floats in with an animated
 * "Star us on GitHub" button. Dismissal is remembered.
 */
export default function GitHubProfile({ delay = 3500 }: { delay?: number }) {
  const [hover, setHover] = useState(false);
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY)) return;
    const t = setTimeout(() => setShowBubble(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const dismiss = () => {
    setShowBubble(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="relative flex items-center gap-2.5"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span className="font-serif text-lg italic text-[var(--text-dim)]">Made by</span>

      <a
        href={SITE.github}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${SITE.author} on GitHub`}
        className="focus-ring group flex items-center gap-2.5 rounded-full"
      >
        <motion.span
          className="relative block overflow-hidden rounded-lg"
          animate={{ width: hover ? 40 : 34, height: hover ? 40 : 34 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          style={{ boxShadow: "0 0 0 1px var(--border-strong)" }}
        >
          <motion.img
            src={SITE.avatar}
            alt={SITE.author}
            className="h-full w-full object-cover"
            animate={{ scale: hover ? 1.14 : 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            loading="lazy"
          />
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-lg"
            animate={{ opacity: hover ? 1 : 0 }}
            style={{ boxShadow: "0 0 18px -2px var(--glow) inset, 0 0 0 1px var(--brand)" }}
          />
        </motion.span>

        <AnimatePresence>
          {hover && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden whitespace-nowrap font-mono text-[0.85rem] font-medium text-[var(--text)]"
            >
              <DecryptText text={SITE.authorByline} active={hover} speed={26} />
            </motion.span>
          )}
        </AnimatePresence>
      </a>

      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.78, y: 8, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 240, damping: 18 }}
            className="absolute bottom-full right-0 z-50 mb-3 w-[250px]"
          >
            <div className="absolute -bottom-1.5 right-8 h-3 w-3 rotate-45 border-b border-r border-[var(--border)] bg-[var(--surface-solid)]" />
            <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-3.5 shadow-[var(--shadow-glow)]">
              <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="focus-ring absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-solid)] text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
              >
                <X size={12} />
              </button>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-[var(--text)]">
                  <GitHubIcon width={20} height={20} />
                </span>
                <div>
                  <p className="text-[0.86rem] font-semibold leading-snug text-[var(--text)]">
                    Don't let your code be forgotten.
                  </p>
                  <p className="mt-1 text-[0.72rem] leading-snug text-[var(--text-dim)]">
                    Keep its memory alive —
                  </p>
                  <div className="mt-2.5">
                    <StarButton />
                  </div>
                  <p className="mt-2 font-serif text-[0.72rem] italic text-[var(--text-faint)]">
                    — Bitreon
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
