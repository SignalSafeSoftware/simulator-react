# UI-kit agnostic simulator refactor — design scan

**Status:** **Implemented** (Prompt 12–13, `@signalsafe/simulator-react@0.2.0`)  
**Branch:** `cleanup`  
**Usage guide:** [UI_KIT_AGNOSTIC_USAGE.md](./UI_KIT_AGNOSTIC_USAGE.md)

---

## Executive summary

| Package | react-bootstrap | Bootstrap CSS classes | UI-kit agnostic |
|---------|-----------------|----------------------|-----------------|
| `simulator-core` | None | None | **Yes** — unchanged |
| `tree-spec` | None | None | **Yes** — inspect only |
| `simulator-react` | **Removed** (0.2.0) | **None** — runtime uses `simulator-*` only (Prompt 12B) | **Yes** — peers are `react` + `react-dom` only |

**Shipped semver:** **0.2.0** — peer dependency removal + styling contract change + render slots.

**Optional future package:** `@signalsafe/simulator-react-bootstrap` — reference Bootstrap skin if multiple apps want the legacy wireframe look without duplicating CSS bridges.

---

## What changed (implementation)

### Phase 1 — Semantic tokens ✓

- `src/ui/simulatorClasses.ts` — `simulator-*` layout/shell hooks
- `src/ui/primitives.tsx` — `SimulatorButton`, `SimulatorInput`, `SimulatorCard`, `SimulatorDialog`, …
- `src/simulatorStyles.ts` — rewritten to use `simulator-*` tokens

### Phase 2 — Remove `react-bootstrap` ✓

- All 16 runtime `react-bootstrap` imports replaced with primitives or plain HTML
- `react-bootstrap` removed from `peerDependencies` and `devDependencies`
- Contacts overlay: native `<dialog>` via `SimulatorDialog` (or `renderContactsOverlay` slot)
- README / RELEASING no longer list Bootstrap as required

### Phase 3 — Render slots ✓

- `SimulatorWithSession`: `renderChoice`, `renderFeedback`, `renderContactsOverlay`
- Screen registry context passes slots to SMS, browser, and phone views
- `src/ui/renderSlots.tsx`: `renderSimulatorChoice`, `renderSimulatorFeedback`

### Phase 4 — Bootstrap CSS cleanup ✓ (Prompt 12B)

- All shell, list, dial, inbox, browser, and dev chrome views migrated to `simulator-*` tokens
- `simShell`, `simLayout`, `simAvatar`, and extended spacing tokens in `simulatorStyles.ts`
- `tests/bootstrapClassHooks.test.ts` — denylist guard on rendered markup

---

## Tests added / updated

| Test | Purpose |
|------|---------|
| `tests/package-metadata.test.ts` | No `react-bootstrap` in peer/dev deps |
| `tests/import-without-react-bootstrap.test.ts` | Barrel loads without `react-bootstrap` |
| `tests/renderSlots.test.ts` | `renderChoice` / `renderFeedback` slot delegation |
| `tests/bootstrapClassHooks.test.ts` | No Bootstrap CSS tokens in shell/list/dial markup |
| `tests/simulatorWithSessionInteractions.test.ts` | Removed `react-bootstrap` mock |

---

## DeliveryPlus migration

See [UI_KIT_AGNOSTIC_USAGE.md](./UI_KIT_AGNOSTIC_USAGE.md#deliveryplus-migration-guidance-only). DeliveryPlus is **not** modified in this refactor; pin `0.1.x` until host CSS or render slots are ready.

---

## References

- Prior art: `tree-spec-editor/docs/UI_KIT_AGNOSTIC_REFACTOR.md`, `UI_KIT_AGNOSTIC_USAGE.md`
- Ecosystem policy: `simulator-core` headless; `simulator-react` React primitives; DeliveryPlus owns Bootstrap
