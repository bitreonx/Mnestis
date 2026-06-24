import { useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#@%&$*";

/**
 * Character-by-character "decryption" reveal.
 * Runs when `active` flips true; resets to scrambled when false.
 */
export default function DecryptText({
  text,
  active,
  speed = 28,
  className,
  onDone,
}: {
  text: string;
  active: boolean;
  speed?: number;
  className?: string;
  onDone?: () => void;
}) {
  const [display, setDisplay] = useState(text);
  const frame = useRef(0);
  const raf = useRef<number | null>(null);
  const last = useRef(0);

  useEffect(() => {
    if (!active) {
      setDisplay(
        text
          .split("")
          .map((c) => (c === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join("")
      );
      return;
    }
    frame.current = 0;
    const total = text.length;

    const tick = (t: number) => {
      if (t - last.current >= speed) {
        last.current = t;
        const revealed = Math.floor(frame.current);
        setDisplay(
          text
            .split("")
            .map((c, i) => {
              if (c === " ") return " ";
              if (i < revealed) return c;
              return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            })
            .join("")
        );
        frame.current += 0.5;
        if (revealed >= total) {
          setDisplay(text);
          onDone?.();
          return;
        }
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, text, speed]);

  return <span className={className}>{display}</span>;
}
