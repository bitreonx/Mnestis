# Mnemos Modes

Mnemos ships three first-class cockpits. **Mode is a route**, not a toggle — the URL is canonical and persisted in `localStorage` as `mnemos.mode`.

## The three modes

| Mode | Route | Audience | What you get |
|------|-------|----------|--------------|
| **Vibe** | `/vibe/:repoId/story` | Vibecoders, PMs, founders, designers | Product story, journeys, capabilities, health at a glance, share links. **No raw JSON or graphs.** |
| **AI** | `/ai/:repoId/home` | Claude, Cursor, Trae, Codex orchestrators | AI Pack v1 contract, JSON viewer, repair cards, verify/bench commands. **No code map or file tree.** |
| **Coder** | `/coder/:repoId/overview` | Human developers using AI as a sidekick | Full architecture, flows, code map, history, copilot. Keyboard-first. |

## When to switch

- **Exploring what the product does?** → Vibe
- **Handing context to an agent?** → AI
- **Shipping code and need architecture + smells?** → Coder

Switch via the top pill (`Vibe | AI | Coder`) or keyboard:

| Key | Action |
|-----|--------|
| `⌘/Ctrl + K` | Command palette |
| `1` / `2` / `3` | Switch to Vibe / AI / Coder (when shortcuts wired) |

## Dashboard vs Report vs AI JSON

Every cockpit shows **“What am I looking at?”**:

| Artifact | What it is | Best for |
|----------|------------|----------|
| **Dashboard** | Live React app at `mnemos ui` | Interactive exploration, comparison, score drill-down |
| **Report** | Static `report/index.html` | Async review, demos, stakeholders without dev tools |
| **AI JSON** | AI Pack v1 at `/json/:repoId` | Copy-paste into Claude, Cursor, Trae |

The report supports the same three reader modes via `?mode=vibe|ai|coder`.

## Deep links

```
http://localhost:5173/vibe/local/story
http://localhost:5173/ai/local/repairs
http://localhost:5173/coder/local/architecture
http://localhost:5173/json/local?section=issues
```
