# `@signalsafe/simulator-react`

React **device simulator** UI: **`SimulatorWithSession`** (and **`PhoneSimulatorShell`**), **session state** (`getInitialSessionState`, `simulatorSessionReducer`), **template → payload** adapter **`templateDetailToPayload`**, **lint / deep-link / preview-fallback** helpers, **payload diff**, and **screen registry** utilities. Build output is **`dist/`**; dependencies are listed in **`package.json`**.

Hosts supply a **`SimulatorTemplatePayload`** (typically by mapping API or template detail into that shape via **`templateDetailToPayload`**), then drive **`useReducer`** with **`simulatorSessionReducer`** (or **`simulatorSessionReducerWithLogging`**) and render **`SimulatorWithSession`**. **Preset and fixture helpers are not part of the published package surface.**

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

Run the **`test`** script from this package directory (see **`package.json`**):

```bash
npm test
```

## Boundaries

- **In scope:** UI and state under **`src/`**, the main barrel, and the **`exports`** subpaths above.
- **Out of scope:** routing, HTTP clients, and transport — the package does not perform network I/O; host apps wire **`SimulatorTemplatePayload`** and **`onSimulatorEvent`** as needed.
