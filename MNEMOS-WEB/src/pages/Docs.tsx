import { Fragment, useMemo, type ReactNode } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Info, Lightbulb, AlertTriangle, Hash } from "lucide-react";
import { DOCS, ALL_DOC_PAGES, findDoc, type Block } from "../lib/docs";
import CopyCommand from "../components/ui/CopyCommand";
import { cn } from "../lib/utils";

/** Render inline `code` and **bold** spans inside a string. */
function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`")) return <code key={i}>{p.slice(1, -1)}</code>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  return (
    <div className="my-5 overflow-hidden rounded-xl border border-[var(--border)] bg-[#0b0814]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-faint)]">
          {lang ?? "text"}
        </span>
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[0.86rem] leading-relaxed text-[#d7cdf2]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Callout({ tone = "info", title, text }: { tone?: "info" | "tip" | "warn"; title: string; text: string }) {
  const map = {
    info: { Icon: Info, c: "var(--cyan)" },
    tip: { Icon: Lightbulb, c: "var(--mint)" },
    warn: { Icon: AlertTriangle, c: "var(--brand)" },
  } as const;
  const { Icon, c } = map[tone];
  return (
    <div
      className="my-6 flex gap-3.5 rounded-xl border p-4"
      style={{ borderColor: `color-mix(in srgb, ${c} 35%, transparent)`, background: `color-mix(in srgb, ${c} 8%, transparent)` }}
    >
      <span className="mt-0.5 shrink-0" style={{ color: c }}>
        <Icon size={18} />
      </span>
      <div>
        <p className="font-semibold text-[var(--text)]">{title}</p>
        <p className="mt-1 text-[0.95rem] text-[var(--text-dim)]">{inline(text)}</p>
      </div>
    </div>
  );
}

function renderBlock(b: Block, i: number) {
  switch (b.type) {
    case "h2":
      return (
        <h2 key={i} id={slugify(b.text)} className="group scroll-mt-28">
          {b.text}
          <a href={`#${slugify(b.text)}`} className="ml-2 inline-block opacity-0 transition-opacity group-hover:opacity-60" aria-hidden>
            <Hash size={16} className="inline" />
          </a>
        </h2>
      );
    case "h3":
      return <h3 key={i} id={slugify(b.text)} className="scroll-mt-28">{b.text}</h3>;
    case "p":
      return <p key={i}>{inline(b.text)}</p>;
    case "list":
      return (
        <ul key={i}>
          {b.items.map((it, j) => (
            <li key={j}>{inline(it)}</li>
          ))}
        </ul>
      );
    case "code":
      if (b.lang === "bash" && !b.code.includes("\n"))
        return <div key={i} className="my-5"><CopyCommand command={b.code.replace(/^\$ ?/, "")} /></div>;
      return <CodeBlock key={i} code={b.code} lang={b.lang} />;
    case "callout":
      return <Callout key={i} {...b} />;
    case "cards":
      return (
        <div key={i} className="my-6 grid gap-3 sm:grid-cols-2">
          {b.items.map((c, j) => (
            <div key={j} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="font-semibold text-[var(--text)]">{c.title}</p>
              <p className="mt-1 text-sm text-[var(--text-dim)]">{inline(c.desc)}</p>
            </div>
          ))}
        </div>
      );
    case "table":
      return (
        <div key={i} className="my-6 overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                {b.head.map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold text-[var(--text)]">{inline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, ri) => (
                <tr key={ri} className="border-b border-[var(--border)] last:border-0">
                  {r.map((cell, ci) => (
                    <td key={ci} className="px-4 py-3 align-top text-[var(--text-dim)]">{inline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export default function Docs() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const page = findDoc(slug);

  const idx = ALL_DOC_PAGES.findIndex((p) => p.slug === page.slug);
  const prev = idx > 0 ? ALL_DOC_PAGES[idx - 1] : null;
  const next = idx < ALL_DOC_PAGES.length - 1 ? ALL_DOC_PAGES[idx + 1] : null;

  const toc = useMemo(
    () => page.blocks.filter((b) => b.type === "h2").map((b) => (b as { text: string }).text),
    [page]
  );

  return (
    <div className="container-px mx-auto max-w-[1240px] pt-24">
      <div className="grid gap-10 lg:grid-cols-[230px_1fr_180px]">
        {/* sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-10">
            <button
              onClick={() => navigate("/")}
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
            >
              <ArrowLeft size={14} /> Back home
            </button>
            {DOCS.map((group) => (
              <div key={group.title} className="mb-6">
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                  {group.title}
                </p>
                <nav className="flex flex-col gap-0.5">
                  {group.pages.map((p) => {
                    const active = p.slug === page.slug;
                    return (
                      <Link
                        key={p.slug}
                        to={`/docs/${p.slug}`}
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-[var(--surface-2)] font-medium text-[var(--text)]"
                            : "text-[var(--text-dim)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                        )}
                        style={active ? { boxShadow: "inset 2px 0 0 var(--brand)" } : undefined}
                      >
                        {p.title}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </aside>

        {/* content */}
        <motion.article
          key={page.slug}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="min-w-0 pb-24"
        >
          {/* mobile nav */}
          <div className="mb-6 flex gap-2 overflow-x-auto lg:hidden">
            {ALL_DOC_PAGES.map((p) => (
              <Link
                key={p.slug}
                to={`/docs/${p.slug}`}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs",
                  p.slug === page.slug
                    ? "border-[var(--brand)] text-[var(--text)]"
                    : "border-[var(--border)] text-[var(--text-dim)]"
                )}
              >
                {p.title}
              </Link>
            ))}
          </div>

          <p className="text-sm font-medium text-[var(--brand)]">Documentation</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[var(--text)]">{page.title}</h1>
          <p className="mt-3 text-lg text-[var(--text-dim)]">{page.description}</p>
          <div className="my-8 h-px bg-[var(--border)]" />

          <div className="prose-mnemos">{page.blocks.map(renderBlock)}</div>

          {/* prev / next */}
          <div className="mt-16 grid gap-4 sm:grid-cols-2">
            {prev ? (
              <Link to={`/docs/${prev.slug}`} className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--brand)]">
                <span className="flex items-center gap-1 text-xs text-[var(--text-faint)]"><ArrowLeft size={12} /> Previous</span>
                <p className="mt-1 font-medium text-[var(--text)] group-hover:text-[var(--brand)]">{prev.title}</p>
              </Link>
            ) : <span />}
            {next && (
              <Link to={`/docs/${next.slug}`} className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-right transition-colors hover:border-[var(--brand)]">
                <span className="flex items-center justify-end gap-1 text-xs text-[var(--text-faint)]">Next <ArrowRight size={12} /></span>
                <p className="mt-1 font-medium text-[var(--text)] group-hover:text-[var(--brand)]">{next.title}</p>
              </Link>
            )}
          </div>
        </motion.article>

        {/* TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            {toc.length > 0 && (
              <>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">On this page</p>
                <nav className="flex flex-col gap-1.5 border-l border-[var(--border)]">
                  {toc.map((t) => (
                    <a
                      key={t}
                      href={`#${slugify(t)}`}
                      className="-ml-px border-l border-transparent pl-3 text-sm text-[var(--text-dim)] transition-colors hover:border-[var(--brand)] hover:text-[var(--text)]"
                    >
                      {t}
                    </a>
                  ))}
                </nav>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
