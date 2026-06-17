# Contributing to Mnemos

Thank you for helping make Mnemos the memory layer for software.

## Dev setup

```bash
git clone https://github.com/bitreonx/mnemos.git
cd mnemos
npm install
npm run build
```

Requirements: **Node.js ≥ 20**, npm 11+ (pnpm optional).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build all workspaces |
| `npm run test` | Run workspace tests |
| `npm run mnemos -- .` | Run CLI against current directory |
| `npm run -w @mnemos/ui dev` | Dashboard dev server |
| `npm run docs:sync` | Regenerate `docs/LANGUAGES.md`, `docs/GRAPHS.md`, `docs/architecture.md` from core generators |

## Project structure

```
packages/core/   — scanner, analyzer, ai-pack, report, serve, mcp
packages/cli/    — mnemos CLI
packages/ui/     — dashboard (Vite + React Router v7)
docs/            — specifications and guides
mnemos-bench/    — verified benchmarks
```

## Pull requests

1. Fork and create a feature branch from `main`
2. Keep changes focused — one concern per PR
3. Run `npm run build` before opening
4. Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
5. Update docs if you change AI Pack v1, modes, or CLI flags

## AI Pack changes

AI Pack **v1 is stable for 1.x**. Additive fields only in minor releases. Breaking schema changes require v2 and a migration note in `docs/ai-pack.md`.

## Code style

- TypeScript strict mode
- UI: Tailwind v4, shadcn-style components in `packages/ui/src/components/ui/`
- No telemetry, no required network calls in core paths

## Language & graph docs

After changing `packages/core/src/languages/` or Mermaid templates in `graph/mermaid.ts` or `context/graph-markdown.ts`:

```bash
npm run test --workspace @mnemos/core
npm run docs:sync
npx mnemos .
```

Open `.mnemos/context/graphs.md` and `.mnemos/context/languages.md` in preview to verify Mermaid renders.

Catalog: [GRAPHS.md](./GRAPHS.md) · [LANGUAGES.md](./LANGUAGES.md) · [CONTRIBUTING.md](../CONTRIBUTING.md#language-and-parser-changes)

## Questions

Open a [GitHub Discussion](https://github.com/bitreonx/mnemos/discussions) or issue with the `question` label.
