import { motion } from "framer-motion";
import InstallCard from "../components/ui/InstallCard";
import { MnemosMark } from "../lib/logos";

const EASE = [0.22, 0.8, 0.18, 1] as const;

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden pb-28 pt-44 sm:pt-52">
      {/* the only background element: the logo, faint, behind the text */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center" aria-hidden>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: EASE }}
          className="-mt-10"
        >
          <MnemosMark
            size={620}
            color="var(--text)"
            style={{ opacity: 0.05 }}
            className="max-w-[88vw]"
          />
        </motion.div>
      </div>

      <div className="container-px mx-auto flex max-w-3xl flex-col items-center text-center">
        <motion.span
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-dim)] backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
          The memory layer for software
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.06, ease: EASE }}
          className="mt-7 text-balance text-[2.9rem] font-semibold leading-[1.04] tracking-tight text-[var(--text)] sm:text-[3.8rem]"
        >
          Give AI a <span className="font-serif italic text-[var(--brand)]">memory</span> of
          your codebase.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.14, ease: EASE }}
          className="mt-6 max-w-xl text-pretty text-[1.1rem] leading-relaxed text-[var(--text-dim)]"
        >
          One command turns any repository into architecture humans and AI understand
          instantly — flows, domains, APIs, and capabilities.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.22, ease: EASE }}
          className="mt-9 w-full max-w-2xl"
        >
          <InstallCard />
        </motion.div>
      </div>
    </section>
  );
}
