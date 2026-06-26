I reviewed the accessible files in `SignalSafeSoftware/simulator-react`. Overall: **this package is useful and fairly mature, but it is broader than the name suggests: it is not just React rendering; it also owns session reducer state, payload adapters, linting, preview fallback, deep links, developer tools, screen registry, and simulator utilities. That can be okay, but the README and package boundary should be very explicit.**

## Executive take

`@signalsafe/simulator-react` is positioned as a reusable React device simulator shell with no routing or API ownership. `package.json` says exactly that, and the package depends on `@signalsafe/simulator-core` and `@signalsafe/tree-spec` while keeping React, React DOM, and React Bootstrap as peers.

The README is decent: it explains the integration pattern, Bootstrap CSS requirement, subpath exports, interaction events, developer tools, tests, and boundaries.

The main barrel is intentionally large and includes state, types, action taxonomy, adapters, world-section helpers, nav graph helpers, linting, reachability, deep links, preview fallback, diffing, event mapping, capabilities, contact normalization, screen registry, views, shell components, error boundary, lint banner, and host event types.  That makes this more of a **React simulator SDK** than a thin React component library.

The biggest issues:

1. **CI/release has the same risky PR-label publish pattern.**
2. **PR checks/tests are label-gated.**
3. **Tests exist but appear thin relative to the package size.**
4. **`sideEffects: false` may be too aggressive for a React/Bootstrap UI package.**
5. **Standalone repo has monorepo-relative scripts.**
6. **No visible `SECURITY.md` or `CHANGELOG.md`.**
7. **The README should better explain how this relates to `simulator-core` and TreeSpec runtime flows.**

## Documentation advice

Your README is better than a stub, but this package has enough surface area that it needs clearer package layering.

### 1. Add a “package layers” section

Right now the README says this package uses session state and helpers, but it does not clearly explain the split with `@signalsafe/simulator-core`. Add:

```md
## Package layers

| Package | Owns | Does not own |
|---|---|---|
| `@signalsafe/simulator-core` | TreeSpec runtime stepping, score deltas, terminal outcomes, node views | React, Bootstrap, device shell, API, routing |
| `@signalsafe/simulator-react` | React device shell, app screens, session reducer, payload adapter, lint/deep-link/devtool helpers | HTTP, routing, persistence, auth |
```

This matters because `simulator-react` depends on `simulator-core`, but much of the visible session reducer is full-device UI state, not TreeSpec stepping.

### 2. Add a “what this package does not do” section

The README has a short boundaries section saying no routing, HTTP clients, or transport.  Expand it:

```md
## What this package does not do

This package does not:
- fetch templates
- save attempts
- send analytics
- know about users, companies, assignments, or permissions
- own React Router / Next.js routing
- persist simulator state
- sanitize or transform server HTML
```

### 3. Fix integration example mismatch

The README example uses:

```tsx
{lint.messages.length > 0 ? <SimulatorLintBanner messages={lint.messages} /> : null}
```

But `lintSimulatorPayload` returns `{ warnings }`, not `{ messages }`.  Either the README is outdated or `SimulatorLintBanner` expects a mapped message list. Fix the example:

```tsx
const lint = lintSimulatorPayload(payload);
const lintMessages = lint.warnings.map((w) => w.path ? `${w.path}: ${w.message}` : w.message);

{lintMessages.length > 0 ? <SimulatorLintBanner messages={lintMessages} /> : null}
```

This is the most concrete documentation bug I saw.

### 4. Explain subpath exports more fully

You already list the explicit subpath exports and say other deep imports are unsupported.  Good. Add one sentence saying these are intentionally excluded from the main barrel because they are tooling/QA-oriented:

```md
These helpers are intentionally subpath-only so normal runtime hosts do not accidentally pull QA/reporting utilities into the main app bundle.
```

This matches the barrel comment that some utilities are intentionally not re-exported from the main barrel.

### 5. Add payload shape docs

The package needs a short “minimum payload shape” section:

```ts
type MinimumSimulatorTemplatePayload = {
  channel: "email" | "sms" | "browser" | "phone" | "home" | "contacts";
  entryPoint?: { app: "email" | "messages" | "internet" | "phone" | "home"; screen?: string } | null;
};
```

`validateSimulatorPayload` only hard-validates that payload is an object and has a supported channel.  The README should clarify that deeper validation/linting is advisory or handled elsewhere.

## Test advice

The test setup is present: Vitest runs in Node, includes `tests/**/*.test.ts`, and collects V8 coverage over `src/**`.  I found tests for `simulatorSessionReducer` and `validateSimulatorPayload`. `simulatorSessionReducer.test.ts` covers browser entry screen selection, default fallback, back navigation, click-link behavior, and ignoring local navigation for inactive apps.  `validateSimulatorPayload.test.ts` covers valid channels and invalid payload/channel cases.

That is a good start, but thin for a package this large.

### 1. Add barrel/export tests

I could not find `tests/index.test.ts`. Add a package root export test, especially because the barrel has careful export-order comments.

Test:

```ts
import * as pkg from "@signalsafe/simulator-react";

expect(pkg.SimulatorWithSession).toBeTypeOf("function");
expect(pkg.PhoneSimulatorShell).toBeTypeOf("function");
expect(pkg.getInitialSessionState).toBeTypeOf("function");
expect(pkg.simulatorSessionReducer).toBeTypeOf("function");
expect(pkg.templateDetailToPayload).toBeTypeOf("function");
expect(pkg.lintSimulatorPayload).toBeTypeOf("function");
```

Also test subpath exports:

```ts
import { validateSimulatorPayload } from "@signalsafe/simulator-react/utils/validateSimulatorPayload";
import { runSimulatorRealismChecks } from "@signalsafe/simulator-react/utils/simulatorRealismChecks";
```

### 2. Add adapter tests

`templateDetailToPayload` is important and has nuanced behavior: it reads `detail.simulator`, ignores `content_json`, normalizes template name/topics, maps legacy channel, validates entry point app, returns a stable empty payload when simulator/entry_point is missing, maps full-device slices, and carries run/attempt IDs.

Add tests for:

```ts
missing simulator returns empty payload
simulator with invalid entry_point returns empty payload
valid entry_point app determines channel
legacy channel fallback maps browser -> browser, sms -> sms, unknown -> email
runId and attemptId are preserved
topics are normalized with fallback keys/names
contacts empty list becomes null
content_json is ignored
```

### 3. Add lint tests

`lintSimulatorPayload` does a lot: empty entry apps, unreachable browser targets, bare browser pages, missing sender identity, phone verification without contacts, duplicate keys, and key naming warnings.

Add tests for every warning code:

```ts
entry_app_empty
entry_point_unreachable
unreachable_action_target
browser_page_bare
messages_no_sender_identity
phone_verification_without_contacts
duplicate_keys
key_naming
```

### 4. Add reducer tests beyond browser

Current reducer tests are browser-heavy. Add tests for the other actions shown in the reducer:

```ts
SWITCH_APP
NAV_LOCAL for active app
BACK_TO_PRIMARY
CANCEL
SELECT_EMAIL
SMS_REVEAL_NEXT
BROWSER_SCREEN
PHONE_CHOOSE
TOGGLE_CONTACTS_PANEL
SET_CONTACTS_SEARCH
SIMULATOR_ACTION variants besides click_link
```

The reducer routes all these action types.

### 5. Add component smoke tests

`SimulatorWithSession` is central. It renders developer tools, shell, active screen, error boundary, and contact modal.  Add smoke tests with `react-test-renderer` or jsdom:

```ts
renders PhoneSimulatorShell with active app metadata
renders UnsupportedScreenFallback for unknown screen
opens contacts modal when contactsPanelOpen=true
passes exitLink instead of exitTo when provided
hides bottom nav on email/detail and message thread_detail
renders developer toolbar when developerTools enable it
```

### 6. Add error boundary tests

`SimulatorErrorBoundary` catches render/lifecycle errors, logs them, renders an alert, shows the error message/component stack, and optionally renders a Dismiss button.

Test:

```ts
renders children normally
renders fallback when child throws
calls console.error
renders retry/dismiss button when onRetry provided
```

### 7. Add tarball smoke test

The package has explicit subpath exports and a build script that post-processes ESM imports.   That deserves a tarball smoke test:

```bash
yarn build
npm pack
mkdir /tmp/simulator-react-smoke
cd /tmp/simulator-react-smoke
npm init -y
npm install react react-dom react-bootstrap /path/to/signalsafe-simulator-react-*.tgz
node -e "import('@signalsafe/simulator-react').then(m => console.log(typeof m.SimulatorWithSession))"
node -e "import('@signalsafe/simulator-react/utils/validateSimulatorPayload').then(m => console.log(typeof m.validateSimulatorPayload))"
```

## Security and safety notes

### 1. No network ownership is good

The package explicitly says it does not perform network I/O and hosts wire payloads/events.  `SimulatorWithSession` has an `onSimulatorEvent` callback for normalized host events rather than sending HTTP itself.  That is the right boundary.

### 2. Error boundary may expose component stack

`SimulatorErrorBoundary` renders `errorInfo.componentStack` in the UI.  This is useful for internal admin/QA, but not ideal for learner-facing production. Add a prop:

```ts
showErrorDetails?: boolean
```

Default it to `false` for end-user contexts, or document that hosts should only use detailed error stacks in admin/preview mode.

### 3. `validateSimulatorPayload` is very shallow

It only checks object-ness and channel.  That is okay if deeper validation happens at API/import time, as the comments say.  But the README should not imply this is full schema validation. Rename or document it as:

```ts
validateSimulatorPayloadMinimumShape
```

or keep the name and add a README warning.

### 4. XSS/sanitization

I did not see direct HTML injection in the files reviewed. Continue avoiding `dangerouslySetInnerHTML` for email/browser/message content unless you add a sanitizer and strong tests. Simulator content is author-controlled but may still become user-facing.

### 5. Add `SECURITY.md`

I did not find a visible `SECURITY.md`. Add one across the package set:

```md
# Security Policy

Please report suspected vulnerabilities privately.

Email: security@signalsafe.software

Do not open public issues for security reports.
```

### 6. Dependabot

This package has React/React Bootstrap peers, a runtime dependency on `simulator-core`, and a build-time dependency on `tsx`.  Add Dependabot for npm and GitHub Actions.

## Release / CI advice

The workflow has the same risky pattern as the other repos:

Typecheck/tests run on push/manual, but for PRs only when labels like `checks` or `tests` are present.  Publish can run from manual dispatch or a PR with a `publish` label.

I would change this everywhere.

### Run checks/tests on every PR

Remove the label gates from `checks` and `tests`.

### Do not publish from PR events

Publish only from tags/releases or manual `main` with environment approval:

```yaml
publish:
  if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'
  environment: npm-production
  permissions:
    contents: read
    id-token: write
```

Also consider npm provenance/trusted publishing.

### Add Node matrix

Package claims Node `>=18`, but CI uses Node 24 only.   Test at least Node 18 and 24.

## Packaging advice

The package metadata is good in several ways: ESM, explicit root and subpath exports, restricted files, public publish config, Node `>=18`, and peers for React/Bootstrap.

I would change:

### 1. Revisit `sideEffects: false`

This is a React/Bootstrap UI package. Even if it does not currently import CSS, `sideEffects: false` is risky if you later add CSS imports or setup modules.  Safer:

```json
"sideEffects": [
  "**/*.css"
]
```

or remove it until packaging is stable.

### 2. Add `packageManager`

```json
"packageManager": "yarn@1.22.22"
```

### 3. Clean up monorepo-only scripts

Several scripts reference `../../scripts` or `../../frontend`.  In a standalone repo, those can confuse contributors. Either vendor them or rename them as internal:

```json
"internal:release:check": "...",
"internal:test:monorepo": "..."
```

### 4. Reconsider `prepare`

`prepare` runs build.  `prepublishOnly` is usually enough unless you intentionally support installing from git source.

### 5. React 19 compatibility

Peer deps are React 18-only.  Test React 19 and then loosen if it works:

```json
"react": "^18.0.0 || ^19.0.0",
"react-dom": "^18.0.0 || ^19.0.0"
```

## Code-quality observations

### 1. Package surface is large

The barrel exports many utilities and views.  This may be fine, but I would explicitly classify exports:

```md
Stable public runtime exports
Stable public component exports
Tooling/QA subpath exports
Legacy/compatibility exports
```

Otherwise this package may become hard to version safely.

### 2. The adapter is intentionally defensive

`templateDetailToPayload` returns a stable empty payload rather than throwing when simulator/entry_point is missing.   That is good for preview stability. Make sure lint/devtools clearly surface when an empty payload is being shown so bad authoring data is not silently accepted.

### 3. The reducer is simple and testable

The reducer delegates most behavior to handlers and keeps the top-level switch readable.  This is good. Add action coverage and keep reducer logic pure.

### 4. `SimulatorWithSession` is doing a lot

It owns active screen rendering, developer controls, shell, metadata, secondary menu, contact modal, verification context, error boundary, and bottom nav visibility.  This is not a problem yet, but if it grows, split into:

```ts
useSimulatorActiveScreen
useSimulatorShellProps
SimulatorContactsModal
SimulatorDeveloperToolsRegion
```

### 5. Build post-processing is a smell worth documenting

The build script runs `tsx ./scripts/fix-node-esm-relative-imports.ts dist` after `tsc`.  This may be necessary for Node ESM extension handling, but document why it exists. It is also a good reason to add tarball smoke tests.

## Priority checklist

I’d do this order:

1. **Fix README lint example**: `lint.messages` should likely be `lint.warnings`.
2. **Remove PR-label publishing**; publish only from tag/release/manual `main` with approval.
3. **Run checks/tests on every PR.**
4. **Add barrel and subpath export tests.**
5. **Add adapter tests for `templateDetailToPayload`.**
6. **Add lint warning tests for every `lintSimulatorPayload` warning code.**
7. **Add reducer tests for all action types.**
8. **Add component smoke tests for `SimulatorWithSession` and `SimulatorErrorBoundary`.**
9. **Add `SECURITY.md` and `CHANGELOG.md`.**
10. **Document package layers, shallow validation limits, and build post-processing.**

My honest assessment: **this package has a strong boundary around transport/routing and a useful API, but it is large enough that it needs stronger tests and clearer API classification before I would treat it as stable public infrastructure.**
