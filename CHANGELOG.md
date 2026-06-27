# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-06-24

### Added

- UI-kit agnostic primitives (`src/ui/simulatorClasses.ts`, `src/ui/primitives.tsx`) with `simulator-*` class hooks.
- Render slots on `SimulatorWithSession`: `renderChoice`, `renderFeedback`, `renderContactsOverlay`.
- [docs/UI_KIT_AGNOSTIC_USAGE.md](./docs/UI_KIT_AGNOSTIC_USAGE.md) — class hooks, slots, host examples, DeliveryPlus migration.
- Tests: `package-metadata`, `import-without-react-bootstrap`, `renderSlots`.

### Changed

- **Breaking:** Remove `react-bootstrap` from peer dependencies; hosts supply their own UI kit or CSS.
- Replace `react-bootstrap` components (Modal, Card, Form, Alert, …) with semantic HTML and native `<dialog>`.
- Default styling contract uses `simulator-*` hooks instead of Bootstrap component markup.
- Complete runtime Bootstrap CSS class removal from shell, list, dial, inbox, browser, and dev chrome views (Prompt 12B).
- README and RELEASING document UI-kit agnostic integration; Bootstrap examples are host-app code only.

## [0.1.6] - 2026-06-26

### Fixed

- Clear monorepo `paths` from standalone `tsconfig.build.json` so local `yarn build` works outside the monorepo.

### Changed

- Standardize development on Yarn 1.22.22 (`packageManager`, README dev commands).
- Bump `@signalsafe/simulator-core` to `^0.1.5` and `@signalsafe/tree-spec` to `^0.3.2`.

## [0.1.5] - 2026-06-26

### Added

- `SECURITY.md`, Dependabot, `CHANGELOG.md`, updated [RELEASING.md](./RELEASING.md).
- Expanded React package test coverage.
- Package artifact smoke test (`yarn smoke:package`).

### Changed

- Package metadata and README (Batches 3–4).

### CI

- Checks and tests on every PR; Sonar **`scan`** is label-gated on PRs and runs on tag push and manual dispatch (Batch 1).
- Publish only from manual **`main`** dispatch or **`v*`** tags (not PR labels); publish requires **`checks`**, **`tests`**, and **`scan`**.

[Unreleased]: https://github.com/SignalSafeSoftware/simulator-react/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/SignalSafeSoftware/simulator-react/compare/v0.1.6...v0.2.0
[0.1.6]: https://github.com/SignalSafeSoftware/simulator-react/releases/tag/v0.1.6
[0.1.5]: https://github.com/SignalSafeSoftware/simulator-react/releases/tag/v0.1.5
