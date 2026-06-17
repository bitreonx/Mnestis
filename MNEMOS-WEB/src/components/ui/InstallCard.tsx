import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Check, Copy } from "lucide-react";
import { SITE } from "../../lib/site";
import { cn } from "../../lib/utils";

/**
 * The signature install block: a copy-on-click terminal pill joined to a solid
 * "Docs" button. Shared by the hero and the final CTA so they stay identical.
 */
export default function InstallCard({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SITE.install);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className={cn(
        "flex items-stretch gap-2 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-solid)] p-2 shadow-[var(--shadow-card)]",
        className
      )}
    >
      <button
        onClick={copy}
        aria-label="Copy install command"
        className="focus-ring group flex flex-1 items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-[var(--surface-2)]"
      >
        <span className="font-mono text-lg text-[var(--brand)]">{">_"}</span>
        <code className="font-mono text-base text-[var(--text)] sm:text-lg">{SITE.install}</code>
        <span className="ml-auto text-[var(--text-faint)] transition-colors group-hover:text-[var(--text)]">
          {copied ? <Check size={16} className="text-[var(--mint)]" /> : <Copy size={16} />}
        </span>
      </button>
      <button
        onClick={() => navigate("/docs")}
        className="focus-ring flex shrink-0 items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3.5 font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95"
      >
        <BookOpen size={18} /> Docs
      </button>
    </div>
  );
}
