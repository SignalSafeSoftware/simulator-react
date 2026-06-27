# `@signalsafe/simulator-react`

React **device simulator** UI: session state, screen registry, template adapter, lint helpers, and optional developer tools. Built on `@signalsafe/simulator-core` for runtime stepping.

| | |
|---|---|
| **npm** | `@signalsafe/simulator-react` |
| **GitHub** | [SignalSafeSoftware/simulator-react](https://github.com/SignalSafeSoftware/simulator-react) |
| **Peer deps** | `react`, `react-dom` (no UI library required) |

## UI-kit agnostic

This package is **UI-kit agnostic**. It renders semantic HTML with stable **`simulator-*` class hooks** and optional **render slots** — it does **not** require Bootstrap, Material UI, or any other component library.

**Host applications own styling.** Provide CSS for `simulator-*` classes, or pass `renderChoice` / `renderFeedback` / `renderContactsOverlay` to inject your UI kit's components.

See [docs/UI_KIT_AGNOSTIC_USAGE.md](./docs/UI_KIT_AGNOSTIC_USAGE.md) for class hooks, slots, and DeliveryPlus migration guidance.

## What this package does

- Render **`SimulatorWithSession`** / **`PhoneSimulatorShell`** and registered scenario screens.
- Manage session state via **`simulatorSessionReducer`** (wraps core runtime dispatch).
- Adapt template detail → **`SimulatorTemplatePayload`** (`templateDetailToPayload`).
- Provide **shallow lint** (`lintSimulatorPayload`), reachability, deep-link, preview-fallback, and diff utilities.
- Optional **`SimulatorDeveloperToolsPanel`** for QA/debug views.

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

Requires Node.js **>=18** (`engines.node`). CI runs checks, tests, and smoke across Node **18**, **20**, **22**, and **24**; publish uses Node **24**.

`yarn build` uses `tsconfig.build.json` and resolves `@signalsafe/*` from `node_modules`. Ecosystem sibling `paths` in `tsconfig.json` apply to local typecheck/tests only.

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
