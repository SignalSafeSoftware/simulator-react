# Releasing @signalsafe/simulator-react

React device simulator shell and session UI (`npm install @signalsafe/simulator-react`).

**Depends on:** `@signalsafe/simulator-core` and `@signalsafe/tree-spec` (publish those first). **Peers:** `react`, `react-dom`, `react-bootstrap`.

**Monorepo source of truth:** `packages/simulator-react` in [DeliveryPlus](https://github.com/SignalSafeSoftware/DeliveryPlus).

## One-time setup

```bash
bash scripts/push-standalone-npm-package.sh simulator-react --create-repo
```

Remote: `https://github.com/SignalSafeSoftware/simulator-react` (use SSH for `git push`).

## Release workflow

1. Develop in `packages/simulator-react`.
2. Align `dependencies` versions for `@signalsafe/tree-spec` and `@signalsafe/simulator-core`.
3. Bump `package.json` version.
4. Test: `make package area=simulator-react type=verify` or `npm ci && npm test && npm run build`.
5. Sync: `bash scripts/push-standalone-npm-package.sh simulator-react`
6. Publish: `npm publish --access public` or GitHub **Release** (triggers `publish.yml`).

## Pre-release checks

```bash
npm ci
npm run typecheck
npm test
npm run build
npm publish --dry-run
```

Tarball should include `package.json`, `README.md`, `LICENSE`, `docs/**`, and `dist/**` only.
