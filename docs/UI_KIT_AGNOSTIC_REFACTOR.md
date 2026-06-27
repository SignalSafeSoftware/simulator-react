# UI-kit agnostic simulator refactor — design scan (Prompt 11)

**Status:** Planned — **no runtime changes in Prompt 11.**  
**Branch:** `cleanup`  
**Packages:** `@signalsafe/simulator-react` (primary), `@signalsafe/simulator-core`, `@signalsafe/tree-spec` (inspect only)

---

## Executive summary

| Package | react-bootstrap | Bootstrap CSS classes | Ready for UI-kit agnostic goal |
|---------|-----------------|----------------------|--------------------------------|
| `simulator-core` | None | None | **Yes** — already meets boundary |
| `tree-spec` | None | None | **Yes** — wire contract only (inspect) |
| `simulator-react` | **Yes** — 16 source files | **Yes** — shell, views, `simulatorStyles.ts`, most chrome | **No** — entire device UI assumes Bootstrap today |

**Likely semver:** `@signalsafe/simulator-react` **0.2.0** (remove `react-bootstrap` peer; public shell/view styling contract change). `@signalsafe/simulator-core` **patch or unchanged**.

**Optional future package:** `@signalsafe/simulator-react-bootstrap` — host-owned reference Bootstrap skin if multiple apps need today's wireframe look without duplicating CSS bridges.

---

## Search inventory (Prompt 11 task list)

### Terms searched

| Term | Runtime matches | Notes |
|------|-----------------|-------|
| `react-bootstrap` | 16 `src/` files + metadata/tests/tsconfig | See table below |
| `bootstrap` / `Bootstrap` | README, RELEASING, `simulatorStyles.ts` comment | No `bootstrap` npm dep; CSS loaded by host |
| `Button` | `react-bootstrap` in 5 files; plain `<button className="btn …">` in ~20 files | Mixed |
| `Card` | `react-bootstrap` Card in 4 report/timeline components | |
| `Modal` | `SimulatorWithSession.tsx` only | Contacts verification overlay |
| `Alert` | `SimulatorLintBanner.tsx` only | |
| `Badge` | No `react-bootstrap` Badge; `badge` / `bg-*` CSS in views | |
| `Tabs` | **Not used** | `SimulatorLocalNav` uses plain buttons + `role="tablist"` |
| `Accordion` | **Not used** | Reports use `Collapse` instead |
| `Toast` | **Not used** | |
| `Form` | `react-bootstrap` Form in 8 files | Group/Label/Control |
| `Overlay` | **Not used** (runtime) | False positives: merge "overlay" in `simulatorWorldSections.ts` |
| `Popover` | **Not used** | |
| `ListGroup` | `SimulatorList.tsx`, `DirectoryView.tsx` | |

---

## Categorized matches

### 1. Runtime `react-bootstrap` imports (16 files)

| File | Components imported | Category |
|------|---------------------|----------|
| `src/SimulatorWithSession.tsx` | `Modal` | **Public export** — contacts panel overlay |
| `src/components/SimulatorLintBanner.tsx` | `Alert`, `Collapse` | **Public export** |
| `src/components/SimulatorDetail.tsx` | `Button` | Internal primitive used by exported views |
| `src/components/SimulatorList.tsx` | `ListGroup` | Internal list primitive |
| `src/components/SimulatorSearchInput.tsx` | `Form` | Internal |
| `src/components/SimulatorSessionTimeline.tsx` | `Card`, `Collapse` | Internal (via `SimulatorDeveloperToolsPanel`) |
| `src/components/SimulatorAuthorPreviewReport.tsx` | `Card`, `Collapse` | Internal |
| `src/components/SimulatorRuntimeIssuesReport.tsx` | `Card`, `Collapse` | Internal |
| `src/components/SimulatorReachabilityReport.tsx` | `Card`, `Collapse` | Internal |
| `src/views/MessagesNewThreadView.tsx` | `Form` | Screen registry (rendered by `SimulatorWithSession`) |
| `src/views/SmsSimulatorView.tsx` | `Button`, `Form` | Screen registry |
| `src/views/EmailMessageDetail.tsx` | `Button`, `Form` | Screen registry |
| `src/views/EmailComposeView.tsx` | `Form` | Screen registry |
| `src/views/BrowserPageRenderer.tsx` | `Button`, `Form` | Screen registry |
| `src/views/HomeSimulatorView.tsx` | `Form` | Screen registry |
| `src/views/DirectoryView.tsx` | `Button`, `ListGroup` | Screen registry |

### 2. Bootstrap CSS only — no `react-bootstrap` import (~22 files)

Uses `btn-*`, `list-group-*`, `form-control`, `alert`, `badge`, Bootstrap utilities (`d-flex`, `text-muted`, …) directly or via `simulatorStyles.ts`:

| Area | Files |
|------|-------|
| **Shell** | `shell/PhoneSimulatorShell.tsx` |
| **Error / fallback** | `SimulatorErrorBoundary.tsx`, `UnsupportedScreenFallback.tsx` |
| **Developer chrome** | `SimulatorDeveloperControlsBar.tsx`, `SimulatorDeveloperToolbar.tsx`, `SimulatorBrowserChrome.tsx` |
| **Local nav** | `components/SimulatorLocalNav.tsx` |
| **Phone views** | `PhoneSimulatorView.tsx`, `PhoneIncomingScene.tsx`, `PhoneHistoryList.tsx`, `PhoneDialView.tsx`, `ContactsView.tsx` |
| **Email / messages lists** | `EmailInboxList.tsx`, `MessagesThreadListView.tsx` |
| **Style tokens** | `simulatorStyles.ts` (documents "Bootstrap-based" tokens: `list-group-flush`, `badge`, utility classes) |

**Indirect coupling:** `PhoneVoicemailView.tsx` has no direct import but uses `SimulatorDetailBackBar` → `react-bootstrap` `Button`.

### 3. Test-only usage

| File | Usage |
|------|-------|
| `tests/simulatorWithSessionInteractions.test.ts` | `vi.mock('react-bootstrap')` — stubs `Modal` for node test env |
| `tests/tsconfig.json` | Path alias to `react-bootstrap` types |

**False positives in tests:** fixture strings containing `"Alert"` as email subject — not UI.

### 4. Docs / example usage

| File | Implies Bootstrap required? |
|------|----------------------------|
| `README.md` | **Yes** — peer deps list `react-bootstrap`; install line; `import 'bootstrap/dist/css/bootstrap.min.css'` |
| `RELEASING.md` | **Yes** — lists `react-bootstrap` peer |

### 5. Package metadata only

| Location | Content |
|----------|---------|
| `package.json` | `peerDependencies.react-bootstrap: ^2.0.0`; `devDependencies.react-bootstrap: ^2.10.2` |
| `tsconfig.json` | Path alias for `react-bootstrap` |
| `yarn.lock` | Lock entry |

**Not present:** `bootstrap` npm package, `react-bootstrap` keyword, Tabs/Accordion/Toast/Popover/Overlay components.

### 6. Clean layers (no Bootstrap)

| Area | Location |
|------|----------|
| Session reducer / handlers | `src/state/*` |
| Hooks (internal) | `useSimulatorSessionHandlers`, `useSimulatorSecondaryMenu`, `useSimulatorDeveloperControls` |
| Utilities / adapters | `src/utils/*`, `src/adapters/*`, `src/actions/*` |
| Types / contract | `src/types/*`, `src/contract/*` |
| Screen registry logic | `src/screenRegistry/*` (types only; registered components are Bootstrap-coupled) |
| **`simulator-core`** | No React, DOM, or Bootstrap (verified) |

---

## Public API impact

### Exported components that force Bootstrap today

| Export | Coupling | Host impact if uncoupled |
|--------|----------|--------------------------|
| `SimulatorWithSession` | `Modal` + all registry screens | Main embed surface; requires Bootstrap CSS + `react-bootstrap` |
| `PhoneSimulatorShell` | Bootstrap utility CSS on frame/nav | Usable without `react-bootstrap` JS if host loads Bootstrap CSS |
| `SimulatorLintBanner` | `Alert`, `Collapse` | Authoring banner breaks without Bootstrap |
| `SimulatorDeveloperToolsPanel` | Composes Card/Collapse reports | QA panel breaks without Bootstrap |
| `PhoneIncomingScene` | Plain `btn-*` buttons | Needs Bootstrap CSS only |
| `SimulatorErrorBoundary` | Plain `btn-*` | Needs Bootstrap CSS only |
| `renderActiveScreen` / registry | All registered views | Implicit Bootstrap via screen components |

### Types mentioning Bootstrap

**None** in public exported types. `SimulatorRenderContext` and view props do not reference Bootstrap. Coupling is **implementation-only** (class strings and `react-bootstrap` imports).

### README examples implying Bootstrap required

- Peer deps table: `react-bootstrap`
- Install: `npm install … react-bootstrap`
- Repository example: `import 'bootstrap/dist/css/bootstrap.min.css'`
- Side effects note instructs loading Bootstrap CSS

### Components → recommended refactor shape

| Current | Recommended direction |
|---------|----------------------|
| `SimulatorWithSession` + registry views | **`useSimulatorSession`** (export session handlers hook) + **`SimulatorDeviceFrame`** shell with **`renderScreen(ctx)`** slot |
| `PhoneSimulatorShell` | Rename/evolve to **`SimulatorDeviceFrame`** with `simulator-*` semantic classes; `renderHeader` / `renderFooter` / `renderNav` slots |
| Screen views (email, SMS, browser, …) | **`SimulatorScreenView`** primitives + **`renderChoice`**, **`renderActionBar`**, **`renderMessageList`** slots; keep wireframe behavior in host or optional bootstrap package |
| `SimulatorLintBanner` + dev reports | Plain semantic HTML + collapse via `<details>` or host slot; **`renderLintWarnings`** |
| Contacts overlay `Modal` | **`renderContactsOverlay`** slot or native `<dialog>` |
| `SimulatorDetail` / `SimulatorList` | Internal **`simulator-*` primitives** (like tree-spec-editor `graph-editor-*`) |
| `simulatorStyles.ts` | Replace Bootstrap utility strings with **`simulator-*` tokens** + host CSS map |

---

## Proposed target public API (Phase 2+)

Headless + composable surface for DeliveryPlus to wrap in Bootstrap:

```tsx
// Hooks (export from barrel)
useSimulatorSession({ state, dispatch, onSimulatorEvent });
useSimulatorNavigation(state, dispatch);
useSimulatorDeveloperTools(developerTools);

// Shell
<SimulatorDeviceFrame
  activeChannel={channel}
  onChannelChange={…}
  renderHeader={…}
  renderFooter={…}
  renderSecondaryNav={…}
  exitSlot={…}
>
  {renderScreen(context)}
</SimulatorDeviceFrame>

// Or higher-level with slots
<SimulatorWithSession
  state={state}
  dispatch={dispatch}
  renderScreen={(ctx) => …}
  renderContactsOverlay={(ctx) => …}
  renderLintBanner={(warnings) => …}
  renderDeveloperTools={(tools) => …}
/>

// Screen building blocks (optional exports)
<SimulatorScreenView title="Email" … />
<SimulatorChoiceList choices={…} renderChoice={(c) => …} />
<SimulatorFeedbackPanel feedback={…} renderFeedback={…} />
<SimulatorActionBar renderPrimary={…} renderSecondary={…} />
```

**Completion / outcome UI** stays in host or TreeSpec-backed flows — expose via `renderCompletion` on session end if needed (not in package today).

---

## Semver decision

| Scenario | Version |
|----------|---------|
| Metadata-only doc/peer cleanup with no class changes | Patch |
| Remove `react-bootstrap` peer + change DOM/class contract | **Minor → 0.2.0** |
| Rename/delete exported components without compatibility shims | Minor or major pre-1.0 |

**Recommendation: `0.2.0`** — same rationale as `@signalsafe/tree-spec-editor@0.3.0`: peer dependency removal + styling contract change. Component **names** can remain; **markup and required CSS** change.

---

## DeliveryPlus migration impact

**Today (inferred):**

- Installs `@signalsafe/simulator-react` with **`react-bootstrap`** peer and Bootstrap CSS.
- Embeds `SimulatorWithSession`, `PhoneSimulatorShell`, `SimulatorLintBanner`, optional `SimulatorDeveloperToolsPanel`.

**After refactor:**

1. **Short term:** Pin `@signalsafe/simulator-react@0.1.x` until DeliveryPlus adds `simulator-*` CSS bridge or composes new slots.
2. **Target:** DeliveryPlus owns Bootstrap/`react-bootstrap` for layout, cards, modals, tabs, toasts; imports hooks + `SimulatorDeviceFrame` + `renderScreen` from `-react`.
3. **CSS:** Map `simulator-*` classes in DeliveryPlus theme (or optional `@signalsafe/simulator-react-bootstrap`).
4. **Contacts modal:** Reimplement as DeliveryPlus `Modal` via `renderContactsOverlay`.
5. **Do not modify DeliveryPlus in refactor prompts.**

---

## Recommended phases

### Phase 0 — Prep (Prompt 11 ✓)

- This design doc; align timeline with tree-spec-editor 0.3.0 work.

### Phase 1 — Semantic tokens

- Add `src/ui/simulatorClasses.ts` + primitives; mirror `simulatorStyles.ts` with `simulator-*` hooks.
- Keep Bootstrap class mapping documented for hosts.

### Phase 2 — Remove `react-bootstrap`

- Replace Modal → `<dialog>` or slot; Alert/Card/Collapse/Form/ListGroup → primitives.
- Remove peer dep; update README.

### Phase 3 — Slot-based shell

- Export `useSimulatorSession`; add `renderScreen`, `renderContactsOverlay`, etc.
- Registry views become default implementation (optional) or move to bootstrap package.

### Phase 4 — Optional `@signalsafe/simulator-react-bootstrap`

- Justified if **DeliveryPlus + second consumer** want shared wireframe CSS without forking.
- Not required for first refactor.

---

## Tests needed (implementation prompts)

- [ ] `package-metadata.test.ts` — no `react-bootstrap` in peer/dev deps after refactor.
- [ ] `import-without-react-bootstrap.test.ts` — barrel loads without `react-bootstrap`.
- [ ] Screen registry smoke with **no Bootstrap CSS** loaded (layout/a11y via semantic classes).
- [ ] Slot contract tests: `renderScreen`, `renderContactsOverlay` invoked with expected context.
- [ ] Update `simulatorWithSessionInteractions.test.ts` — remove `react-bootstrap` mock.
- [ ] Port visual/wireframe assertions to optional bootstrap package if split.
- [ ] DeliveryPlus integration checklist (manual).

---

## References

- Prior art: `tree-spec-editor/docs/UI_KIT_AGNOSTIC_REFACTOR.md`, `UI_KIT_AGNOSTIC_USAGE.md`
- Current version: `@signalsafe/simulator-react@0.1.6`
- Ecosystem policy: `simulator-core` headless; `simulator-react` React primitives; DeliveryPlus owns Bootstrap
