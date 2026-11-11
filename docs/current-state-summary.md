# simulator-react current-state summary

Prepared source version: **0.21.2** (updated 2026-11-11). This is not a claim of npm publication.

- Unify authored call rendering and navigation, preserving unknown dates, voicemail actions and related history.
- Keep browser navigation, stable page IDs and authored page content synchronized.
- Initialize mailbox folder/compose routes and preserve custom folders and unknown dates.
- Refresh selected photo details through the record store, including paged records, while preserving unsaved edits.
- Synchronize externally selected Vault entries and message previews without changing saved starting positions.

## Coordinated versions

| Package | Prepared version |
| --- | --- |
| `@signalsafe/simulator-core` | `0.7.2` |
| `@signalsafe/simulator-react` | `0.21.2` |
| `@signalsafe/simulator-device` | `0.21.3` |
| `@signalsafe/simulator-theme-bootstrap` | `0.13.3` |
| `@signalsafe/simulator-editor-react` | `0.1.0` |

The source includes the current GitHub main branch plus the reviewed local simulator work. Existing merged release fixes are preserved. Source manifests and packaged declarations use the coordinated version set. See [release preparation](release-2026-11-10.md) for dependency and verification status.

## Current verification and examples

841 package tests pass; all four executable-source coverage metrics are 100%. See [November 11 verification](verification-2026-11-11.md) for the coordinated 1,465-test result, public examples and remaining registry-release gates.


### React CI candidate installation — November 11

The checks, tests and packed runtime jobs failed while resolving unpublished simulator-core 0.7.2. Development installs now use its checked-in archive through the existing artifact mechanism, with a SHA-256 manifest and regenerated Yarn lock. Runtime consumer tooling already copies these candidate archives and applies explicit overrides. The release validator continues rejecting file dependencies until publication migration; this is a review candidate, not a registry release.

The theme 0.13.3 candidate is also checked in as a development peer fixture. Smoke tooling resolves local peer fixtures relative to the package root. A clean checkout passed frozen Yarn installation (including prepare), lint, formatting, module/cycle/duplication checks, strict source/test types, build, all 841 tests with 100% coverage across all metrics, and isolated packed runtime/type/example smoke checks.
