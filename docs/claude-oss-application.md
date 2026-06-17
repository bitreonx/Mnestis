# Claude for Open Source — Application Brief

> **Apply:** [claude.com/contact-sales/claude-for-oss](https://claude.com/contact-sales/claude-for-oss)  
> **Track:** Ecosystem Impact (we do not yet meet 5,000★ / 1M npm downloads)  
> **Deadline:** June 30, 2026 · rolling review · 10,000 spots  
> **Repo:** https://github.com/bitreonx/mnemos

Copy the **Project impact statement** below into the application form (under 500 words).

---

## Project impact statement (paste into form)

**Mnemos — the memory layer for software**

Mnemos is an MIT-licensed, local-first tool that turns any codebase into structured architecture intelligence that humans and AI agents can consume without grepping random files. One command (`npx mnemos .`) scans the repository, builds a dependency graph, discovers domains, capabilities, and user journeys, and writes a versioned memory bundle to `.mnemos/`.

**Why this matters for the Claude ecosystem**

Claude Code and Claude Desktop users hit the same wall: agents read files one at a time, burn context on noise, and miss cross-cutting architecture. Mnemos is built specifically to fix that for Claude-first workflows:

- **`mnemos setup --platform claude`** installs `.claude/skills/mnemos/SKILL.md` and appends repository context to `CLAUDE.md`
- **AI Pack v1** — a stable JSON contract (`mnemos pack`) with score, issues, graph, flows, and copy-ready repair prompts
- **MCP server** (`mnemos mcp`) — 15 tools and 11 resources so Claude Code queries architecture instead of raw filesystem search
- **`mnemos serve`** — local REST at `localhost:4000/copilot/pack/:repoId` for HTTP-based agent context
- **`mnemos wrap`** — RTK-style token compression for command output fed back to agents
- **`mnemos sync`** — codegraph-style incremental graph rebuild on file changes

We are not a hosted service. No API keys. No telemetry. Everything runs on the developer's machine — aligned with how Claude Code users work today.

**What is already shipped (technical substance, not slides)**

- Polyglot scanner (50+ languages), incremental graph patching, architecture smells, health scoring, AI readiness scoring
- Reproducible benchmark suite (`mnemos-bench`) with regression and blind eval fixtures
- Production-ready **HTML report** (dashboard-aligned design tokens, Vibe / AI / Coder reader modes)
- Polished **CLI** with structured terminal UX, artifact legend, and clear next steps
- React dashboard with three cockpits (Vibe / AI / Coder) — currently marked **preview** while we polish panels and layout
- GitHub Actions CI, CONTRIBUTING.md, SECURITY.md, AI Pack spec, MCP parity with REST via shared `MnemosRuntime`

**Where we are honest**

We are pre-launch. We do not have a large user base yet. The core engine, report, CLI, MCP, and AI Pack are real and working — we dogfood them on this repository. The interactive dashboard is the main surface still being refined. We are deliberately **not** running creator ads or growth campaigns until that polish is done.

**Why we are applying for Claude Max 20x**

We want to finish the dashboard and integration polish **using Claude Code on Mnemos itself** — the same workflow we ask our future users to adopt. Six months of Claude Max would let us:

1. Ship FAANG-grade dashboard UX (panels, scroll, dark mode, score clarity) with Claude Code as our daily driver
2. Harden Claude-specific integrations (skills, MCP, wrap presets for common dev commands)
3. Validate the full loop — build → AI Pack → Claude Code → ship — before we talk to vibecoders and web-builder creators

Mnemos exists to make Claude Code smarter about repositories. We need Claude Code to finish Mnemos. That is the virtuous cycle we want to prove before any marketing spend.

**Maintainer:** Primary maintainer with active commits on `main`, public MIT repo, open to community contributions.

Thank you for supporting open-source infrastructure that helps Claude users build better software with less token waste.

---

## Checklist before you submit

- [ ] GitHub username matches the account with **write/admin** on `bitreonx/mnemos`
- [ ] Recent activity visible (commits, releases, or PR reviews in last 3 months)
- [ ] Email is the one tied to your Claude account
- [ ] Repo is **public**
- [ ] You are 18+ and in a Claude-supported country

## Links to attach or mention

| Asset | URL |
|-------|-----|
| Repository | https://github.com/bitreonx/mnemos |
| AI Pack spec | https://github.com/bitreonx/mnemos/blob/main/docs/ai-pack.md |
| Architecture | https://github.com/bitreonx/mnemos/blob/main/docs/architecture.md |
| Contributing | https://github.com/bitreonx/mnemos/blob/main/CONTRIBUTING.md |
| Roadmap | https://github.com/bitreonx/mnemos/blob/main/docs/roadmap.md |

## After approval

1. Activate Claude Max from the email link before June 30, 2026
2. Run `npx mnemos . && mnemos setup --platform claude` in Mnemos and your other repos
3. Use Claude Code daily on dashboard polish issues tagged `[dashboard]`

---

*Last updated: June 2026*
