# MNESTIS Release Codenames

Semver lives in `package.json` for npm only. **Code and CLI use codenames**, not "v2/v3".

## Product releases

| Semver | Codename | Meaning |
|--------|----------|---------|
| **0.2.0** | **Mneme** | The atomic unit of codebase memory — one build, one truth |
| **0.3.0** | **Mneme · Ariadne's Thread** | Navigate the **Labyrinth** — local hybrid memory on-device |

## Engine & contracts

| Component | Codename | Schema ID |
|-----------|----------|-----------|
| Memory Engine | **Labyrinth** | `MNESTIS/memory-engine/labyrinth` |
| Shared shards | **Constellation** | `MNESTIS/shared-memory/constellation` |
| AI Pack | **Cartograph** | `MNESTIS/ai-pack/cartograph` (semver 1.0.0) |

## Roadmap (aspirational)

| Codename | Target |
|----------|--------|
| **Oracle** | Next memory engine generation |
| **Palimpsest** | Next product release |

## Legacy schema IDs (still accepted on load)

- `MNESTIS/memory-engine/v2`, `MNESTIS/memory-engine/v3` → **Labyrinth**
- `MNESTIS/shared-memory/v1` → **Constellation**

## CLI

```bash
MNESTIS doctor              # shows Mneme 0.3.0 + Labyrinth engine stats
MNESTIS memory trust        # honest trust manifest
MNESTIS memory engine       # Labyrinth status
```
