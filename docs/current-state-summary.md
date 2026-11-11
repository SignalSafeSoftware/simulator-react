# simulator-react current-state summary

Prepared source version: **0.21.2** (2026-11-10). This is not a claim of npm publication.

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
