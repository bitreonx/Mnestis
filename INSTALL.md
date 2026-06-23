# Installing Mnestis

**Website:** [mnestis.vercel.app](https://mnestis.vercel.app)  
**GitHub:** [github.com/bitreonx/Mnestis](https://github.com/bitreonx/Mnestis)

## One command. One name. No guessing.

**Recommended — build + auto-steer your AI editor:**

```bash
npx mnestis launch . --platform cursor   # Cursor rules + MCP
npx mnestis launch . --platform claude   # Claude skills + CLAUDE.md
```

**Quick scan only:**

```bash
npx mnestis .
```

The npm package is **`mnestis`**. The command you type is the promise you get.

| Wrong | Right |
|-------|-------|
| `npm install MNESTIS` | `npm install -g mnestis` |
| `npm install @mnestis/cli` | `npx mnestis launch . --platform cursor` |
| `npm install MNESTIS-cli` (npm) | `pip install mnestis` |

After install, both `mnestis` and `MNESTIS` work.

---

## Node.js (recommended)

Requires **Node 20+**.

```bash
npx mnestis .
npm install -g mnestis
npm install -D mnestis   # in your project
```

## Beast mode + security

```bash
mnestis launch . --platform cursor --supernova   # build + steer + Supernova pack
mnestis supernova .   # tours, layers, personas, AI pack — all fire
mnestis audit .       # npm audit → .MNESTIS/security-audit.json
```

## First npm publish (maintainers)

See **[docs/NPM_FIRST_PUBLISH.md](./docs/NPM_FIRST_PUBLISH.md)** — step-by-step from zero to live on npm.

## Python

```bash
pip install mnestis
MNESTIS .
```

## Verify

```bash
mnestis --version
```

## Dabt `@dabt/shared` 404?

That error is from the **Dabt monorepo**, not MNESTIS. Link or publish `@dabt/shared` first, then:

```bash
npm install -D mnestis
```
