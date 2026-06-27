# UI-kit agnostic simulator — usage and migration

**Package:** `@signalsafe/simulator-react`  
**Status:** Implemented (0.2.0+)  
**Related:** [UI_KIT_AGNOSTIC_REFACTOR.md](./UI_KIT_AGNOSTIC_REFACTOR.md) (design scan)

---

## Summary

`@signalsafe/simulator-react` ships **composable React session UI, screen registry, and utilities** with semantic HTML and stable **`simulator-*` class hooks**. It does **not** require Bootstrap, Material UI, or any other UI library.

**The host application owns styling.** Map `simulator-*` classes to your design system, or pass render slots to inject host UI components (Bootstrap `Button`, MUI, etc.).

Peer dependencies: `react`, `react-dom` only.

---

## Architecture

| Layer | Package | UI library |
|-------|---------|------------|
| Runtime stepping | `@signalsafe/simulator-core` | None |
| Wire | `@signalsafe/tree-spec` | None |
| Session + screens | `@signalsafe/simulator-react` | **Host-owned** — semantic hooks and optional slots |

---

## Class hooks (`simulator-*`)

Shell, lists, buttons, alerts, and modals emit predictable class names from `src/ui/simulatorClasses.ts` and `src/simulatorStyles.ts`:

| Token | Example classes | Used for |
|-------|-----------------|----------|
| Card chrome | `simulator-card`, `simulator-card__header`, `simulator-card__body` | Dev reports, timeline |
| Lists | `simulator-list`, `simulator-list__item`, `simulator-list__item--action` | Contacts, inbox, history |
| Buttons | `simulator-btn`, `simulator-btn--primary`, `simulator-btn--neutral-outline` | Choices, actions, nav |
| Alerts | `simulator-alert`, `simulator-alert--warning` | Lint banner, inline feedback |
| Modals | `simulator-modal`, `simulator-modal__dialog`, `simulator-modal__body` | Contacts verification overlay |
| Forms | `simulator-input`, `simulator-field`, `simulator-field__label` | Search, compose, login forms |
| Layout | `simulator-flex`, `simulator-flex--column`, `simulator-muted` | Screen chrome |

**Tone mapping:** `SimulatorButton` and `renderSimulatorChoice` accept legacy tone strings (`primary`, `outline-secondary`, `link`, …). They map to `simulator-btn--*` hooks via `simBtnToneClass()`.

---

## Primitives (internal building blocks)

Small presentational components live in `src/ui/primitives.tsx`. They are **not** re-exported from the public barrel today; hosts typically style via `simulator-*` CSS or render slots. Maintainers may import from source when composing custom screens:

| Primitive | Role |
|-----------|------|
| `SimulatorButton` | `<button>` with `tone` → `simulator-btn--*` |
| `SimulatorInput`, `SimulatorTextarea` | Form controls |
| `SimulatorField`, `SimulatorLabel` | Field layout |
| `SimulatorCard` / `Header` / `Body` | Panel chrome |
| `SimulatorAlert` | Inline warnings and feedback |
| `SimulatorList` / `Item` | Selectable list rows |
| `SimulatorDialog` | Native `<dialog>` overlay |
| `SimulatorCollapse` | Expand/collapse sections |

---

## Render slots

Pass slots on **`SimulatorWithSession`** to replace default button/alert/modal markup without forking screen logic:

### `SimulatorWithSession`

| Prop | Purpose |
|------|---------|
| `renderChoice(choice)` | Host-owned buttons for Answer, Send, page actions, attachments, etc. |
| `renderFeedback(feedback)` | Host-owned inline warnings and feedback panels |
| `renderContactsOverlay(props)` | Replace the default contacts verification `<dialog>` |

### Slot prop types

```tsx
interface SimulatorChoiceRenderProps {
    label: ReactNode;
    onClick: () => void;
    tone?: string;
    className?: string;
    disabled?: boolean;
    'aria-label'?: string;
}

interface SimulatorFeedbackRenderProps {
    message: ReactNode;
    tone?: 'warning' | 'danger' | 'info';
    className?: string;
}

interface SimulatorContactsOverlayRenderProps {
    contacts: SimulatorSessionContact[] | null;
    verificationContext: { name?: string; number?: string } | null;
    onClose: () => void;
}
```

Slots propagate through the screen registry into **SMS**, **browser**, and **phone** views. Internal helpers `renderSimulatorChoice` and `renderSimulatorFeedback` in `src/ui/renderSlots.tsx` delegate to the slot when provided.

---

## Hooks (session behavior)

Session stepping and screen dispatch remain in existing exports — no new required hook for basic embedding:

| Export | Role |
|--------|------|
| `simulatorSessionReducer` / `simulatorSessionReducerWithLogging` | Session state transitions |
| `getInitialSessionState` | Build initial view from payload |
| `renderActiveScreen` / `resolveScreen` | Screen registry (used internally by `SimulatorWithSession`) |

Internal hook `useSimulatorSessionHandlers` wires dispatch, events, and render context; hosts use `SimulatorWithSession` rather than importing it directly.

---

## Minimal host integration (plain HTML + CSS)

```tsx
import { useReducer } from 'react';
import {
    SimulatorWithSession,
    PhoneSimulatorShell,
    getInitialSessionState,
    simulatorSessionReducer,
    type SimulatorTemplatePayload,
} from '@signalsafe/simulator-react';

// Host CSS — map simulator-* hooks (plain HTML styling, no UI library required)
import './simulator-host.css';

export function PlainSimulator({ payload }: { payload: SimulatorTemplatePayload }) {
    const [state, dispatch] = useReducer(simulatorSessionReducer, getInitialSessionState(payload));

    return (
        <PhoneSimulatorShell>
            <SimulatorWithSession state={state} dispatch={dispatch} />
        </PhoneSimulatorShell>
    );
}
```

Example host CSS (minimal):

```css
.simulator-btn { padding: 0.5rem 1rem; border: 1px solid #333; background: #fff; cursor: pointer; }
.simulator-btn--primary { background: #0d6efd; color: #fff; border-color: #0d6efd; }
.simulator-muted { color: #6c757d; font-size: 0.875rem; }
.simulator-modal::backdrop { background: rgba(0, 0, 0, 0.4); }
```

---

## Optional: Bootstrap in the host app (not a package requirement)

The snippets below are **host-app code**. `@signalsafe/simulator-react` does not depend on Bootstrap or `react-bootstrap`.

```tsx
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Modal from 'react-bootstrap/Modal';
import {
    SimulatorWithSession,
    PhoneSimulatorShell,
    type SimulatorChoiceRenderProps,
    type SimulatorFeedbackRenderProps,
} from '@signalsafe/simulator-react';

// Host loads Bootstrap CSS — not required by the package
import 'bootstrap/dist/css/bootstrap.min.css';

function BootstrapSimulator(props: { state; dispatch }) {
    return (
        <PhoneSimulatorShell>
            <SimulatorWithSession
                {...props}
                renderChoice={({ label, onClick, tone, disabled, 'aria-label': ariaLabel }) => (
                    <Button variant={tone ?? 'primary'} onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
                        {label}
                    </Button>
                )}
                renderFeedback={({ message, tone }) => (
                    <Alert variant={tone ?? 'warning'} className="small mb-0">
                        {message}
                    </Alert>
                )}
                renderContactsOverlay={({ contacts, verificationContext, onClose }) => (
                    <Modal show onHide={onClose} centered>
                        <Modal.Body>{/* host composes ContactsView or custom UI */}</Modal.Body>
                    </Modal>
                )}
            />
        </PhoneSimulatorShell>
    );
}
```

Alternatively, map `simulator-*` classes to Bootstrap utilities in host SCSS without render slots.

---

## DeliveryPlus migration (guidance only)

**Do not change DeliveryPlus in simulator package work.** When DeliveryPlus upgrades to `@signalsafe/simulator-react@0.2.0`:

1. **Remove** `react-bootstrap` as a peer dependency of this package — keep Bootstrap in DeliveryPlus if the app still uses it elsewhere.
2. **Choose a styling path:**
   - **CSS bridge:** map `simulator-*` → DeliveryPlus/Bootstrap theme, or
   - **Render slots:** pass `renderChoice`, `renderFeedback`, `renderContactsOverlay` with `react-bootstrap` components.
3. **Update tests** that assert `btn-*`, `list-group-*`, or `react-bootstrap` Modal markup — assert `simulator-*` or slot output instead.
4. **Short-term pin** — stay on `0.1.x` until host CSS or slots are ready; then bump to `0.2.0`.
5. **Future** — optional `@signalsafe/simulator-react-bootstrap` may provide a reference Bootstrap skin without coupling the core package.

Some shell views still contain legacy Bootstrap **CSS class strings** (`btn btn-*`, `d-flex`, …) in a few list/phone files. These are cosmetic; hosts override via CSS or slots. A follow-up release may finish migrating them to `simulator-*` only.

---

## Semver

**0.2.0** — removes `react-bootstrap` peer dependency; changes default DOM/class contract to `simulator-*` hooks; adds optional render slots on `SimulatorWithSession`. Component export names are largely unchanged; visual parity requires host CSS or slot wiring.
