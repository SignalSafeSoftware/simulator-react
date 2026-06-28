# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-06-28

### Changed

- Removed Bootstrap-specific runtime styling assumptions from the React simulator components.
- Replaced Bootstrap class coupling with UI-kit-agnostic `simulator-*` class hooks.
- Updated internal SignalSafe dependency ranges for the current package release line:
  - `@signalsafe/tree-spec@^0.3.3`
  - `@signalsafe/simulator-core@^0.1.7`
- Raised the supported Node.js baseline to Node 22.12+.

### Added

- Added learner-safe error rendering defaults.
- Added `showDiagnostics` support for author, admin, and QA surfaces.
- Added tests covering sanitized error output and unsupported-state rendering.
- Added package smoke checks for the built and packed artifact.

### Fixed

- Addressed SonarCloud findings in `src/ui/primitives.tsx`: mark component props as read-only, move clickable list-row handlers onto an inner `<button>` for keyboard accessibility, and use `export…from` for class-token re-exports.
- Added `simulator-list__item-button` class hook for host styling of clickable list rows.

### Notes

- This release does not include `react-bootstrap` or `bootstrap`.
- Host applications are responsible for styling the emitted `simulator-*` hooks.
- Learner-facing screens should keep diagnostics disabled by default.
- Diagnostics should only be enabled in trusted authoring, admin, development, or QA contexts.

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
