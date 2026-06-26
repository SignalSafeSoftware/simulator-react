# `@signalsafe/simulator-react`

React **device simulator** UI: session state, screen registry, template adapter, lint helpers, and optional developer tools. Built on `@signalsafe/simulator-core` for runtime stepping.

| | |
|---|---|
| **npm** | `@signalsafe/simulator-react` |
| **GitHub** | [SignalSafeSoftware/simulator-react](https://github.com/SignalSafeSoftware/simulator-react) |
| **Peer deps** | `react`, `react-dom`, `react-bootstrap` |

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
npm install @signalsafe/simulator-react react react-dom react-bootstrap
```

Use a modern **ESM** TypeScript setup.

## Repository

Source code and issues are available at:
https://github.com/SignalSafeSoftware/simulator-react

```ts
import 'bootstrap/dist/css/bootstrap.min.css';
```

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
npm test
```

## Boundaries

- **In scope:** UI and state under `src/`, main barrel exports, and documented **`exports`** subpaths in `package.json`.
- **Out of scope:** routing, HTTP, auth — host apps supply payload and event handlers.
- **Side effects:** `sideEffects: false` — load Bootstrap CSS in the host app (`import 'bootstrap/dist/css/bootstrap.min.css'`).

## Development

```bash
npm install
npm run build
npm test
npm run typecheck
```

## Security

See [SECURITY.md](./SECURITY.md). Treat scenario payloads as trusted authoring content unless the host validates them. Gate learner-facing error detail in production hosts.
