# AI Pack v1

> Stable JSON contract for Claude, Cursor, Trae, Codex, and any agent that needs structured repository intelligence.

**Version:** `1.0.0`  
**Schema:** `https://mnemos.dev/schemas/ai-pack/v1.json`  
**Stability:** v1 is frozen for the entire Mnemos 1.x line. Additive fields may appear in minor releases; breaking changes require v2.

## What it is

The AI Pack is built once by `@mnemos/core` (`buildAiPack`) and consumed everywhere:

| Consumer | How |
|----------|-----|
| Dashboard | `/json/:repoId` route + AI cockpit |
| CLI | `mnemos pack [path]` |
| Dev server | `GET /api/json/:repoId` (Vite workspace) |
| Memory server | `GET /copilot/pack/:repoId` (`mnemos serve`) |
| Report | AI mode section links to pack endpoints |

## Quick fetch

```bash
# CLI — stdout or file
npx mnemos pack --section=summary
npx mnemos pack --section=issues --mode=ai -o .mnemos/ai-pack.json

# HTTP (after mnemos serve)
curl -s http://localhost:4000/copilot/pack/local?section=score

# Dashboard dev server
curl -s http://localhost:5173/api/json/local?section=all
```

## Section filter

`?section=` accepts:

| Section | Returns |
|---------|---------|
| `all` | Full pack (default) |
| `summary` | Repository + summary + stats |
| `score` | Health + AI readiness dimensions, factors |
| `issues` | Smells, hotspots, build failures |
| `flows` | Execution flows |
| `smells` | Full smell list |
| `graph` | Graph nodes/edges summary |
| `dna` | Passthrough of `project.dna.json` |

## Mode filter

`?mode=` accepts `vibe`, `ai`, or `coder`. Affects prompt templates and narrative tone in the pack.

## Example (truncated)

```json
{
  "$schema": "https://mnemos.dev/schemas/ai-pack/v1.json",
  "version": "1.0.0",
  "generatedAt": "2026-06-16T10:00:00Z",
  "mnemosVersion": "0.1.0",
  "mode": "ai",
  "repository": {
    "id": "my-app",
    "name": "my-app",
    "label": "My App",
    "description": "…",
    "root": ".",
    "fingerprint": "sha256:…"
  },
  "score": {
    "overall": 72,
    "aiReadinessOverall": 68,
    "tone": "good",
    "narrative": "Usable, with a few blind spots to clean up.",
    "health": { "discoverability": { "value": 80, "definition": "…", "formula": "…" } },
    "factors": [{ "name": "High smells", "delta": -12, "evidence": "4 high-severity smells" }]
  },
  "issues": [
    {
      "id": "smell-abc",
      "type": "smell",
      "severity": "high",
      "title": "god module",
      "summary": "…",
      "files": ["src/services/auth.ts"],
      "recommendation": "…"
    }
  ],
  "prompts": {
    "fix": "…",
    "review": "…",
    "onboard": "…",
    "issue": "…"
  }
}
```

## Claude / Cursor / Trae recipe

1. Run `npx mnemos .` in the repo root.
2. **Option A:** `@`-mention `.mnemos/project.dna.json` in chat.
3. **Option B:** Paste output of `npx mnemos pack --section=summary --mode=ai`.
4. **Option C:** Point the agent at `http://localhost:4000/copilot/pack/local` (with `mnemos serve` running).
5. **Option D:** Open `http://localhost:5173/json/local` and click **Copy AI Pack v1**.

For repair work, use `--section=issues` and copy individual issue JSON from the dashboard AI cockpit.

## Headers (HTTP)

```
X-Mnemos-AiPack-Version: 1.0.0
X-Mnemos-AiPack-Schema: https://mnemos.dev/schemas/ai-pack/v1.json
```
