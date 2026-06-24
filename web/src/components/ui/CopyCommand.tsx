import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { cn } from "../../lib/utils";

/** Terminal-style command pill with copy-to-clipboard + tactile feedback. */
export default function CopyCommand({
  command,
  className,
}: {
  command: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <button
      onClick={copy}
      aria-label={`Copy command: ${command}`}
      className={cn(
        "focus-ring group inline-flex items-center gap-3 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-2.5 font-mono text-sm text-[var(--text)] backdrop-blur transition-colors hover:border-[var(--brand)]",
        className
      )}
    >
      <span className="text-[var(--brand)]">$</span>
      <span className="tracking-tight">{command}</span>
      <span className="relative ml-1 grid h-4 w-4 place-items-center text-[var(--text-dim)]">
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="check"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="absolute text-[var(--mint)]"
            >
              <Check size={15} />
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute group-hover:text-[var(--text)]"
            >
              <Copy size={15} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}
