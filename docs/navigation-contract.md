# Navigation contract (unreleased)

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

These APIs are additive source changes, not published artifacts. Release a new
simulator-react minor with these exports first, then simulator-device with its
minimum simulator-react dependency raised to that release. Preserve React 18
peer requirements. Run each repository's existing release preflight, package
smoke, and clean external consumer install checks against the selected versions.
Do not release device against the old dependency floor: it imports the new
factory at runtime. No version, lockfile, registry, or PhoneMe dependency was
changed in this batch. Consumers may keep legacy observers during migration;
move host navigation decisions to the synchronous handler before adopting
screen overrides. No screen slots, PhoneMe settings, credentials, or providers
are part of this contract.

Source compatibility tests use the actual sibling simulator-react source while
building device against the newly built declaration artifact, without editing
node_modules. The rendered Settings tests exercise both packages and preserve
legacy observers. Production consumers continue using their installed releases
until this ordered release and dependency upgrade is approved.

## Fifth-batch source verification

Node 24.16.0: simulator-react `npm test -- --maxWorkers=2` passed 289 tests,
`npm run lint` passed (Yarn 1 emitted its existing `url.parse` deprecation and
used a writable temporary cache), and `npm run build` passed. The first sandboxed
build blocked tsx's transient IPC socket; the approved build outside that socket
restriction passed. No package service or call runtime was started.

Simulator-device `npm test -- --config /private/tmp/phoneme-device-vitest.config.mjs`
passed 93 tests against sibling react source. Its strict `npm run typecheck --
--project /private/tmp/phoneme-device-build.json` and `npm run build -- --project
/private/tmp/phoneme-device-build.json` passed against new react declarations,
with device output isolated in `/private/tmp/phoneme-device-dist`. Those temporary
configs only select sibling source/declarations, preserve compiler strictness,
and avoid changing installed packages. The device's installed dependency is still
the old release; these are coordinated-source checks, not an installed-release
certification.

PhoneMe's existing smartphone, phone, Twilio provider and microphone tests passed
54/54 with temporary aliases to both actual source repositories. Its complete
strict TypeScript check also passed against the newly built package declarations.
The first consumer check caught `PhoneHistoryList` present in PhoneMe's installed
artifact exports but absent from the source barrel. The existing component is now
exported from source to retain that consumer contract. No installed artifact was
edited and no broader package-patch remediation was performed.

Both repositories initially had no tracked modifications and only their existing
untracked `.codex/` directories. Private tracked-source snapshots were taken before
edits. Hash comparison afterward found changes only in the assigned navigation
files and documentation; no original tracked files were removed. No credentials,
live records, `.codex/` contents, or other private ignored files were copied.
