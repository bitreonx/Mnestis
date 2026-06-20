import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Check, ChevronDown, Copy, Sparkles } from "lucide-react";
import {
  STEER_PLATFORMS,
  buildLaunchCommand,
  buildQuickCommand,
  type SteerPlatform,
  type SteerPlatformId,
} from "../../lib/site";
import { BrandIcon, type BrandKey } from "../../lib/logos";
import { cn } from "../../lib/utils";

type Mode = "launch" | "quick";

const DEFAULT_PLATFORM: SteerPlatformId = "cursor";

function PlatformGlyph({ platform }: { platform: SteerPlatform }) {
  if (platform.brandKey) {
    return <BrandIcon name={platform.brandKey as BrandKey} size={18} />;
  }
  return (
    <span className="grid h-[18px] w-[18px] place-items-center rounded-md bg-[var(--surface-2)] text-[10px] font-bold text-[var(--text-dim)]">
      {platform.label.slice(0, 1)}
    </span>
  );
}

export default function PlatformInstallWizard({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "onDark";
}) {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const [platformId, setPlatformId] = useState<SteerPlatformId>(DEFAULT_PLATFORM);
  const [mode, setMode] = useState<Mode>("launch");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const platform = STEER_PLATFORMS.find((p) => p.id === platformId) ?? STEER_PLATFORMS[0];
  const command =
    mode === "launch" ? buildLaunchCommand(platformId) : buildQuickCommand();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const onDark = variant === "onDark";

  return (
    <div className={cn("w-full space-y-3", className)}>
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 rounded-2xl border p-2",
          onDark
            ? "border-white/20 bg-white/10"
            : "border-[var(--border-strong)] bg-[var(--surface-solid)] shadow-[var(--shadow-card)]"
        )}
      >
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label="Choose AI platform"
            className={cn(
              "focus-ring flex items-center gap-2 rounded-xl px-3 py-3.5 text-left transition-colors",
              onDark ? "hover:bg-white/10" : "hover:bg-[var(--surface-2)]"
            )}
          >
            <PlatformGlyph platform={platform} />
            <span className="hidden min-w-[5.5rem] flex-col sm:flex">
              <span
                className={cn(
                  "text-xs font-medium",
                  onDark ? "text-white/60" : "text-[var(--text-faint)]"
                )}
              >
                {platform.codename}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold",
                  onDark ? "text-white" : "text-[var(--text)]"
                )}
              >
                {platform.label}
              </span>
            </span>
            <ChevronDown
              size={16}
              className={cn(onDark ? "text-white/70" : "text-[var(--text-faint)]")}
            />
          </button>

          {open && (
            <ul
              role="listbox"
              aria-label="AI platforms"
              className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-[15rem] overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--surface-solid)] py-1 shadow-[var(--shadow-card)]"
            >
              {STEER_PLATFORMS.map((p) => (
                <li key={p.id} role="option" aria-selected={p.id === platformId}>
                  <button
                    type="button"
                    onClick={() => {
                      setPlatformId(p.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "focus-ring flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)]",
                      p.id === platformId && "bg-[var(--surface-2)]"
                    )}
                  >
                    <PlatformGlyph platform={p} />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-[var(--text)]">
                        {p.label}
                        <span className="ml-1.5 font-normal text-[var(--text-faint)]">
                          · {p.codename}
                        </span>
                      </span>
                      <span className="text-xs text-[var(--text-dim)]">{p.tagline}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy install command"
          className={cn(
            "focus-ring group flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-3.5 text-left transition-colors sm:px-4",
            onDark ? "hover:bg-white/10" : "hover:bg-[var(--surface-2)]"
          )}
        >
          <span
            className={cn(
              "shrink-0 font-mono text-lg",
              onDark ? "text-white/80" : "text-[var(--brand)]"
            )}
          >
            {">_"}
          </span>
          <code
            className={cn(
              "truncate font-mono text-sm sm:text-base",
              onDark ? "text-white" : "text-[var(--text)]"
            )}
          >
            {command}
          </code>
          <span
            className={cn(
              "ml-auto shrink-0 transition-colors",
              onDark ? "text-white/50 group-hover:text-white" : "text-[var(--text-faint)] group-hover:text-[var(--text)]"
            )}
          >
            {copied ? (
              <Check size={16} className="text-[var(--mint)]" />
            ) : (
              <Copy size={16} />
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/docs")}
          className={cn(
            "focus-ring flex shrink-0 items-center gap-2 rounded-xl px-5 py-3.5 font-semibold transition-transform hover:scale-[1.02] active:scale-95",
            onDark
              ? "bg-white text-[var(--brand)]"
              : "bg-[var(--brand)] text-white"
          )}
        >
          <BookOpen size={18} /> Docs
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("launch")}
            className={cn(
              "focus-ring rounded-full px-3 py-1 text-xs font-medium transition-colors",
              mode === "launch"
                ? "bg-[var(--brand)] text-white"
                : onDark
                  ? "text-white/70 hover:text-white"
                  : "text-[var(--text-dim)] hover:text-[var(--text)]"
            )}
          >
            <Sparkles size={12} className="mr-1 inline" aria-hidden />
            Launch + steer
          </button>
          <button
            type="button"
            onClick={() => setMode("quick")}
            className={cn(
              "focus-ring rounded-full px-3 py-1 text-xs font-medium transition-colors",
              mode === "quick"
                ? "bg-[var(--brand)] text-white"
                : onDark
                  ? "text-white/70 hover:text-white"
                  : "text-[var(--text-dim)] hover:text-[var(--text)]"
            )}
          >
            Quick scan only
          </button>
        </div>
        <p
          className={cn(
            "text-xs",
            onDark ? "text-white/65" : "text-[var(--text-faint)]"
          )}
        >
          {mode === "launch"
            ? "Builds memory, runs security audit, installs skills — agent steers automatically"
            : "Analyze only — run setup later with getmnemos setup --platform …"}
        </p>
      </div>

      <details
        className={cn(
          "rounded-xl border px-4 py-3 text-sm",
          onDark
            ? "border-white/15 bg-white/5 text-white/85"
            : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)]"
        )}
      >
        <summary className="cursor-pointer font-medium select-none">
          What {platform.codename} installs into your repo
        </summary>
        <ul className="mt-3 space-y-1.5 font-mono text-xs">
          {platform.installs.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Check size={12} className="shrink-0 text-[var(--mint)]" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
      </details>

      <p
        className={cn(
          "text-center font-mono text-xs",
          onDark ? "text-white/55" : "text-[var(--text-faint)]"
        )}
      >
        or{" "}
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText("npm install -g getmnemos");
            } catch {
              /* ignore */
            }
          }}
          className={cn(
            "focus-ring underline-offset-2 hover:underline",
            onDark ? "text-white/80" : "text-[var(--brand)]"
          )}
        >
          npm install -g getmnemos
        </button>
        {" · "}
        <a
          href="https://www.npmjs.com/package/getmnemos"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "focus-ring underline-offset-2 hover:underline",
            onDark ? "text-white/80" : "text-[var(--brand)]"
          )}
        >
          npm registry
        </a>
      </p>
    </div>
  );
}
