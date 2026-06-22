# First npm publish — step by step

**Package name:** `mnestis`  
**GitHub:** `bitreonx/mnestis`  
**Website:** https://mnestis.vercel.app  

Nothing is on npm yet. Follow these steps once, then CI handles every release after that.

---

## Phase 1 — npm account (5 min)

1. Go to [npmjs.com/signup](https://www.npmjs.com/signup) and create an account (or log in).
2. Enable **two-factor authentication** on your account (npm → Account → Security).
3. On your machine, log in:

```bash
npm login
```

4. Verify:

```bash
npm whoami
```

You should see your npm username.

---

## Phase 2 — First manual publish (one time only)

Trusted Publishers work **after** the package exists. The first publish must be manual.

> **2FA required:** Local publish needs OTP if 2FA is on: `npm publish --access public --otp=123456`  
> Or push tag `v0.3.0` — GitHub Actions uses `NPM_TOKEN` (no OTP in terminal).

> **No local provenance:** Remove `"provenance": true` from `publishConfig`. CI adds `--provenance` when OIDC is configured.

### 2a. Build the self-contained bundle

From the repo root:

```bash
npm ci
npm run build --workspace @mnestis/core
npm run build --workspace mnestis
npm run prepare:publish --workspace mnestis
```

This creates `packages/cli/dist/npm.cjs` (~11 MB) and strips the workspace-only `@mnestis/core` dependency from `package.json` temporarily.

### 2b. Dry-run (optional but recommended)

```bash
cd packages/cli
npm pack --dry-run
```

Confirm the tarball contains `dist/npm.cjs`, `bin/`, and **no** broken workspace refs.

### 2c. Publish

```bash
cd packages/cli
npm publish --access public --provenance
```

If `--provenance` fails locally (needs CI OIDC), omit it for the first publish:

```bash
npm publish --access public
```

### 2d. Restore package.json

```bash
cd ../..
node packages/cli/scripts/strip-publish-deps.mjs restore
```

### 2e. Verify from a clean machine (or temp folder)

```bash
npx mnestis --version
npx mnestis launch . --platform cursor --no-open
```

Expected: version `0.3.0`, build succeeds, steering files appear under `.cursor/`.

---

## Phase 3 — Trusted Publishers (recommended)

After the package exists on npm:

1. Open [npmjs.com/package/mnestis](https://www.npmjs.com/package/mnestis) → **Settings** → **Publishing access**.
2. Under **Trusted Publishers**, click **Connect to GitHub**.
3. Configure:
   - **Organization / user:** `bitreonx`
   - **Repository:** `MNESTIS`
   - **Workflow filename:** `publish-npm.yml`
   - **Environment:** (leave empty unless you use GitHub Environments)
4. Save.

From now on, pushing a version tag publishes automatically with provenance — **no long-lived NPM_TOKEN required** (though the workflow keeps `NPM_TOKEN` as fallback).

---

## Phase 4 — Release via git tag (every version after)

1. Bump version in `packages/cli/package.json` (and root if mirrored).
2. Commit: `chore: release v0.3.1`
3. Tag and push:

```bash
git tag v0.3.0
git push origin v0.3.0
```

4. Watch **Actions** → `publish-npm` on GitHub.
5. Confirm on npm: [npmjs.com/package/mnestis](https://www.npmjs.com/package/mnestis)

---

## What customers run (after publish)

| Goal | Command |
|------|---------|
| Full launch + Cursor steering | `npx mnestis launch . --platform cursor` |
| Full launch + Claude steering | `npx mnestis launch . --platform claude` |
| Quick scan only | `npx mnestis .` |
| Steer after scan | `npx mnestis setup --platform claude` |

**Do not use** `npm install MNESTIS` — that name belongs to a different project.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `403 Forbidden — package name too similar` | Name is `mnestis`, not `MNESTIS`. |
| `402 Payment Required` | Scoped packages need `--access public`; `mnestis` is unscoped. |
| Tag mismatch in CI | Tag must match `packages/cli/package.json` version exactly (`v0.3.0` ↔ `"0.3.0"`). |
| `prepare:publish` fails | Run `npm run build --workspace @mnestis/core` first. |
| Trusted publish fails | First publish manually (Phase 2), then configure Trusted Publishers. |

---

## Security checklist before publish

- [ ] `npm audit --omit=dev` at repo root shows **0** vulnerabilities
- [ ] No secrets in `packages/cli/package.json` or bundled code
- [ ] `mnestis --version` works from tarball install
- [ ] Website install commands point to `mnestis`, not `MNESTIS`

See also: [PUBLISHING.md](./PUBLISHING.md)
