import { useEffect, useRef, useState } from 'react';
import { Terminal as TerminalIcon, X } from 'lucide-react';
import { IntegratedTerminal, type TerminalMode } from '../IntegratedTerminal';

interface CockpitTerminalPanelProps {
  repoId: string;
  repositoryPath: string;
  /** Cockpit mode — used as the terminal's initial mode. */
  mode: TerminalMode;
}

const MIN_HEIGHT = 180;
const MAX_HEIGHT = 640;
const STORAGE_OPEN = 'mnemos.cockpit-terminal.open';
const STORAGE_HEIGHT = 'mnemos.cockpit-terminal.height';

/**
 * Global, collapsible Mnemos terminal docked to the bottom of every cockpit.
 * Toggle with the floating launcher or Ctrl+` (Cmd+` on macOS).
 */
export function CockpitTerminalPanel({ repoId, repositoryPath, mode }: CockpitTerminalPanelProps) {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_OPEN) === '1';
    } catch {
      return false;
    }
  });
  const [height, setHeight] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_HEIGHT);
      const n = raw ? Number(raw) : 320;
      return Number.isFinite(n) ? Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, n)) : 320;
    } catch {
      return 320;
    }
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_OPEN, open ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [open]);

  // Keep latest height accessible inside the mouseup closure.
  const heightRef = useRef(height);
  heightRef.current = height;

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = height;
    const onMove = (ev: MouseEvent) => {
      const next = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startH + (startY - ev.clientY)));
      setHeight(next);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      try {
        localStorage.setItem(STORAGE_HEIGHT, String(heightRef.current));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (!open) {
    return (
      <button
        type="button"
        className="mnemos-term-launcher"
        onClick={() => setOpen(true)}
        title="Open Mnemos terminal (Ctrl+`)"
        aria-label="Open Mnemos terminal"
      >
        <TerminalIcon className="h-4 w-4" aria-hidden />
        <span>Terminal</span>
        <kbd>Ctrl `</kbd>
      </button>
    );
  }

  return (
    <div className="mnemos-term-dock" style={{ height }}>
      <div className="mnemos-term-dock-resize" onMouseDown={startResize} role="separator" aria-label="Resize terminal" />
      <div className="mnemos-term-dock-head">
        <span className="mnemos-term-dock-title">
          <TerminalIcon className="h-3.5 w-3.5" aria-hidden /> Mnemos Terminal
        </span>
        <button
          type="button"
          className="mnemos-term-dock-close"
          onClick={() => setOpen(false)}
          title="Hide terminal (Ctrl+`)"
          aria-label="Hide terminal"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      <div className="mnemos-term-dock-body">
        <IntegratedTerminal
          key={repoId}
          repoId={repoId}
          repositoryPath={repositoryPath}
          initialMode={mode}
        />
      </div>
    </div>
  );
}
