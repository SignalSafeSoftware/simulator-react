# Module ownership

`simulator-react` contains components, hooks, contracts and browser helpers; they are not all screens or classes. Group by responsibility and import the declaring module directly.

| Directory | Owns |
| --- | --- |
| `apps/home`, `apps/browser`, `apps/mail`, `apps/photos`, `apps/vault`, `apps/lock` | Device apps and their feature-specific helpers |
| `apps/shared` | Device-app page composition, host adapters and file-reading support shared by apps |
| `views/{browser,contacts,email,home,messages,phone,shared}` | Scenario screens and controlled views, grouped by app |
| `ui` | Shared controls, lists, page slots, contacts, avatars, navigation and `ui/styles` class names |
| `contract` | Host policy, callback contracts and shared composition contexts |
| `hooks/device` | Device-store paging, record retrieval and visible-page state |
| `developer-tools` | Preview diagnostics, developer controls, reports and their configuration |
| `utils/navigation` | Nav graph, policy, reachability, deep links, keyboard commands, screen metadata |
| `utils/payload` | Payload validation, lint, diff, realism checks, capabilities and normalization |
| `utils/preview` | Preview report and fallback world |
| `utils/telemetry` | Action taxonomy, event mapping, snapshots, transition logging and verification context |
| `utils/browser` | The only module that reads the system clock, dialogs, clipboard and document listeners; tests stub it |
| `utils/lists` | Stable keys and text matching |
| `state`, `adapters`, `datasource`, `types` | Session behavior, input mapping, data access and local template types |

`apps/home/DeviceHome` owns the device Home heading, host header slot, tiles and optional lock action. The device package supplies navigation callbacks and decides whether locking is available; Home presentation must not read the store or own routing state.

`SimulatorPage` supplies generic page slots. `DevicePage` composes those slots with a device-app content container and host-supplied navigation. They have different responsibilities. `SimulatorList` provides list/row semantics; `SimulatorListGroup` provides a searchable loading/empty/paging surface. Keep these distinctions instead of merging by similar names.

`BrowserWorkbench` renders simulated HTML/React documents; `BrowserSimulatorView` and `BrowserPageRenderer` render scenario data. Both paths are active. Browser-only helpers (FileReader, DOMParser, image decoding) stay out of the headless simulator-core model package. Runtime inputs use the canonical contracts in MIGRATION.md; old serialized formats are migrated by offline tooling.

Export style: a module that holds one feature screen (apps, views, developer panels) uses a default export. Shared building blocks (`ui`, `apps/shared`, `contract`, `i18n`) and modules that export several symbols use named exports.

Public modules are exposed by explicit owner subpaths. There is no root forwarding boundary. Internal barrel files, compatibility wrappers and imports through the package's own entry are prohibited. Import canonical device schemas/types from simulator-core, and local template-specific shapes from `types/template.ts`. Do not restore removed `actions/index.ts`, `screenRegistry/index.ts`, or `datasource/validateDeviceJson.ts` shims.

Wide props are split into role interfaces that the public props extend (`contract/sessionHostProps`, `views/contacts/contactsViewRoles`, `views/phone/phoneCallViewRoles`, and the `SimulatorApps*` host interfaces). Add a prop to the role it belongs to, not to a growing flat interface.

Screen registry entries are created with `bind(component, getProps)`, so each entry renders its own component with its own props without a cast.

Run `yarn check:modules`, `yarn check:cycles`, `yarn check:duplication`, lint, format, types, tests and build. The module check runs in CI and rejects internal re-exports, flat app/component files and unresolved relative source imports. Builds clean generated `dist` first so removed paths cannot survive in published artifacts. Preserve the public entry and declared utility subpaths when reorganizing source; verify the packed package in actual consumers.
