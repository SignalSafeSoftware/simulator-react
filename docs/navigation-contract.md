# Navigation contract

`SimulatorWithSession`, `SimulatorPhoneDevice`, `SimulatorDevice`, and standalone
`SimulatorPhoneNav` accept `onNavigation` and `onNavigationEvent`. Hosts that
assemble their own dispatch surface can use `createSimulatorNavigationDispatch`.
Install one callback-owning boundary around a composed surface; the device does
this automatically for its menu and nested session. Never wrap an already owned
boundary with the same callbacks.

`onNavigation(request)` synchronously returns `handled`, `delegate`, or nothing.
Only `handled` suppresses package dispatch. The host then owns the requested
transition and its matching exit/back behavior. Package state, stack, and host
contact selection are untouched. Throwing aborts without fallback dispatch.
Promises are not supported. With no callback, legacy dispatch behavior (including
its function identity in the session) is retained.

Requests have `kind` (`app`, `screen`, `back`, `primary`, `cancel`) and `from`/`to`
locations (`app`, `screen`, `primaryMenu`). Locations describe the current and
proposed reducer result; they do not invent host routes. Semantic event identity
is kind plus these locations, independent of button/action source. Each dispatched
navigation request produces exactly one `onNavigationEvent` with the same data
and `disposition: handled | delegated`. Repeated clicks are separate requests;
a no-op destination remains observable but does not add a stack frame. This is
synchronous navigation observation, not durable analytics delivery.

Menu app switches and `open_app` normalize as app requests. Local navigation and
`navigate_screen` normalize as screen requests. Browser-screen, Back, Cancel and
primary-menu operations also pass through this boundary. Rendered Home Settings
uses the same screen request as `NAV_LOCAL home/settings`; every Settings
navigation entry therefore honors the callback. `open_settings` remains its
existing advisory interaction event, not a second navigation operation.
Existing `onSimulatorEvent` analytics are preserved and are not interception
callbacks; consumers must migrate navigation control to `onNavigation` and use
`onNavigationEvent` for consistent navigation observations.

## Back behavior

Local phone/email/messages screen transitions push their previous screen once;
reselecting a screen does not push. Back pops the package stack (existing
app-specific root fallback is preserved). Cancel clears the active app stack and
returns to its default. Secondary-menu Back returns to the primary menu; the
device no longer simulates Contacts Back using two artificial screen changes.
Home detail Back returns home. Hosts handling navigation maintain their own
history and must explicitly return to the package when their surface closes.
No package stack entry is added for an intercepted host surface.

## Release and consumer migration

Navigation interception is included in the published 0.3 React / 0.4 device lines and retained by React/device 0.16.2. Hosts may retain observers while moving navigation decisions to the synchronous handler. Install simulator-core, React and device in dependency order using their declared registry versions. React 18 peers remain supported. Package navigation has no application settings, credentials or provider dependency. See each repository's RELEASING.md and CHANGELOG.md for current release checks.
