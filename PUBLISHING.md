# Publishing Mnestis

Package: **`mnestis`** on npm and PyPI  
Site: **https://mnestis.vercel.app**

> **First time?** Nothing is on npm yet — follow **[docs/NPM_FIRST_PUBLISH.md](./docs/NPM_FIRST_PUBLISH.md)** for the full step-by-step (account → manual publish → Trusted Publishers → tag releases).

## npm trusted publishing (recommended)

1. On npmjs.com → package `mnestis` → **Publishing** → enable **Trusted Publishers** → GitHub `bitreonx/mnestis`
2. Push tag `v0.3.0` — CI uses OIDC (`id-token: write`) + `--provenance`
3. Optional: keep `NPM_TOKEN` as fallback in GitHub secrets

```bash
npm run build --workspace @mnestis/core
npm run prepare:publish --workspace mnestis
cd packages/cli && npm publish --access public --provenance
node scripts/strip-publish-deps.mjs restore
```

## PyPI

Tag push → `.github/workflows/publish-pypi.yml` (needs `PYPI_API_TOKEN`)

```bash
pip install mnestis
```

## Customer one-liner

```bash
npx mnestis launch . --platform cursor
```
