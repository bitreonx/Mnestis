# Deploying the MNESTIS website to Vercel

The MNESTIS **website** is the Vite + React dashboard in [`packages/ui`](../packages/ui).
It is a fully static single-page app: it ships a bundled snapshot of the repo's own
MNESTIS analysis (`public/.MNESTIS/`) so the cockpits, reports, and AI Pack all work
read-only with **no server, no API keys, no database**.

## One-click setup

1. Import the repository into Vercel (keep **Root Directory** = repository root —
   do *not* set it to `packages/ui`).
2. Vercel reads [`vercel.json`](../vercel.json) at the root and needs no further config:

   | Setting | Value (from `vercel.json`) |
   |---------|----------------------------|
   | Install | `npm install` (installs the workspace) |
   | Build | `npm run build --workspace @mnestis/ui` |
   | Output | `packages/ui/dist` |
   | Routing | SPA rewrite → `/index.html` (static files served first) |

3. Deploy. That's it — the website is live.

The `rewrites` rule sends client routes like `/coder/local/overview` to `index.html`,
while real files (`/assets/*`, `/.MNESTIS/*.json`, `/logo.png`) are served directly
because Vercel checks the filesystem before applying rewrites.

## What ships vs. what doesn't

- **Ships:** the SPA, bundled assets, and the demo dataset under `dist/.MNESTIS/`.
- **Does not ship:** the CLI, the memory server, `node_modules`, or the benchmark.
  These are local-only tools — the hosted site is a read-only showcase.

## Terminal behavior on the hosted site

The integrated terminal (Ctrl+`) has three modes — **Vibe / AI / Coder**. On the
hosted deploy there is no `/api/terminal` backend, so it runs in **offline mode**:

- `dna`, `pack`, `score`, `explain` are served from the bundled `/.MNESTIS/` snapshot.
- Any live command (`build`, `ask`, `impact`, …) prints a friendly notice pointing the
  user to run MNESTIS locally (`npx MNESTIS .` / `npx MNESTIS ui` / `npx MNESTIS serve`).

Run locally for the full, live terminal:

```bash
npx MNESTIS .          # analyze your repo
npx MNESTIS ui         # this dashboard, fully interactive
npx MNESTIS serve      # memory API for agents
```

## Refreshing the demo dataset

The bundled snapshot is just MNESTIS analyzing itself. To refresh it:

```bash
npx MNESTIS .                                   # writes ./.MNESTIS
cp -r .MNESTIS/* packages/ui/public/.MNESTIS/    # update the bundled demo
```

(Cache/parse artifacts like `parse-cache.json` and `file-cache.json` are not needed
in the demo and can be pruned to keep the deploy lean.)
