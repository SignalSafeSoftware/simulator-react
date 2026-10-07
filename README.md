# `@signalsafe/simulator-react`

React **device simulator** UI: session state, screen registry, template adapter, lint helpers, and optional developer tools. Built on `@signalsafe/simulator-core` for runtime stepping.

| | |
|---|---|
| **npm** | `@signalsafe/simulator-react` |
| **GitHub** | [SignalSafeSoftware/simulator-react](https://github.com/SignalSafeSoftware/simulator-react) |
| **Peer deps** | `react`, `react-dom` (no UI library required) |

## UI-kit agnostic

This package is **UI-kit agnostic**. It renders semantic HTML with stable **`simulator-*` class hooks** and optional **render slots** — it does **not** require Bootstrap, Material UI, or any other component library.

**Host applications own styling.** Provide CSS for `simulator-*` classes, or pass `renderChoice` / `renderFeedback` / `renderContactsOverlay` / `renderIncomingCallExtra` / `hostOwnsPhoneContactDetail` + `onPhoneContactOpen` to inject your UI kit's components. Semantic view hooks (`simulator-runtime`, `simulator-phone`, `simulator-email`, `simulator-messages`, …) are stable targets for host CSS and tests — you do not need DOM enhancers or `MutationObserver` to find simulator regions.

See [docs/UI_KIT_AGNOSTIC_USAGE.md](./docs/UI_KIT_AGNOSTIC_USAGE.md) for layout hooks, semantic view hooks, slots, and DeliveryPlus migration guidance.

See [docs/ERROR_BOUNDARIES.md](./docs/ERROR_BOUNDARIES.md) for learner-safe error UI vs author/admin diagnostics.

## What this package does

- Render **`SimulatorWithSession`** / **`PhoneSimulatorShell`** and registered scenario screens.
- Manage session state via **`simulatorSessionReducer`** (wraps core runtime dispatch).
- Adapt template detail → **`SimulatorTemplatePayload`** (`templateDetailToPayload`).
- Provide **shallow lint** (`lintSimulatorPayload`), reachability, deep-link, preview-fallback, and diff utilities.
- Optional **`SimulatorDeveloperToolsPanel`** for QA/debug views.

Default reusable screens only render interactive controls when the package can complete the
interaction. Store and Settings search filter supplied scenario content. Settings sections are
read-only labels because the portable payload has no setting values or save callback. The default
Add Contact destination explains that creation is not configured; hosts can provide a working form
through `screenOverrides.phone.add_contact`. An explicit legacy-style demo payload is available in
[`docs/examples/demo-home-fixture.ts`](./docs/examples/demo-home-fixture.ts).

## What this package does not do

- Routing, HTTP clients, authentication, or persistence.
- Trusted validation of arbitrary user-uploaded JSON beyond shallow lint — hosts must validate payloads before production use.
- Network I/O — wire **`onSimulatorEvent`** to your analytics/API.

## Relationship to `@signalsafe/simulator-core`

| Concern | Package |
|---|---|
| Headless session stepping, scores, outcomes | `@signalsafe/simulator-core` |
| React UI, reducer wiring, screens, lint banner | **`@signalsafe/simulator-react` (this package)** |

## Payload shape (high level)

Hosts supply a **`SimulatorTemplatePayload`**: TreeSpec wire plus simulator **world** sections (screens, contacts, branding hints, etc.). Use **`templateDetailToPayload`** to map API/template records into that shape, then **`lintSimulatorPayload`** for authoring warnings.

## Install

```bash
npm install @signalsafe/simulator-react react@18 react-dom@18
```

Use a modern **ESM** TypeScript setup. Style simulator UI via host CSS targeting `simulator-*` class hooks, or pass render slots for full UI-kit control (see [UI_KIT_AGNOSTIC_USAGE.md](./docs/UI_KIT_AGNOSTIC_USAGE.md)).

## Minimal example (plain HTML + host CSS)

No Bootstrap or other UI library is required:

```tsx
import { useReducer } from 'react';
import SimulatorWithSession from '@signalsafe/simulator-react/SimulatorWithSession';
import PhoneSimulatorShell from '@signalsafe/simulator-react/shell/PhoneSimulatorShell';
import { getInitialSessionState } from '@signalsafe/simulator-react/state/simulatorSessionInitialState';
import { simulatorSessionReducer } from '@signalsafe/simulator-react/state/simulatorSessionReducer';
import { templateDetailToPayload } from '@signalsafe/simulator-react/adapters/templateToSession';
import { SimulatorTemplateDetail } from '@signalsafe/simulator-react/types/template';

import './simulator-host.css'; // map .simulator-btn, .simulator-muted, etc.

function PlainSimulator({ detail }: { detail: SimulatorTemplateDetail }) {
    const payload = templateDetailToPayload(detail, {});
    const [state, dispatch] = useReducer(
        simulatorSessionReducer,
        getInitialSessionState(payload),
    );

    return (
        <PhoneSimulatorShell>
            <SimulatorWithSession state={state} dispatch={dispatch} />
        </PhoneSimulatorShell>
    );
}
```

## Optional: Bootstrap in the host (not a package requirement)

If your app already uses Bootstrap, wire it via render slots — **this is host-app code**, not a package dependency:

```tsx
import Button from 'react-bootstrap/Button';
import 'bootstrap/dist/css/bootstrap.min.css'; // host-owned CSS

<SimulatorWithSession
    state={state}
    dispatch={dispatch}
    renderChoice={({ label, onClick, tone }) => (
        <Button variant={tone ?? 'primary'} onClick={onClick}>{label}</Button>
    )}
/>;
```

## Repository

Source code and issues are available at:
https://github.com/SignalSafeSoftware/simulator-react

## Source layout (this package)

| Area | Location |
|------|----------|
| Public modules | Explicit subpaths in **`package.json`** |
| Session reducer | **`src/state/simulatorSessionReducer.ts`** |
| Template → payload adapter | **`src/adapters/templateToSession.ts`** (`templateDetailToPayload`) |
| Screen registry | **`src/screenRegistry/`** |
| Utilities | **`src/utils/`** (lint, reachability, deep link, diff, contact search, …) |

## Integration pattern

Convert template detail to a payload, validate and optionally apply preview fallback, build initial state, then render the shell and session:

```tsx
import { useReducer } from 'react';
import SimulatorWithSession from '@signalsafe/simulator-react/SimulatorWithSession';
import PhoneSimulatorShell from '@signalsafe/simulator-react/shell/PhoneSimulatorShell';
import SimulatorLintBanner from '@signalsafe/simulator-react/developer-tools/SimulatorLintBanner';
import { templateDetailToPayload } from '@signalsafe/simulator-react/adapters/templateToSession';
import { getInitialSessionState } from '@signalsafe/simulator-react/state/simulatorSessionInitialState';
import { simulatorSessionReducerWithLogging } from '@signalsafe/simulator-react/state/simulatorSessionReducer';
import { lintSimulatorPayload } from '@signalsafe/simulator-react/utils/payload/lintSimulatorPayload';
import { parseSimulatorSearchParams } from '@signalsafe/simulator-react/utils/navigation/simulatorDeepLink';
import { applyDeepLinkToState } from '@signalsafe/simulator-react/utils/navigation/simulatorDeepLink';
import { getDeepLinkContactsSearch } from '@signalsafe/simulator-react/utils/navigation/simulatorDeepLink';
import { applyPreviewFallback } from '@signalsafe/simulator-react/utils/preview/previewFallbackWorld';
import { SimulatorSessionState } from '@signalsafe/simulator-react/types/session';
import { SimulatorDispatchAction } from '@signalsafe/simulator-react/state/simulatorDispatchActions';
import { SimulatorInteractionEvent } from '@signalsafe/simulator-react/types/simulatorEvents';
import { SimulatorTemplateDetail } from '@signalsafe/simulator-react/types/template';

// `SimulatorTemplateDetail` is defined in `src/types/template.ts`.
function SimulatorHost({ detail }: { detail: SimulatorTemplateDetail }) {
    const rawPayload = templateDetailToPayload(detail, {});
    const payload = applyPreviewFallback(rawPayload);
    const lint = lintSimulatorPayload(payload);
    const initialState = getInitialSessionState(payload);
    const [state, dispatch] = useReducer(simulatorSessionReducerWithLogging, initialState);

    return (
        <PhoneSimulatorShell>
            {lint.messages.length > 0 ? <SimulatorLintBanner messages={lint.messages} /> : null}
            <SimulatorWithSession state={state} dispatch={dispatch} />
        </PhoneSimulatorShell>
    );
}
```

**Search / deep links:** **`parseSimulatorSearchParams`**, **`applyDeepLinkToState`**, and **`getDeepLinkContactsSearch`** align URL query state with session state.

## Compare two payloads

```tsx
import { diffSimulatorPayloads } from '@signalsafe/simulator-react/utils/payload/simulatorPayloadDiff';
import { SimulatorDiffItem } from '@signalsafe/simulator-react/utils/payload/simulatorPayloadDiff';

const items: SimulatorDiffItem[] = diffSimulatorPayloads(leftPayload, rightPayload);
```

## Interaction events (host typing)

```tsx
import type { HostSimulatorEventHandler } from '@signalsafe/simulator-react/contract/hostContractTypes';

const onSimulatorEvent: HostSimulatorEventHandler = (event) => {
    /* forward to your API or analytics */
};

<SimulatorWithSession state={state} dispatch={dispatch} onSimulatorEvent={onSimulatorEvent} />;
```

## Developer tools panel

```tsx
import SimulatorDeveloperToolsPanel from '@signalsafe/simulator-react/developer-tools/SimulatorDeveloperToolsPanel';

<SimulatorDeveloperToolsPanel
    developerTools={{ preset: 'qa', sections: { reachability: true } }}
    payload={state.payload}
    timelineEntries={timelineEntries}
    runtimeIssues={runtimeIssues}
/>;
```

## Subpath exports (`package.json`)

Public imports use **explicit owner subpaths** declared in **`exports`**. Representative utility modules:

| Import | Purpose |
|--------|---------|
| `@signalsafe/simulator-react/utils/payload/validateSimulatorPayload` | JSON-schema style validation helper |
| `@signalsafe/simulator-react/utils/preview/simulatorPreviewReport` | Authoring / preview report builder |
| `@signalsafe/simulator-react/utils/payload/simulatorRealismChecks` | QA / fixture realism checks |
| `@signalsafe/simulator-react/utils/preview/previewFallbackWorld` | Preview fallback helpers + `PREVIEW_PLACEHOLDER_ID_PREFIX` |

Use the owner subpaths listed in `package.json` for all app/runtime UI. Undeclared deep paths and root imports are unsupported.

## Tests

```bash
yarn test
```

## Boundaries

- **In scope:** UI and state under `src/`, documented **`exports`** owner subpaths in `package.json`.
- **Out of scope:** routing, HTTP, auth — host apps supply payload and event handlers.
- **Side effects:** `sideEffects: false` — hosts supply layout/styling (CSS or UI kit) for `simulator-*` hooks and optional render slots.

## Development

Requires Node.js **>=19.0.0** (`engines.node`). CI runs checks, tests, and smoke on Node **22** and **24**; publish uses Node **24**.

`yarn build` uses `tsconfig.build.json` and resolves `@signalsafe/*` from `node_modules`. No sibling checkout is required for release validation.

```bash
yarn install
yarn build
yarn test
yarn typecheck
```

## Security

See [SECURITY.md](./SECURITY.md). Treat scenario payloads as trusted authoring content unless the host validates them. Gate learner-facing error detail in production hosts.

## Changelog and releases

- [CHANGELOG.md](./CHANGELOG.md)
- [RELEASING.md](docs/RELEASING.md)

## Presentation contract

See [presentation hooks](docs/presentation-contract.md) for explicit banner, compose-action, and Settings chrome hooks. These hooks are included in this release; consumers must install matching runtime/theme versions before removing older-version fallbacks. Existing navigation, screen-override, and placeholder contracts remain unchanged.

## Datasource and controlled phone views (0.3)

See [datasource contract and examples](docs/datasource.md) for JSON snapshots, refresh semantics, optional call/contact/history presentation and host-owned API adapters. The original scenario engine and JSON entry point remain supported.

## Host-controlled contact and compose workflows

- Phone numbers have shared display formatting across contact lists/details, messages,
  call views and history. `PhoneNumberFormatContext` can explicitly override it without
  rewriting callback identifiers or dial targets.
- `SimulatorRegionalPresentationProvider` from `contract/regionalPresentation` accepts
  `value: RegionalPreferences` to apply country, timezone, date-order and 12/24-hour
  preferences. Wrap the entire simulator so call-history lists and details agree with
  Settings. Without it, shared history uses the existing simulator locale/timezone.
  Only valid timezone-qualified ISO instants are converted; authored timestamp labels
  stay verbatim. An optional `formatDateTime` callback overrides date presentation.
- `formatPhoneNumber` from `contract/phonePresentation` is the pure display helper for
  host adapters. Canonical history JSON can include optional whole-second
  `duration_seconds`; omit unknown durations, and preserve zero.
- `ContactValuesEditor` supplies labeled phone/email/postal groups, stable value IDs,
  preferences, suggestions, add/remove controls and formatting without changing raw input.
- `PhoneContactEditor` accepts `valueFields`, `identityImage`, and `notice` slots. Its
  scalar-number contract is an alternative to grouped fields; unsupported scalar props
  are rejected when grouped fields own the values.
- `ContactPhotoControls` renders host-supplied current/fallback/selected previews and
  accessible change/remove/restore actions. The host owns validation, object URLs and storage.
- `EmailComposeContext`, `MessageComposeContext`, and `PhoneDialDraftContext` support
  controlled drafts. Email includes Bcc. Async compose failure preserves input.
- `SimulatorCapabilitiesContext` uses `SimulatorActionCapabilities` to declare action
  availability and visible reasons. This is distinct from the existing payload-inspection
  `SimulatorCapabilities` type. `CapabilityButton` associates its unavailable reason
  with the disabled control for assistive technology.

Contact search includes secondary values, labels and optional `postalAddresses`.
The theme owns contact-group layout and keypad geometry. Number entry and keypad
edits share one selection-aware value and preserve canonical submission callbacks.

## Release 0.16.3

Requires simulator-core 0.3.2 and TreeSpec ^0.4.1. React and React DOM remain on the supported 18.x peer contract. `ContactPhotoControls` supplies default SVG actions with localized accessible labels; hosts may override `actionIcons`. The optional theme owns dimensions and visual styling. Network requests, import identities, provider configuration and persistence remain host responsibilities.

## Node runtime compatibility

The runtime requirement is Node >=19.0.0. Build, unit-test and coverage tools use
Node 22/24 (use Node 24.16+ locally). A separate CI job installs packed artifacts
with strict engine checks and tests runtime behavior on Node 19.0.0 and 19–24.

The compatibility job builds this package and installs its declared dependencies
from npm with strict engine checks. For local audit integration use the pinned vendor artifacts. Before publication, replace file dependencies with released versions and run `yarn check:release`.
Regenerate each downstream lockfile after its upstream releases are available.
No sibling source overrides are used in the runtime matrix.

## Local app migration (0.17.0, release candidate)

- Export reusable Vault, Photos/editor/location, lock/settings, mutable Mailbox and HTML/React browser screens, page hooks and browser/file helpers.
- Add `SimulatorAppsProvider` for host formatting, notes editing, map rendering, file/metadata and lock adapters. Default notes use a plain textarea; external maps require an explicit host renderer.
- Add mailbox source slots and display adapters without importing host storage or import services.
- Add optional `photo`, `numberLabel` and `description` to `PhoneHistoryDetail`; media and number labels render inside the card body. Existing supplied descriptions still render.
- Require core 0.4.1; retain React 18 peers and add Lucide icons.

Use the matching registry version after its release workflow completes. See
[RELEASING.md](docs/RELEASING.md) for the coordinated release order and consumer
validation. Installed package files are never patched.

### App ownership and adapters

Pass a `DeviceStore` to each local app. The host owns revision notifications,
paging, asset persistence, write conflicts, backup/reset and user-facing storage
errors. Components await boolean writes and retain unsaved drafts on failure.
`SimulatorAppsProvider` merges nested adapters; supply stable component identities
for `Shell` and `NotesEditor` to avoid remounting edits. Host callbacks own network
activity. The default photo view renders coordinates without loading a map.
`SimulatorMailbox` accepts source render slots; its default send changes simulated
records only. For scenario email, opt in with `useScenarioEmailSource` from
`apps/mail/ScenarioEmailSource` and pass its non-null result in `sources`. Supply
`payload`, `selectedMessageId`, `onSelectMessage` and the local mailbox `identity`.
The shared source renders read-only Inbox/Sent/Trash content and creates separate
reply/forward drafts. A null payload omits the source; scenario and imported mail
are never added by default. Hosts own selection dispatch, permissions and data
loading, and imported evidence is not rewritten by the package.

`views/phone/usePhoneHistoryFocus` shares call-history keyboard focus between
controlled host adapters and `PhoneHistoryScreen`. Pass the active detail entry ID,
attach `rootRef` to the history container and `titleRef` to its focusable heading.
On return, it focuses the matching `button[data-simulator-history-id]` or the
history search. Related detail rows remain informational.

HTML pages use a sanitized sandbox and validated, page/session-bound action
messages; trusted React render callbacks run in the host.

### Example verification

`npm run smoke:package` compiles and executes the repository examples in an
isolated consumer against the packed public API. The examples do not resolve
sibling source trees or private source imports. The shared React 18 local-app
workflow is in [simulator-device/docs/examples/local-apps](https://github.com/SignalSafeSoftware/simulator-device/tree/main/docs/examples/local-apps).

## Source organization

See [module ownership](docs/module-organization.md) before adding a screen, host contract or shared control. Internal modules import their owners directly; explicit owner subpaths are the public package API. Run `yarn check:modules` to check internal re-exports, flat app modules and relative source imports.

### Shared app identifiers

Import `SimulatorApp` and `isSimulatorApp` directly from `@signalsafe/simulator-core`.
Use `SimulatorApp.Phone`, `.Email`, `.Messages`, `.Internet`, and `.Home` for app IDs.
The frozen enum-style object also supplies the `SimulatorApp` string-union type; existing JSON
values stay compatible. Use `isSimulatorApp(value)` at untrusted boundaries and
`Object.values(SimulatorApp)` when enumerating all apps. Do not confuse app IDs with
channels (`sms`, `browser`, `contacts`), screen names, or contact/input field kinds.

See [AGENTS.md](./AGENTS.md) for module ownership and verification rules. Root imports were removed in the local audit prerelease; use the explicit owner paths shown in the examples.

## Reusable settings forms

`apps/settings/RegionalSettings` is a controlled regional-format form. Supply `value`, country choices and `onSave`; storage belongs to the host. `apps/settings/regionalFormats` defines literal-compatible preference constants, a boundary guard and pure formatting helpers. Formatting language does not change interface translations.

`apps/settings/DeviceBackup` uses the core `DeviceStore` to edit email identity, download a backup, preview and confirm restore, or confirm reset. `apps/settings/parseBackup` validates the canonical store schema and the UTF-8 size limit. Downloads omit the screen password; restore/reset retain the current password. Provider/server backups do not belong to this form. Imports use the explicit defining subpaths; there are no re-exports.

## Shared contact details

`views/contacts/ContactDetailPanel` owns the read-only contact screen for scenario and device hosts: a photo card, name, and grouped phone, email and postal values. `ContactsView` uses it by default. Hosts supply `identityImage`, `actions`, `renderPhoneAction`, `notice` and `additionalDetails` slots for data retrieval and capabilities; they do not recreate the screen or style it locally. `additionalDetails` is additive; set `showPostalAddresses={false}` only when that slot renders the same addresses. `titleOnly` omits the header Back button when the device provides navigation; `footer` preserves a caller-owned local menu. Editing and persistence remain controlled by the host through `PhoneContactEditor`.

### Shared contact editor (0.21.0)

Hosts compose the add/edit contact page from `views/contacts/ContactEditorScreen` (title, notices), `ContactEditorForm` and `ContactDetailActions`. `ContactEditorForm` is controlled by `onSubmit` and `onCancel`, takes a `createId` function for new rows, and accepts `identityImage` and `identityExtras` slots for host photo controls. `contactFormModel` holds the pure form helpers. Storage, photo handling and navigation stay in the host.

### Shared call history (0.21.0)

`views/phone/PhoneHistoryLayout` renders the history header, `PhoneHistoryList` and optional `PhoneHistoryDetail`, with shared keyboard focus; pass host content (paging, confirmations) as children. `PhoneHistoryCallButton` renders the Call button, honoring the `call` capability, and `PhoneHistorySummaryTitle` renders the details heading from a `caller` or a `count`. Pass `plain` to `DevicePage` for a page without the default content inset.

History hosts use `PhoneHistoryHeader` from `@signalsafe/simulator-react/views/phone/PhoneHistoryHeader`. The shared banner defaults to Call History; pass `detail` for Call Details. Localization uses `calls.history` and `calls.details` through the simulator locale provider. It forwards a heading ref for detail focus; hosts retain data and navigation adapters.
