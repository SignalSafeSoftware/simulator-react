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
[`examples/demo-home-fixture.ts`](./examples/demo-home-fixture.ts).

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
npm install @signalsafe/simulator-react react react-dom
```

Use a modern **ESM** TypeScript setup. Style simulator UI via host CSS targeting `simulator-*` class hooks, or pass render slots for full UI-kit control (see [UI_KIT_AGNOSTIC_USAGE.md](./docs/UI_KIT_AGNOSTIC_USAGE.md)).

## Minimal example (plain HTML + host CSS)

No Bootstrap or other UI library is required:

```tsx
import { useReducer } from 'react';
import {
    SimulatorWithSession,
    PhoneSimulatorShell,
    getInitialSessionState,
    simulatorSessionReducer,
    templateDetailToPayload,
    type SimulatorTemplateDetail,
} from '@signalsafe/simulator-react';

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
| Main barrel | **`src/index.ts`** |
| Session reducer | **`src/state/simulatorSessionReducer.ts`** |
| Template → payload adapter | **`src/adapters/templateToSession.ts`** (`templateDetailToPayload`) |
| Screen registry | **`src/screenRegistry/`** |
| Utilities | **`src/utils/`** (lint, reachability, deep link, diff, contact search, …) |

## Integration pattern

Convert template detail to a payload, validate and optionally apply preview fallback, build initial state, then render the shell and session:

```tsx
import { useReducer } from 'react';
import {
    SimulatorWithSession,
    PhoneSimulatorShell,
    SimulatorLintBanner,
    templateDetailToPayload,
    getInitialSessionState,
    simulatorSessionReducerWithLogging,
    lintSimulatorPayload,
    parseSimulatorSearchParams,
    applyDeepLinkToState,
    getDeepLinkContactsSearch,
    applyPreviewFallback,
    type SimulatorSessionState,
    type SimulatorDispatchAction,
    type SimulatorInteractionEvent,
    type SimulatorTemplateDetail,
} from '@signalsafe/simulator-react';

// `SimulatorTemplateDetail` is defined in `src/types/portableSimulator.ts`.
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
import { diffSimulatorPayloads, type SimulatorDiffItem } from '@signalsafe/simulator-react';

const items: SimulatorDiffItem[] = diffSimulatorPayloads(leftPayload, rightPayload);
```

## Interaction events (host typing)

```tsx
import type { HostSimulatorEventHandler } from '@signalsafe/simulator-react';

const onSimulatorEvent: HostSimulatorEventHandler = (event) => {
    /* forward to your API or analytics */
};

<SimulatorWithSession state={state} dispatch={dispatch} onSimulatorEvent={onSimulatorEvent} />;
```

## Developer tools panel

```tsx
import { SimulatorDeveloperToolsPanel } from '@signalsafe/simulator-react';

<SimulatorDeveloperToolsPanel
    developerTools={{ preset: 'qa', sections: { reachability: true } }}
    payload={state.payload}
    timelineEntries={timelineEntries}
    runtimeIssues={runtimeIssues}
/>;
```

## Subpath exports (`package.json`)

Imports outside the main barrel are **explicit** and **versioned** in **`exports`**:

| Import | Purpose |
|--------|---------|
| `@signalsafe/simulator-react/utils/validateSimulatorPayload` | JSON-schema style validation helper |
| `@signalsafe/simulator-react/utils/simulatorPreviewReport` | Authoring / preview report builder |
| `@signalsafe/simulator-react/utils/simulatorRealismChecks` | QA / fixture realism checks (not on main barrel) |
| `@signalsafe/simulator-react/utils/previewFallbackWorld` | Preview fallback helpers + `PREVIEW_PLACEHOLDER_ID_PREFIX` |

Other deep import paths are **unsupported**. Prefer the main barrel for app/runtime UI.

## Tests

```bash
yarn test
```

## Boundaries

- **In scope:** UI and state under `src/`, main barrel exports, and documented **`exports`** subpaths in `package.json`.
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
- [RELEASING.md](./RELEASING.md)

## Presentation contract

See [presentation hooks](docs/presentation-contract.md) for explicit banner, compose-action, and Settings chrome hooks. These hooks are included in this release; consumers must install matching runtime/theme versions before removing older-version fallbacks. Existing navigation, screen-override, and placeholder contracts remain unchanged.

## Datasource and controlled phone views (0.3)

See [datasource contract and examples](docs/datasource.md) for JSON snapshots, refresh semantics, optional call/contact/history presentation and host-owned API adapters. The original scenario engine and JSON entry point remain supported.

## Host-controlled contact and compose workflows

- `PhoneNumberFormatContext` formats display values across contact lists/details,
  messages, call views and history. It does not rewrite callback identifiers or dial targets.
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
from npm with strict engine checks. Release core 0.3.2 first, then React 0.16.3,
then device 0.16.3; regenerate each downstream lockfile after its upstream release
is available. No sibling source overrides are used in the runtime matrix.
