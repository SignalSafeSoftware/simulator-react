# Current state

## Published registry release — 0.22.0 (2026-11-15)

The immutable `v0.22.0` [tag workflow](https://github.com/SignalSafeSoftware/simulator-react/actions/runs/43798458919) passed all gates and publication. The actual npm archive's SHA-512 integrity was verified and all 732 files match the reviewed release artifact. Archive SHA-256: `69f3212196f2e3034ffc7fdb052cf909acc253ac70f0c80f08d47b6d08947863`; release commit `e5ba9f44fb68003d075a1235aa95d6c7dc839e0d`. The genuine lock adopts core 0.7.3, theme 0.13.5 and TreeSpec 0.4.5 without local aliases. All 883 tests pass with 100% executable-source coverage, alongside strict source/test types, lint/modules, formatting, build, cycle/duplication and packed-consumer checks.

## November 15 release scope — 0.22.0

This release unifies scenario and device mailbox content, adds exact semantic anchors and optional host-controlled scripted conversation timing, and preserves standalone timing when the clock is omitted. Runtime replies are immediate without changing the authored delay schedule. Shared dialogs have a localized Close footer and preserve custom action owners; the matching theme constrains scrolling and wraps footer controls.

The reviewed combined candidate passes 883 tests with 100% executable-source coverage, strict source/test types, lint/module checks, formatting, cycle/duplication checks and a build. Core 0.7.3 and theme 0.13.5 have verified public registry archives. The release uses genuine registry dependencies and locks; publication is performed only by successful immutable-tag CI. Historical review archives and earlier test counts below remain dated checkpoints.

## Historical local review — 2026-11-15

Use shared mailbox rows, read-only message content and compose fields for scenario and device paths. Retain complete bodies indexed by message identity, explicit selected detail, empty bodies and snippet-only fallback. Reply and Forward create independent drafts.

Local review artifact: **0.21.3-mail-ui.0**. This is not an npm release or a package.json version bump. The coordinated set is core `0.7.3-mail-ui.0`, React `0.21.3-mail-ui.0`, device `0.21.5-mail-ui.0`, theme `0.13.5-mail-ui.0`; DeliveryPlus records their checksums in its opt-in vendor manifest. Production registry references remain separate.

851 tests passed at the implementation checkpoint; added indexed-source regressions are verified in the follow-up below.

Coordinated live verification covered administration lesson playback, the full simulator authoring editor, PhoneMe with an isolated synthetic database, and workspace's saved lesson reader. The gallery exercised 144 unique screen/state/width/text combinations. DeliveryPlus additionally passed 48 narrow layout cases after fixing its host wrapper (three sizes, two positions, four widths, editor and reader). No real messages or calls were sent. Existing test lessons were restored or archived.

For detailed receipts and limitations see DeliveryPlus `docs/quality/simulator-ui/verification.md` and the coordinated project summary dated 2026-11-15. Historical release coverage below belongs to the November 11 checkpoint; it is not a fresh coverage claim for these changes. Publication, registry adoption and release-gate reruns remain separate work.

### Documentation and regression follow-up

853 tests, including indexed scenario source Reply/Forward. The first parallel run had one 5-second workbench timeout; that file passed all 23 cases on its own, and the complete suite then passed with two workers. Source/test strict types and lint pass.

The review archives were not rebuilt for these documentation/test-only changes. Rebuild and rerun publication gates before a release.

## Published checkpoint — 2026-11-11


Published npm version **0.21.2**, released through the fully gated GitHub tag workflow on November 11, 2026.

## Coordinated public references

| Package | Registry version |
| --- | --- |
| Core | 0.7.2 |
| React | 0.21.2 |
| Device | 0.21.4 |
| Theme | 0.13.4 |

Package manifests and examples select these public registry versions. The private editor example keeps only the editor itself as a checked archive. Historical candidate reports remain in the release/verification documents; they describe prior states, not current dependency requirements.

## Verification

841 executable-source tests pass with 100% statements, branches, functions and lines. Strict types, lint, formatting, build and packed-consumer checks pass where applicable. Theme additionally passes real Chromium layout checks. The device example passes 16 browser tests and the private editor example passes 4.

Device 0.21.3 was blocked by a stale local Yarn lock resolution; its tag was retained. Device 0.21.4 was verified from a fresh checkout and empty cache, and its release guard rejects file/link lock resolutions. Theme 0.13.4 preserves the existing scrollbar patch without reverting newer shared layout fixes.

## Links

- [Repository](https://github.com/SignalSafeSoftware/simulator-react)
- [Editor example](https://signalsafesoftware.github.io/simulator-editor-react/)
- [Device example](https://signalsafesoftware.github.io/simulator-device/)
- [Related packages](links.md)
