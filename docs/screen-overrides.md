# Host screen overrides

`SimulatorWithSession` and `SimulatorPhoneDevice` accept the same optional
`screenOverrides: SimulatorScreenOverrides`. The package keeps its shell,
scroll region, semantic screen classes, primary/secondary navigation and dialogs.
Only the active screen's content changes. No service, router or provider is required.

```tsx
import type { SimulatorScreenOverrideProps, SimulatorScreenOverrides } from '@signalsafe/simulator-react';

function HostSettings({ onBack, location }: SimulatorScreenOverrideProps) {
    return (
        <section aria-label="Settings">
            <h1>Settings</h1>
            <p>Current screen: {location.screen}</p>
            <button type="button" onClick={onBack}>Back</button>
        </section>
    );
}

// Define component types outside render so ordinary updates preserve local state.
const screenOverrides: SimulatorScreenOverrides = { home: { settings: HostSettings } };
// <SimulatorPhoneDevice state={state} dispatch={dispatch} screenOverrides={screenOverrides} />
```

## Props and fallback

- `state`: current complete simulator session; updates normally while mounted.
- `location`: current app, screen and primary-menu visibility.
- `dispatch`: the package's existing PKG-02 intercepted dispatch boundary. Use it
  for navigation and supported simulator actions; do not mutate `state`.
- `onBack`: existing reducer Back behavior, including the current screen stack,
  through that same boundary. No parallel host stack is created.
- `renderDefault()`: lazy default screen rendering, including the existing
  unsupported-screen fallback. A wrapper can call it to augment package content.

The app maps use the existing phone/email/messages/home screen unions. Internet
keys are arbitrary payload page IDs. Omitted maps or screens use default rendering;
a component returning `null` intentionally renders empty content. A throwing
component follows the existing simulator error boundary, not silent default fallback.
Overrides do not add menu capabilities or invent destination IDs: the existing
payload and navigation rules still determine visible entry points.

## Entry, exit and ownership

Menu, screen action and local-navigation destinations all resolve the override
from committed session state. Observe `onNavigationEvent` for PKG-02 navigation
intent/disposition; only `delegated` requests reach the package reducer. A `handled`
request leaves its destination unmounted. Events describe dispatch, not React
commit, so use component effects for committed entry and cleanup for exit.
The component is keyed by app/screen: crossing destinations resets local state;
ordinary session updates at the same destination preserve it. Initial/deep-linked
state also mounts correctly without fabricating a navigation event. React StrictMode
may replay effects in development; cleanup must be safe to repeat.

Removing/replacing an override unmounts it and renders the default/new component.
Unmounting the device exits its override. Existing device contact-detail ownership
continues to take precedence while its contact editor is selected; screen overrides
do not replace those separate contact-detail or incoming-call-extra contracts.
Hosts own accessible labels, headings and focus management inside custom content.
Keep package shell/menu focus behavior intact and provide a clear Back control.

## Release and adoption gate

This is source acceptance only. No package is published and PhoneMe dependencies
remain unchanged. Release simulator-react as an additive minor containing both
PKG-02 and these exported types first. Then raise simulator-device's dependency
floor to that exact new minimum and release its additive minor; the device already
forwards the typed property through its inherited session contract. Publish/build
verification must check emitted declarations and included docs. Upgrade approved
consumers only after both releases, perform a clean install with React 18 peers,
and rerun default-consumer and override/back journeys against release artifacts.
Remove temporary source aliases from release checks. PhoneMe Settings integration
(APP-01) is separate work; PKG-01's release/adoption acceptance stays pending.

Tests in simulator-device `screenOverrides.test.tsx` are isolated generic consumers
of both actual source packages: Settings menu/local/action entry, fallback/null,
mount/unmount, intercepted navigation and Back. No Twilio or SSM dependency exists.
