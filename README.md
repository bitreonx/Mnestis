# Mnemos

**The memory layer for software.** One command turns a codebase into architecture intelligence that humans and AI can use immediately.

[![License: MIT](https://img.shields.io/badge/License-MIT-3ecf8e.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-6366f1.svg)](package.json)
[![AI Pack](https://img.shields.io/badge/AI%20Pack-v1.0.0-f59e0b.svg)](docs/ai-pack.md)

[Documentation](docs/architecture.md) · [Graphs](docs/GRAPHS.md) · [Languages](docs/LANGUAGES.md) · [AI Pack v1](docs/ai-pack.md) · [Modes](docs/modes.md) · [Benchmarks](mnemos-bench/) · [Contributing](docs/contributing.md)

```bash
npx mnemos .
```

Local-first. No cloud. No API keys. No guesswork.

---

## The 30-second pitch

**What:** Mnemos scans your repository, builds a dependency graph, discovers domains, capabilities, and user journeys, then writes structured memory to `.mnemos/`. It produces a dashboard, a shareable HTML report, and **AI Pack v1** — a versioned JSON contract agents can reason from without opening the UI.

**Why:** AI coding tools and new teammates both fail the same way: they grep random files instead of reading architecture. Mnemos gives every consumer the same ground truth — once, locally, on every build.

**Who:** Vibecoders who need the product story. AI orchestrators feeding Claude, Cursor, or Trae. Human developers who want architecture, smells, and copy-ready repair context in one cockpit.

---

## Showcase — four artifacts, one build

Every `npx mnemos .` run produces the same intelligence in four shapes. The legend **Dashboard · Report · AI JSON** appears in every chrome so you always know which one you are looking at.

<table>
  <tr>
    <td width="50%" align="center">
      <img src="packages/ui/public/assets/terminal-animated.svg" alt="Animated Mnemos terminal — scan a repo, build DNA, and generate snapshots" width="100%" />
      <br /><sub><b>Terminal → Memory</b> · one command writes DNA, agent context, an HTML report, and shareable SVG cards</sub>
    </td>
    <td width="50%" align="center">
      <img src="packages/ui/public/assets/results-animated.svg" alt="Benchmark results — Mnemos vs Graphify and Gitingest" width="100%" />
      <br /><sub><b>Verified results</b> · 80% task accuracy and 29× compression on real repos — not marketing slides</sub>
    </td>
  </tr>
</table>

These cards are produced by `mnemos snapshot` — drop them straight into a README or PR.

| | Artifact | You get | Best for |
|---|----------|---------|----------|
| 🖥️ | **Terminal** | `npx mnemos .` → `.mnemos/` memory | CI, first scan, refreshing DNA |
| 📊 | **Dashboard** | `mnemos ui` → `/vibe` · `/ai` · `/coder` cockpits | **Preview** — interactive exploration (community-driven) |
| 📄 | **Report** | `report/index.html` · `?mode=vibe\|ai\|coder` | **Stable** — stakeholder demos, async review, shareable HTML |
| 🤖 | **AI JSON** | `mnemos pack` · `/json/:repoId` · `/copilot/pack/:repoId` | Claude, Cursor, Trae — copy or HTTP, no UI required |

```bash
npx mnemos . && npx mnemos ui    # dashboard at localhost:5173
# report: .mnemos/report/index.html or report/index.html
npx mnemos pack --section=summary --pretty
```

---

## Quick start

```bash
# 1. Analyze the repo (writes .mnemos/)
npx mnemos .

# 2. Open the interactive dashboard
npx mnemos ui

# 3. Serve memory for agents (optional)
npx mnemos serve
# → http://localhost:4000/copilot/pack/local

# 4. Export AI Pack v1
npx mnemos pack --section=summary --pretty
```

**Expected outputs in `.mnemos/`:** `project.dna.json`, `memory.json`, `agent_context.json`, `context/*.md`, `report/index.html`

---

## Outputs at a glance

| Artifact | Command / URL | Audience | Use case |
|----------|---------------|----------|----------|
| **Dashboard** | `mnemos ui` → `localhost:5173` | You + team | **Preview** — interactive exploration (panels & layout in progress) |
| **Report** | `report/index.html` | Stakeholders | **Stable** — async review, demos, shareable HTML (`?mode=vibe\|ai\|coder`) |
| **AI JSON** | `mnemos pack` · `/json/:repoId` · `/copilot/pack/:repoId` | Claude, Cursor, Trae | Copy-paste structured context, repair prompts, score + issues |
| **DNA** | `.mnemos/project.dna.json` | Any agent | Compressed repo DNA — `@`-mention first |
| **MCP** | `mnemos mcp` | IDE agents | 15+ tools + 11 resources via Model Context Protocol |
| **Sync** | `mnemos sync` | CI + local dev | Codegraph-style auto-rebuild on file changes |
| **Wrap** | `mnemos wrap -- <cmd>` | AI agents | RTK-style token-compressed command output |

**Legend:** Every dashboard view and the report header show **Dashboard · Report · AI JSON** so you always know which artifact you are looking at.

---

## The three modes

Modes are **routes**, not toggles. The URL is canonical.

| Mode | Route | For | One-liner |
|------|-------|-----|-----------|
| **Vibe** | `/vibe/:repoId/story` | Vibecoders, PMs, founders | Product story, journeys, capabilities — no raw JSON |
| **AI** | `/ai/:repoId/home` | Claude, Cursor, Trae users | AI Pack v1, repairs, verify — agent-first |
| **Coder** | `/coder/:repoId/overview` | Human developers | Architecture, flows, code map, smells, copilot |

See [docs/modes.md](docs/modes.md) for deep links and keyboard map.

---

## Dashboard tour

| Section | Coder route | What it does |
|---------|-------------|--------------|
| Overview | `/coder/:id/overview` | Health score (explained), issues, quick navigation |
| Architecture | `/coder/:id/architecture` | Systems, domains, graph, smells |
| Flows | `/coder/:id/flows` | Execution paths + user journeys |
| Code Map | `/coder/:id/code` | File map + tech stack |
| History | `/coder/:id/history` | Build history, timeline, risk heatmap |
| AI Context | `/coder/:id/ai` | Copilot, context docs, JSON pack |

---

## AI Pack v1

Single versioned JSON contract built once in `@mnemos/core`, used by UI, CLI, serve, and report.

```bash
npx mnemos pack --section=issues --mode=ai -o .mnemos/ai-pack.json
curl -s localhost:4000/copilot/pack/local?section=score | jq .version
# → "1.0.0"
```

**Claude / Cursor / Trae recipe:**

1. Run `npx mnemos .`
2. Paste `npx mnemos pack --section=summary --mode=ai` output, **or**
3. Point the agent at `http://localhost:4000/copilot/pack/local`, **or**
4. Open `http://localhost:5173/json/local` and click **Copy AI Pack v1**

Full spec: [docs/ai-pack.md](docs/ai-pack.md)

---

## Verified benchmarks

Headline numbers from [mnemos-bench/](mnemos-bench/) — reproducible locally:

```bash
npm run bench:regression   # fixture regression
npm run bench:express      # Express app fixture
npm run bench:ai-eval      # AI blind eval
```

---

## Architecture

```mermaid
flowchart TB
  subgraph ingest [Ingest]
    SCAN[Scanner · 52 languages] --> PARSE[Lexical parser]
    PARSE --> GRAPH[Knowledge graph]
  end
  subgraph analyze [Analyze]
    GRAPH --> MEM[.mnemos/ memory]
  end
  subgraph output [Outputs]
    MEM --> UI[Dashboard]
    MEM --> RPT[Report]
    MEM --> PACK[AI Pack · MCP]
    MEM --> MD[context/*.md + graphs]
  end
```

Every build writes **Mermaid diagrams** into `.mnemos/context/` — see [docs/GRAPHS.md](docs/GRAPHS.md) for the full catalog and [docs/LANGUAGES.md](docs/LANGUAGES.md) for the 50-language parsing pipeline.

Details: [docs/architecture.md](docs/architecture.md)

---

## CLI reference

| Command | Description |
|---------|-------------|
| `mnemos .` / `mnemos build` | Analyze repo, write `.mnemos/` |
| `mnemos ui` | Launch dashboard (`localhost:5173`) |
| `mnemos serve` | REST API (`localhost:4000`) |
| `mnemos mcp` | MCP stdio server for IDEs |
| `mnemos pack` | Print AI Pack v1 (`--section`, `--mode`, `-o`) |
| `mnemos report` | Generate `report/index.html` (`--report-path report.html`) |
| `mnemos ask "…"` | Architecture copilot |
| `mnemos setup` | Install AGENTS.md + Cursor rules |
| `mnemos explain` | Plain-language repo summary |
| `mnemos score` | Health score breakdown |
| `mnemos flows` | List execution flows |
| `mnemos impact` | Blast radius analysis |

```bash
mnemos --help   # full flag list
```

---

## Shared runtime

`MnemosRuntime` in `packages/core` is the single source of truth for REST (`mnemos serve`) and MCP (`mnemos mcp`):

- Parallel load of memory, graph, and BM25 search index
- Typed `AgentEnvelope` responses
- Actionable errors (`NOT_BUILT`, `NOT_FOUND`, `GRAPH_UNAVAILABLE`)
- Protocol parity — same queries via HTTP or MCP

### MCP tools (15)

`query_graph` · `get_dna` · `explain_repo` · `onboard` · `get_node` · `get_neighbors` · `shortest_path` · `impact_analysis` · `list_domains` · `list_flows` · `list_capabilities` · `search` · `get_health` · `review_diff` · `refresh_memory`

---

## Contributing

See [docs/contributing.md](docs/contributing.md). PRs welcome.

## Roadmap

[docs/roadmap.md](docs/roadmap.md)

---

## License · Security · Code of Conduct

- [MIT](LICENSE)
- [Security policy](SECURITY.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
