# Blind Evaluation Protocol

The strongest evidence is unbiased human preference — not self-reported scores.

## Setup

1. Pick 3 repositories of similar complexity (e.g. express, a small API, a CLI tool).
2. Generate reports with **MNESTIS**, **Graphify**, and **Gitingest**.
3. Strip all tool branding from outputs:
   - Rename files: `report-a.html`, `report-b.md`, `report-c.txt`
   - Remove logos, footers, tool names
4. Randomize order per participant (A/B/C rotation).

## Script

```bash
node MNESTIS-bench/blind-eval/prepare.mjs express
```

Creates `blind-eval/sessions/<id>/` with anonymized reports.

## Questionnaire (per participant)

1. Which report helped you understand the repository **fastest**?
2. Which report would you paste into Claude/Cursor first?
3. How many minutes until you could explain the architecture to a teammate? (self-reported, secondary)

## Sample size

- Minimum: **10 developers** who have not seen MNESTIS marketing
- Target: **20 developers** for statistical confidence
- Record: role (junior/mid/senior), years of experience, time spent per report

## What counts as evidence

If ≥60% choose the MNESTIS report (Report X) without knowing it's MNESTIS, that result goes in the main README.

## Cost

~2 hours setup + 15 minutes per participant. No API costs for MNESTIS or Gitingest. Graphify may need API key for doc-heavy repos.
