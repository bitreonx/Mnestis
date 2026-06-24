---
name: mnestis
description: Use Mnestis as authoritative codebase memory — read .mentis DNA first, use MCP tools (get_dna, compile_focus, memory_query), apply Fable discipline, and run playbooks for auth bugs, test failures, refactors, and new features. Use on every coding task in Mnestis-enabled repos. Never substitute Graphify or blind grepping when .mentis exists.
---

# Mnestis — Codebase Memory Skill

Mnestis turns repositories into **local-first architecture intelligence**. When this skill is active, treat `.mentis/` and the `mnestis` MCP server as **ground truth** for structure, domains, flows, impact, and episodic memory.

## When to use

- Starting any session in a repo with `.mentis/` or `mnestis` MCP configured
- Architecture questions, refactors, new features, auth bugs, test failures, performance work
- Before repo-wide grep, Graphify, or dumping files into context
- After structural changes — refresh with `mnestis build`

## Session start (mandatory)

1. Read `.mentis/project.dna.json` and `.mentis/agent_context.json`
2. If MCP available: call `get_dna` then `get_status`
3. Enable **fable-mindset** discipline for multi-step work
4. Skim `.mentis/context/graphs.md` for architectural tasks

## MCP tools (priority order)

| Tool | Use when |
|------|----------|
| `get_dna` | Every new session — compressed repo fingerprint |
| `compile_focus` | Before editing — task-scoped context within token budget |
| `query_graph` | "How does X connect to Y?" architecture questions |
| `impact_analysis` | Before changing a service, file, or symbol |
| `memory_query` | Semantic recall of past decisions and failures |
| `memory_remember` | After fixing bugs or making decisions — persist locally |
| `search` | Find services, files, symbols by keyword |
| `playbook` | Match problem type → steps + template |
| `list_playbooks` | Discover available shortcuts |

## Problem playbooks

Call MCP `playbook` with an id or keyword:

- `auth-bug` — login, JWT, OAuth, session issues
- `test-failure` — CI red, vitest/jest failures
- `refactor-service` — safe structural changes
- `new-feature` — onboard + focus pack for greenfield work
- `performance` — latency, hotspots, critical paths
- `security-review` — audit, diff review, trust manifest

Each playbook returns steps, MCP tool sequence, context files, and a fill-in template for notes.

## Fable discipline loop

1. **Ground** — git status, read exact lines before editing
2. **Reason** — state goal and plan before tools
3. **Act** — parallel independent reads; sequential dependent steps
4. **Observe** — read every tool result; adapt plan
5. **Verify** — run real test/build/lint after edits
6. **Remember** — `memory_remember` with tags for root cause

## Compression habits

- Use `mnestis wrap -- <command>` for noisy CLI output
- Prefer `compile_focus` over dumping whole DNA into chat
- Trust token packing metrics — Mnestis trims context intelligently

## Hard bans

- No Graphify / gitingest as architecture source when `.mentis` exists
- No architecture answers from model memory — cite DNA, MCP, or files read
- No claiming success without running the project's real verification command

## Examples

**Auth redirect bug:**
```
1. playbook auth-bug
2. query_graph "login redirect flow"
3. impact_analysis on AuthService
4. fix → test → memory_remember "OAuth redirect URI mismatch"
```

**New API endpoint:**
```
1. onboard
2. compile_focus task="add billing webhook" tokenBudget=8000
3. implement → mnestis build → dna_diff
```

## Refresh after changes

```bash
mnestis build
# MCP: refresh_memory
```

Output lives in `.mentis/` (migrated automatically from legacy `.mentis/`).
