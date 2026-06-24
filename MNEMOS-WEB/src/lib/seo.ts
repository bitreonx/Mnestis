/** Central SEO constants — keep in sync with index.html and README. */
export const SEO = {
  siteUrl: "https://mnestis.vercel.app",
  siteName: "Mnestis",
  tagline: "Give AI a memory of your codebase",
  defaultTitle: "Mnestis — Give AI a memory of your codebase",
  defaultDescription:
    "Mnestis is the local-first memory layer for software. Turn any repository into architecture DNA, dependency graphs, and AI Pack v1 for Cursor, Claude Code, and Codex — one command, no API keys.",
  keywords:
    "Mnestis, codebase memory, AI coding assistant, architecture intelligence, Cursor MCP, Claude Code, Codex, local-first, dependency graph, AI Pack, codebase analysis, developer tools, Graphify alternative, repository DNA",
  ogImage: "https://mnestis.vercel.app/og.png",
  github: "https://github.com/bitreonx/Mnestis",
  npm: "https://www.npmjs.com/package/mnestis",
  twitterHandle: "@bitreonx",
} as const;

export type PageSeo = {
  title: string;
  description: string;
  path?: string;
};

export const PAGES: Record<string, PageSeo> = {
  home: {
    title: SEO.defaultTitle,
    description: SEO.defaultDescription,
    path: "/",
  },
  docs: {
    title: "Mnestis Documentation — Install, CLI, MCP & AI Pack",
    description:
      "Official Mnestis docs: install with npx mnestis, launch Cursor/Claude steering, MCP server, AI Pack v1, Fable discipline, and memory engine.",
    path: "/docs",
  },
  achievements: {
    title: "Mnestis Achievements — Shipped features & benchmarks",
    description:
      "Timeline of Mnestis memory layer releases: hybrid recall, token packing, CLI milestones. Reproducible benchmarks. Formerly Mnemos.",
    path: "/achievements",
  },
};

export function pageUrl(path = "/"): string {
  const base = SEO.siteUrl.replace(/\/$/, "");
  return path === "/" ? `${base}/` : `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
