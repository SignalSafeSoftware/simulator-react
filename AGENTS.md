# Development rules

## Shared simulator UI

Use one default PhoneMe UI across scenario and device hosts. simulator-react owns shared screens/primitives, simulator-device owns composition, and simulator-theme-bootstrap owns shared styling/tokens. Hosts supply data, callbacks, permissions and feature forms; do not create parallel skins or copy package screens. Preserve accessible states, custom slots, scenario actions and telemetry. Do not add re-exports or compatibility aliases. Verify packed artifacts in both DeliveryPlus and PhoneMe plus the device gallery before claiming parity. Local prerelease artifacts are not a published release.

Keep page banners flush to the screen edges and put insets on content only. Composer actions must have one explicit owner, independent of primary-menu state. Verify both scenario and device-app Home paths, selected-row contrast under custom appearance, and child-control clipping at 200% text; a non-overflowing outer shell can still clip its children.

SMS reply textareas are flush to the screen sides and the navigation below them; keep padding inside the textarea, not around its composer. In Call Details, related history rows are informational (no row button, focus target, or selected highlight); the main history list still navigates. The simulator mailbox omits PhoneMe's Imported email source; the separate Imports and backups archive remains available. SMS send restrictions stay accessible through the disabled action's description and title without adding footer prose.

Shared device pages use `simulator-app-page`, never a host's generic `screen-content` class. Put the header outside content wrappers and apply the shared content inset exactly once. Check the visible card/list edges, including nested Photos, Vault, mailbox and contact forms; measuring only the outer wrapper misses doubled margins. The gallery must exercise device-app routes as well as scenario routes. After replacing local package artifacts, restart its Vite dependency cache with `--force` before measuring. Compare header edges to the inner screen, excluding the bezel.

## Module ownership

Read `docs/module-organization.md`. Group device apps by feature, common controls under `ui`, host contexts under `contract`, and diagnostics under `developer-tools`. Internal modules import their declaring owners. Use explicit public owner modules; do not add barrels or compatibility shims. Run `yarn check:modules` and migrate consumers when moving public modules. Builds must remove stale generated modules.

## Public module contract

Import from the declaring module through explicit package subpaths. There is no root barrel. Core owns domain contracts and built-in app/screen constants; React owns reusable behavior and presentation; device owns composition. Do not add re-exports, alias wrappers, or forwarding-only modules. Browser page IDs remain case-sensitive author data. Run `yarn check:modules`, strict typechecks, lint, tests, build, and `yarn smoke:package` for package boundary changes. Every package typecheck includes tests. Update both host imports and artifact pins together.

Local integration tarballs must be allowlisted and recorded with SHA-256 in `vendor/npm/manifest.json`; run `yarn check:artifacts` before building. Never publish file-based dependencies: `yarn check:release` must pass before publication. These audit prereleases are local and unpublished.

## Canonical input and presentation contracts

Follow MIGRATION.md. Do not restore the synthetic template conversion, label-derived call kinds, old phone-shell CSS selectors, Bootstrap tone aliases, or old serialized field readers. Migrations belong in offline tooling, outside runtime code. Update package owner imports, both hosts, tests and theme together. Preserve distinct telemetry/navigation and editable-value/datasource behavior.
