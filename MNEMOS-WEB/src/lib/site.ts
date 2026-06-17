/** Single source of truth for site-wide constants and homepage content. */

export const SITE = {
  name: "Mnemos",
  tagline: "Give AI a memory of your codebase.",
  description:
    "Mnemos transforms repositories into understanding. Humans and AI instantly grasp architecture, flows, domains, APIs, and business capabilities.",
  github: "https://github.com/bitreonx/mnemos",
  avatar: "https://avatars.githubusercontent.com/u/207326426?v=4",
  author: "bitreonx",
  authorByline: "by bitreonx",
  authorTitle: "Mnemos Creator",
  install: "npx mnemos .",
} as const;

export const NAV_LINKS = [
  { label: "Why Mnemos", href: "#why" },
  { label: "Modes", href: "#modes" },
  { label: "Benchmarks", href: "#benchmarks" },
  { label: "Compare", href: "#compare" },
  { label: "Docs", href: "/docs", route: true },
] as const;

/** Tools referenced as part of the AI-developer ecosystem (illustrative only). */
export const AI_TOOLS = [
  "Claude",
  "Cursor",
  "Codex",
  "OpenHands",
  "Gemini",
  "Kiro",
] as const;

export const WHY_CARDS = [
  {
    key: "architecture",
    title: "Architecture Understanding",
    desc: "See systems, layers, and boundaries the moment you open a repo — no spelunking through folders.",
    accent: "var(--brand)",
  },
  {
    key: "dna",
    title: "Repository DNA",
    desc: "A compressed, queryable fingerprint of the whole codebase. The first thing any agent should read.",
    accent: "var(--cyan)",
  },
  {
    key: "context",
    title: "AI Context",
    desc: "A versioned JSON contract agents reason from — same ground truth over HTTP, MCP, or copy-paste.",
    accent: "var(--brand)",
  },
  {
    key: "impact",
    title: "Impact Analysis",
    desc: "Trace the blast radius of any change across the dependency graph before you touch a line.",
    accent: "var(--mint)",
  },
  {
    key: "capabilities",
    title: "Business Capabilities",
    desc: "Product features inferred from routes, handlers, and naming — the story behind the code.",
    accent: "var(--cyan)",
  },
  {
    key: "flows",
    title: "Flows & Journeys",
    desc: "Execution paths and user journeys mapped from entry points to outcomes, automatically.",
    accent: "var(--brand)",
  },
] as const;

export const DNA_STRANDS = [
  { label: "Domains", value: "Business boundaries from structure & imports", color: "var(--brand)" },
  { label: "Flows", value: "Execution paths through the call graph", color: "var(--cyan)" },
  { label: "Capabilities", value: "Features inferred from routes & handlers", color: "var(--lilac)" },
  { label: "Critical Paths", value: "The routes that carry the most weight", color: "var(--mint)" },
  { label: "AI Readiness", value: "Six dimensions of agent-friendliness", color: "var(--brand)" },
] as const;

export const MODES = [
  {
    id: "vibe",
    label: "Vibe Mode",
    audience: "Vibecoders · PMs · Founders",
    feel: "Duolingo × Notion",
    tagline: "The product story, in plain language.",
    points: [
      "Friendly explanations of what the product does",
      "User journeys & capabilities at a glance",
      "Health, momentum, and shareable links",
      "No raw JSON. No intimidating graphs.",
    ],
    color: "var(--brand)",
  },
  {
    id: "coder",
    label: "Developer Mode",
    audience: "Human developers",
    feel: "Linear",
    tagline: "The full technical architecture.",
    points: [
      "Systems, domains, and dependency graphs",
      "Execution flows & code map",
      "Smells, risk heatmap, and history",
      "Keyboard-first, built for shipping.",
    ],
    color: "var(--cyan)",
  },
  {
    id: "ai",
    label: "AI Agent Mode",
    audience: "Claude · Cursor · Codex",
    feel: "Cursor",
    tagline: "Optimized machine context.",
    points: [
      "AI Pack v1 — a stable, versioned contract",
      "Repair cards & verify commands",
      "Served over HTTP or MCP",
      "Everything an agent needs, nothing it doesn't.",
    ],
    color: "var(--lilac)",
  },
] as const;

export const BENCHMARKS = [
  { label: "Files analyzed", value: 14213, suffix: "", hint: "per large-repo build" },
  { label: "Flows discovered", value: 268, suffix: "", hint: "execution paths mapped" },
  { label: "Domains", value: 31, suffix: "", hint: "business boundaries" },
  { label: "APIs surfaced", value: 412, suffix: "", hint: "routes & handlers" },
  { label: "Tokens saved", value: 94, suffix: "%", hint: "vs. raw file dumps" },
  { label: "Time saved", value: 9.6, suffix: "h", hint: "onboarding per dev" },
] as const;

export const COMPARISON = {
  rows: [
    { feature: "Architecture & domains", mnemos: true, graphify: "partial", gitingest: false, madge: false },
    { feature: "Execution flows & journeys", mnemos: true, graphify: "partial", gitingest: false, madge: false },
    { feature: "Business capabilities", mnemos: true, graphify: false, gitingest: false, madge: false },
    { feature: "Dependency graph", mnemos: true, graphify: true, gitingest: false, madge: true },
    { feature: "AI Pack (versioned JSON)", mnemos: true, graphify: false, gitingest: "partial", madge: false },
    { feature: "MCP server for IDEs", mnemos: true, graphify: false, gitingest: false, madge: false },
    { feature: "Impact / blast radius", mnemos: true, graphify: "partial", gitingest: false, madge: "partial" },
    { feature: "Local-first, no cloud", mnemos: true, graphify: true, gitingest: true, madge: true },
    { feature: "Shareable HTML report", mnemos: true, graphify: false, gitingest: false, madge: false },
  ],
  cols: ["Mnemos", "Graphify", "gitingest", "Madge"],
} as const;

export const CHAT_LINES = [
  "Welcome to Mnemos.",
  "Explore the memory layer for software.",
  "Don't let your code be forgotten.",
] as const;
