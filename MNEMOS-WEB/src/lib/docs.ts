/** Structured documentation content. Rendered by pages/Docs.tsx. */

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "code"; lang?: string; code: string }
  | { type: "list"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "callout"; tone?: "info" | "tip" | "warn"; title: string; text: string }
  | { type: "cards"; items: { title: string; desc: string }[] };

export type DocPage = {
  slug: string;
  title: string;
  description: string;
  blocks: Block[];
};

export type DocGroup = { title: string; pages: DocPage[] };

export const DOCS: DocGroup[] = [
  {
    title: "Getting Started",
    pages: [
      {
        slug: "introduction",
        title: "Introduction",
        description: "Give AI a memory of your codebase.",
        blocks: [
          { type: "p", text: "**Mnemos** is the memory layer for software. One command turns a codebase into architecture intelligence that humans and AI can use immediately — no cloud, no API keys, no guesswork." },
          { type: "code", lang: "bash", code: "npx mnemos ." },
          { type: "callout", tone: "tip", title: "Local-first by design", text: "Mnemos runs entirely on your machine. No telemetry, no required network calls, no source code ever leaves your environment." },
          { type: "h2", text: "What is Mnemos" },
          { type: "p", text: "Mnemos scans your repository, builds a dependency graph, discovers domains, capabilities, and user journeys, then writes structured memory to `.mnemos/`. It produces a dashboard, a shareable HTML report, and AI Pack v1 — a versioned JSON contract that agents can reason from without ever opening the UI." },
          { type: "h2", text: "Why Mnemos" },
          { type: "p", text: "AI coding tools and new teammates fail the same way: they grep random files instead of reading architecture. Mnemos gives every consumer the same ground truth — once, locally, on every build." },
          { type: "cards", items: [
            { title: "Vibecoders", desc: "Get the product story — journeys and capabilities without raw JSON." },
            { title: "AI orchestrators", desc: "Feed Claude, Cursor, or Codex a stable, structured context contract." },
            { title: "Developers", desc: "Architecture, smells, and copy-ready repair context in one cockpit." },
          ]},
          { type: "h2", text: "Four artifacts, one build" },
          { type: "p", text: "Every `npx mnemos .` run produces the same intelligence in four shapes, so you always have the right surface for the job." },
          { type: "table", head: ["Artifact", "You get", "Best for"], rows: [
            ["Terminal", "`.mnemos/` memory written locally", "CI, first scan, refreshing DNA"],
            ["Dashboard", "Interactive Vibe · AI · Coder cockpits", "Exploration, score drill-down"],
            ["Report", "Standalone `report/index.html`", "Stakeholder demos, async review"],
            ["AI JSON", "AI Pack v1 over copy, HTTP, or MCP", "Claude, Cursor, Codex — no UI"],
          ]},
        ],
      },
      {
        slug: "how-it-works",
        title: "How it works",
        description: "From source files to structured intelligence.",
        blocks: [
          { type: "p", text: "Mnemos transforms a codebase into structured intelligence through a local-first pipeline: ingest, analyze, output." },
          { type: "h2", text: "1 · Ingest" },
          { type: "p", text: "The scanner walks your filesystem (respecting `.gitignore`), detects 52 languages, and feeds files through a lexical parser that extracts imports, symbols, calls, and exports. These become nodes and edges in an in-memory knowledge graph." },
          { type: "h2", text: "2 · Analyze" },
          { type: "p", text: "Analyzers run over the graph to discover the things that matter:" },
          { type: "list", items: [
            "**Domains** — business boundaries from directory structure and imports",
            "**Capabilities** — product features inferred from routes, handlers, and naming",
            "**Journeys** — user-facing flows from entry points to outcomes",
            "**Flows** — execution paths through the call graph",
            "**Smells** — architecture anti-patterns like god modules and circular deps",
            "**Heatmap** — per-domain risk scoring",
            "**AI readiness** — six dimensions of agent-friendliness",
          ]},
          { type: "h2", text: "3 · Output" },
          { type: "p", text: "Everything is written to `.mnemos/`. All outputs call the same `buildAiPack` builder, so the dashboard, report, AI Pack, and MCP server share a single source of truth." },
          { type: "code", lang: "bash", code: "npx mnemos .            # writes .mnemos/\nnpx mnemos ui           # dashboard at localhost:5173\nnpx mnemos pack --pretty # print AI Pack v1" },
        ],
      },
    ],
  },
  {
    title: "Core",
    pages: [
      {
        slug: "repository-dna",
        title: "Repository DNA",
        description: "A compressed, queryable fingerprint of your codebase.",
        blocks: [
          { type: "p", text: "Repository DNA is a compressed fingerprint of the whole codebase — typically a few kilobytes. It's written to `.mnemos/project.dna.json` and is the first thing any agent should read. `@`-mention it before anything else." },
          { type: "h2", text: "What's inside" },
          { type: "cards", items: [
            { title: "Domains", desc: "Business boundaries derived from structure and imports." },
            { title: "Flows", desc: "Execution paths traced through the call graph." },
            { title: "Capabilities", desc: "Features inferred from routes, handlers, and naming." },
            { title: "Critical Paths", desc: "The routes that carry the most architectural weight." },
            { title: "AI Readiness", desc: "Six dimensions scoring how agent-friendly the repo is." },
          ]},
          { type: "h2", text: "Reading it" },
          { type: "code", lang: "bash", code: "npx mnemos dna --pretty\ncat .mnemos/project.dna.json | jq .summary" },
          { type: "callout", tone: "info", title: "Why DNA first?", text: "Pointing an agent at DNA before raw files cuts token usage dramatically while giving it the architecture it would otherwise have to reconstruct by guessing." },
        ],
      },
      {
        slug: "architecture",
        title: "Architecture",
        description: "The Mnemos pipeline and package layout.",
        blocks: [
          { type: "p", text: "Mnemos is organized into three packages around a single shared runtime." },
          { type: "table", head: ["Package", "Role"], rows: [
            ["`@mnemos/core`", "Scanner, analyzer, memory, AI Pack, report, serve, MCP"],
            ["`@mnemos/cli`", "The `mnemos` command-line interface"],
            ["`@mnemos/ui`", "Vite + React dashboard"],
          ]},
          { type: "h2", text: "The scanner" },
          { type: "p", text: "Walks the repository, detects 52 languages via glob + basename rules and `inferLanguage`, isolates scripts from Vue/Svelte single-file components, and builds a code mask so imports, symbols, and call sites are validated against real code — not comments or strings." },
          { type: "h2", text: "Memory files" },
          { type: "table", head: ["File", "Purpose"], rows: [
            ["`memory.json`", "Full memory model"],
            ["`project.dna.json`", "Compressed DNA — read this first"],
            ["`agent_context.json`", "Machine-optimized bundle"],
            ["`graph.json`", "Dependency graph for visualization"],
            ["`health-score.json`", "Five-dimension health score"],
            ["`context/*.md`", "Human-readable docs with Mermaid graphs"],
          ]},
          { type: "h2", text: "Design principles" },
          { type: "list", items: [
            "**Local-first** — no telemetry, no cloud, no required API keys",
            "**Single source of truth** — one AI Pack builder, one runtime",
            "**Modes are routes** — `/vibe/…`, `/ai/…`, `/coder/…`",
            "**Graphs in markdown** — every context doc ships Mermaid for humans and agents",
          ]},
        ],
      },
      {
        slug: "concepts",
        title: "Concepts",
        description: "Domains, flows, capabilities, and smells.",
        blocks: [
          { type: "p", text: "Mnemos models a codebase through a small set of durable concepts. Each is derived automatically and surfaced across every artifact." },
          { type: "h2", text: "Domains" },
          { type: "p", text: "Business boundaries inferred from directory structure and import relationships. Domains answer \"what are the major areas of this system?\" — auth, billing, catalog, orders, and so on." },
          { type: "h2", text: "Flows" },
          { type: "p", text: "Execution paths through the call graph, from an entry point to its outcome. Flows reveal how a request actually moves through the system, not just how files import each other." },
          { type: "h2", text: "Capabilities" },
          { type: "p", text: "Product features inferred from routes, handlers, and naming. Capabilities are the story behind the code — the things the product can do, expressed in plain language." },
          { type: "h2", text: "Smells" },
          { type: "p", text: "Architecture anti-patterns detected on the graph." },
          { type: "list", items: [
            "**God modules** — files that everything depends on",
            "**Circular dependencies** — cycles that make change risky",
            "**Orphan code** — modules with no inbound edges",
            "**Hotspots** — high-churn, high-fan-in files",
          ]},
          { type: "h2", text: "Repository memory" },
          { type: "p", text: "All of the above is persisted to `.mnemos/` after each build, so memory is stable across runs and diffable in version control." },
        ],
      },
      {
        slug: "impact-analysis",
        title: "Impact Analysis",
        description: "Trace the blast radius of any change.",
        blocks: [
          { type: "p", text: "Impact analysis traces the blast radius of a change across the dependency graph — before you touch a line. Ask \"what breaks if I change this file?\" and get a ranked answer." },
          { type: "code", lang: "bash", code: "npx mnemos impact src/auth/session.ts" },
          { type: "p", text: "Mnemos walks inbound and outbound edges to compute everything reachable from the target, ranks affected modules by distance and fan-in, and highlights any critical paths or domains in the radius." },
          { type: "callout", tone: "tip", title: "Agent recipe", text: "Run impact analysis as a pre-flight check and paste the result into your agent's prompt before asking it to refactor — it keeps changes scoped and prevents surprise regressions." },
        ],
      },
      {
        slug: "ai-context",
        title: "AI Context",
        description: "AI Pack v1 — a versioned contract for agents.",
        blocks: [
          { type: "p", text: "AI Pack v1 is a single versioned JSON contract built once in `@mnemos/core` and used by the UI, CLI, serve, and report. It's the canonical way to hand context to an agent." },
          { type: "h2", text: "Get the pack" },
          { type: "code", lang: "bash", code: "# print a section\nnpx mnemos pack --section=summary --mode=ai\n\n# write to a file\nnpx mnemos pack --section=issues -o .mnemos/ai-pack.json\n\n# serve over HTTP\nnpx mnemos serve\ncurl -s localhost:4000/copilot/pack/local?section=score | jq .version" },
          { type: "h2", text: "Three ways to consume it" },
          { type: "list", items: [
            "Paste `npx mnemos pack --section=summary --mode=ai` output into your agent",
            "Point the agent at `http://localhost:4000/copilot/pack/local`",
            "Open `http://localhost:5173/json/local` and click **Copy AI Pack v1**",
          ]},
          { type: "h2", text: "MCP server" },
          { type: "p", text: "`mnemos mcp` exposes 15 tools and 11 resources over the Model Context Protocol, so IDE agents get the same ground truth with protocol parity to the REST API." },
          { type: "code", lang: "text", code: "query_graph · get_dna · explain_repo · onboard · get_node\nget_neighbors · shortest_path · impact_analysis · list_domains\nlist_flows · list_capabilities · search · get_health\nreview_diff · refresh_memory" },
        ],
      },
    ],
  },
  {
    title: "Reference",
    pages: [
      {
        slug: "cli",
        title: "CLI Reference",
        description: "Every Mnemos command.",
        blocks: [
          { type: "p", text: "The `mnemos` CLI is the primary entry point. Run `mnemos --help` for the full flag list." },
          { type: "table", head: ["Command", "Description"], rows: [
            ["`mnemos .` / `mnemos build`", "Analyze repo, write `.mnemos/`"],
            ["`mnemos ui`", "Launch dashboard at localhost:5173"],
            ["`mnemos serve`", "REST API at localhost:4000"],
            ["`mnemos mcp`", "MCP stdio server for IDEs"],
            ["`mnemos pack`", "Print AI Pack v1 (`--section`, `--mode`, `-o`)"],
            ["`mnemos report`", "Generate `report/index.html`"],
            ["`mnemos explain`", "Plain-language repo summary"],
            ["`mnemos dna`", "Print compressed Repository DNA"],
            ["`mnemos flows`", "List execution flows"],
            ["`mnemos impact`", "Blast-radius analysis"],
            ["`mnemos inspect`", "Inspect a node, file, or domain"],
            ["`mnemos export-context`", "Write `context/*.md` with graphs"],
            ["`mnemos ask \"…\"`", "Architecture copilot"],
            ["`mnemos setup`", "Install AGENTS.md + Cursor rules"],
            ["`mnemos score`", "Health-score breakdown"],
          ]},
          { type: "h3", text: "mnemos build" },
          { type: "p", text: "The default command. Scans the target directory and writes the full memory set to `.mnemos/`." },
          { type: "code", lang: "bash", code: "npx mnemos .            # current directory\nnpx mnemos ../my-app    # another path" },
          { type: "h3", text: "mnemos export-context" },
          { type: "p", text: "Writes human-readable Markdown with embedded Mermaid diagrams to `.mnemos/context/` — architecture, domains, flows, dependencies, critical paths, smells, and more." },
          { type: "callout", tone: "info", title: "Expected outputs", text: "After a build you'll find project.dna.json, memory.json, agent_context.json, graph.json, health-score.json, and context/*.md in .mnemos/." },
        ],
      },
      {
        slug: "modes",
        title: "Modes",
        description: "Vibe, Developer, and AI Agent cockpits.",
        blocks: [
          { type: "p", text: "Mnemos ships three first-class cockpits. **Mode is a route**, not a toggle — the URL is canonical and persisted in `localStorage`." },
          { type: "table", head: ["Mode", "Route", "For"], rows: [
            ["Vibe", "`/vibe/:repoId/story`", "Vibecoders, PMs, founders"],
            ["AI Agent", "`/ai/:repoId/home`", "Claude, Cursor, Codex users"],
            ["Developer", "`/coder/:repoId/overview`", "Human developers"],
          ]},
          { type: "h2", text: "Vibe Mode" },
          { type: "p", text: "Friendly explanations, user journeys, capabilities, and health at a glance. No raw JSON, no intimidating graphs. Feels like Duolingo crossed with Notion." },
          { type: "h2", text: "Developer Mode" },
          { type: "p", text: "Full architecture, flows, code map, history, and copilot. Keyboard-first and built for shipping. Feels like Linear." },
          { type: "h2", text: "AI Agent Mode" },
          { type: "p", text: "AI Pack v1, repair cards, and verify/bench commands — agent-first. No code map or file tree. Feels like Cursor." },
          { type: "h3", text: "Deep links" },
          { type: "code", lang: "text", code: "http://localhost:5173/vibe/local/story\nhttp://localhost:5173/ai/local/repairs\nhttp://localhost:5173/coder/local/architecture\nhttp://localhost:5173/json/local?section=issues" },
        ],
      },
    ],
  },
  {
    title: "Proof",
    pages: [
      {
        slug: "benchmarks",
        title: "Benchmarks",
        description: "Reproducible numbers from real repositories.",
        blocks: [
          { type: "p", text: "Headline numbers come from `mnemos-bench/` and are reproducible locally." },
          { type: "code", lang: "bash", code: "npm run bench:regression   # fixture regression\nnpm run bench:express      # Express app fixture\nnpm run bench:ai-eval      # AI blind eval" },
          { type: "h2", text: "Small repositories" },
          { type: "p", text: "On a typical Express service, Mnemos surfaces domains, routes, and flows in seconds — small enough that the entire AI Pack fits comfortably in a single prompt." },
          { type: "h2", text: "Large repositories" },
          { type: "p", text: "On large monorepos (tens of thousands of files), Mnemos compresses the architecture into a few kilobytes of DNA, saving the bulk of the tokens an agent would otherwise spend reconstructing structure." },
          { type: "table", head: ["Repo", "Files", "Domains", "Flows"], rows: [
            ["VS Code", "~14,000", "31", "268"],
            ["Next.js", "~6,800", "22", "190"],
            ["Express", "~180", "6", "24"],
          ]},
          { type: "callout", tone: "warn", title: "Numbers are illustrative", text: "Exact figures vary by repo and version. Run the bench suite on your own code for grounded results." },
          { type: "h2", text: "Performance" },
          { type: "p", text: "Mnemos is built for repeated CI runs: parallel loading of memory, graph, and a BM25 search index, with typed responses and actionable errors. Builds are incremental-friendly and cache-aware." },
        ],
      },
      {
        slug: "examples",
        title: "Examples",
        description: "Real outputs, beautifully formatted.",
        blocks: [
          { type: "p", text: "A taste of what Mnemos produces. These are real shapes from the AI Pack and context docs." },
          { type: "h2", text: "AI Pack summary" },
          { type: "code", lang: "json", code: "{\n  \"version\": \"1.0.0\",\n  \"repo\": \"local\",\n  \"summary\": {\n    \"domains\": 31,\n    \"flows\": 268,\n    \"capabilities\": 47,\n    \"score\": 92\n  },\n  \"issues\": [\n    { \"type\": \"circular_dependency\", \"severity\": \"high\",\n      \"members\": [\"auth\", \"billing\"] }\n  ]\n}" },
          { type: "h2", text: "Explain output" },
          { type: "code", lang: "text", code: "$ npx mnemos explain\n\nThis is a commerce platform. Users browse a catalog,\nbuild a cart, and check out. Orders are fulfilled by a\nbackground worker; payments run through the billing\ndomain. Health: Excellent (92). 2 smells worth a look." },
          { type: "h2", text: "Flows" },
          { type: "code", lang: "text", code: "$ npx mnemos flows\n\n1. Checkout      cart → payment → order → receipt\n2. Sign in       login → session → redirect\n3. Refund        order → billing → ledger → notify" },
          { type: "callout", tone: "tip", title: "Try it on your repo", text: "Run npx mnemos . then npx mnemos ui to explore your own outputs in the dashboard." },
        ],
      },
    ],
  },
];

export const ALL_DOC_PAGES: DocPage[] = DOCS.flatMap((g) => g.pages);

export function findDoc(slug?: string): DocPage {
  return ALL_DOC_PAGES.find((p) => p.slug === slug) ?? ALL_DOC_PAGES[0];
}
