# INFERNO-bench Specification

**Independent Framework for Evaluating Repository Navigation Objectives**

Enterprise-grade codebase understanding benchmark — adversarial, pinned, tamper-evident. Complementary to [SWE-bench](https://www.swebench.com/) (patch repair).

## Engine stack

| Codename | Full name | Role |
|----------|-----------|------|
| **EMBER** | Exact Match Engine for Repository evaluation | Word boundaries, phrase match, path normalization, synonym clusters |
| **BRIMSTONE** | Binary Rubric for Impact & Module Scoring Trap Enumeration | Forbidden hallucinations, prompt injection, homoglyph de-spoofing |
| **CINDER** | Contamination INDetectors for Evaluation Results | Keyword stuffing, empty shells, rubric echo without substance |
| **PANDEMONIUM** | Pattern AND Navigation Detection Engine for Objective Module Intelligence Understanding Metrics | Intent-aware weighted fusion across signals |
| **SPECTER** | Security Protocol for Evaluation Contamination & Tamper Evidence Recording | Repo allowlist, path sandbox, SHA-256 result manifests |
| **CERBERUS** | Triple-headed verification runner | Harness tests + independent grep + regression gate |
| **ASHES** | AI Submission Harness for Evaluation Scoring | External model answer scoring format |

## Six Trials of INFERNO

| Trial | Codename | Intent | Question |
|-------|----------|--------|----------|
| 1 | **EMBER GATE** | `auth_entry` | Where does login start? |
| 2 | **BLAST FORGE** | `impact` | What breaks if X changes? |
| 3 | **ARCHITECT TRIAL** | `overview` | Explain the repository |
| 4 | **CROWN OF ASH** | `critical` | Most critical subsystem |
| 5 | **CAULDRON** | `list_capabilities` | Business capabilities |
| 6 | **PHOENIX PACK** | `context_export` | AI context package |

## Verification tiers

| Tier | Gate |
|------|------|
| **A** | All EMBER + BRIMSTONE + CINDER gates pass, accuracy ≥95% |
| **B** | Strong partial — avg ≥80%, min task ≥70%, no BRIMSTONE traps |
| **C** | Weak — avg ≥50% |
| **F** | Fail — trap triggered or rubric miss |

## Commands

```bash
npm run bench:verify       # EMBER/BRIMSTONE/CINDER unit tests
npm run bench:cerberus     # CERBERUS triple verification
npm run bench:pin -- express nestjs
npm run bench:verify-gt -- express
npm run bench:express
npm run bench:regression
npm run bench:leaderboard
npm run bench:submit -- express answers.json   # ASHES model eval
```

## Submit a model (ASHES)

```json
{
  "model": "your-model-id",
  "answers": {
    "task1_login_start": "...",
    "task2_impact": "...",
    "task3_explain": "...",
    "task4_critical": "...",
    "task5_capabilities": "..."
  }
}
```

```bash
npm run bench:submit -- express my-answers.json
# → results/submissions/express-your-model-id.json
```

## Security

- Repo IDs validated against SPECTER allowlist (`express`, `nestjs`, `nextjs`, `vscode`)
- All paths resolved within `MNESTIS-bench/` root — no traversal
- Results include SPECTER SHA-256 integrity hash
- BRIMSTONE blocks prompt injection patterns in answers

## Files

| Path | Purpose |
|------|---------|
| `scorer/engines/ember.mjs` | Exact matching |
| `scorer/engines/brimstone.mjs` | Traps |
| `scorer/engines/cinder.mjs` | Anti-gaming |
| `scorer/engines/pandemonium.mjs` | Fusion |
| `scorer/engines/specter.mjs` | Security |
| `scorer/verify.mjs` | Orchestrator |
| `GOVERNANCE.md` | Protocol & lineage |
| `dataset/v1.0.0.json` | Pinned fixtures |
