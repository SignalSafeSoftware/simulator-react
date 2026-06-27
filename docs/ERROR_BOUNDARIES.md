# Simulator error boundaries and learner-safe messaging

This package distinguishes **learner/end-user** surfaces from **author/admin** and **developer** diagnostics.

## Audiences

| Audience | Surfaces | Detail level |
| -------- | -------- | -------------- |
| **Learner** | `SimulatorWithSession`, screen registry fallback, default error boundary | Generic copy only — no stacks, paths, or raw exception text |
| **Author/admin** | `SimulatorLintBanner`, `SimulatorDeveloperToolsPanel`, preview/runtime issue reports, editor validation | Structured lint, validation, and template diagnostics |
| **Developer** | Thrown errors, `console.error`, test assertions, `treeSpecRuntimeIssues` messages | Full technical detail |

## Learner-facing defaults

### `SimulatorErrorBoundary`

Wraps simulator session content. On render errors:

- **Default (`showDiagnostics={false}`):** shows {@link LEARNER_SIMULATOR_ERROR_TITLE} and {@link LEARNER_SIMULATOR_ERROR_MESSAGE}; does **not** render `error.message` or React `componentStack`.
- **`showDiagnostics={true}`:** author/admin mode — shows exception message and component stack (use only in trusted authoring or local debug UIs).
- **`console.error`:** always logs full error + stack for developers (not shown in default UI).

### `UnsupportedScreenFallback`

When the screen registry cannot resolve `(app, screen)`:

- **Default:** learner-safe title and guidance (no internal app/screen ids).
- **`showDiagnostics={true}`:** shows `App:` / `Screen:` codes and configuration hint for authors.

## Host application guidance

1. **Production learner routes** — use default props; do not pass `showDiagnostics`.
2. **Author preview / QA** — pass `showDiagnostics` on error boundary and unsupported-screen fallback when detailed template debugging is required.
3. **Validation** — call `validateSimulatorPayload` before session start; surface throws in host UI for authors, not learners.
4. **Core runtime** — `@signalsafe/simulator-core` throws precise `TreeSpecRuntimeError` messages for developers; hosts should map these to learner-safe copy if shown in UI.

## Related exports

- Learner-safe copy constants: `LEARNER_SIMULATOR_ERROR_*`, `LEARNER_UNSUPPORTED_SCREEN_*` in `src/constants.ts`
- Author lint: `lintSimulatorPayload`, `SimulatorLintBanner`
- Author runtime issues: `treeSpecRuntimeIssues` (core), `SimulatorRuntimeIssuesReport` (react dev tools)

See also [SECURITY.md](./SECURITY.md).
