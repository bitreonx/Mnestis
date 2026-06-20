# Installing Get Mnemos

**Website:** [getmnemos.vercel.app](https://getmnemos.vercel.app)  
**GitHub:** [github.com/bitreonx/mnemos](https://github.com/bitreonx/mnemos)

## One command. One name. No guessing.

**Recommended — build + auto-steer your AI editor:**

```bash
npx getmnemos launch . --platform cursor   # Cursor rules + MCP
npx getmnemos launch . --platform claude   # Claude skills + CLAUDE.md
```

**Quick scan only:**

```bash
npx getmnemos .
```

The npm package is **`getmnemos`**. The command you type is the promise you get.

| Wrong | Right |
|-------|-------|
| `npm install mnemos` | `npm install -g getmnemos` |
| `npm install @mnemos/cli` | `npx getmnemos launch . --platform cursor` |
| `npm install mnemos-cli` (npm) | `pip install getmnemos` |

After install, both `getmnemos` and `mnemos` work.

---

## Node.js (recommended)

Requires **Node 20+**.

```bash
npx getmnemos .
npm install -g getmnemos
npm install -D getmnemos   # in your project
```

## Beast mode + security

```bash
getmnemos launch . --platform cursor --supernova   # build + steer + Supernova pack
getmnemos supernova .   # tours, layers, personas, AI pack — all fire
getmnemos audit .       # npm audit → .mnemos/security-audit.json
```

## First npm publish (maintainers)

See **[docs/NPM_FIRST_PUBLISH.md](./docs/NPM_FIRST_PUBLISH.md)** — step-by-step from zero to live on npm.

## Python

```bash
pip install getmnemos
mnemos .
```

## Verify

```bash
getmnemos --version
```

## Dabt `@dabt/shared` 404?

That error is from the **Dabt monorepo**, not Mnemos. Link or publish `@dabt/shared` first, then:

```bash
npm install -D getmnemos
```
