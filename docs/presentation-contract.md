# Presentation hooks (local source contract)

These additive CSS hooks identify presentation roles without deriving styling from accessible names or generic flex utilities. Existing utility classes and accessible names remain unchanged. They are implemented in source and included in PhoneMe’s pinned private local artifacts. Registry simulator-react 0.2.11 does not contain these new hooks; registry release and broader consumer adoption remain separate gates.

| Hook | Role |
| --- | --- |
| `.simulator-screen__header` | Existing simple screen banner |
| `.simulator-screen__header-row` | Email inbox, Messages thread list, and Contacts row banners |
| `.simulator-email__compose-action` | Email Compose action; accessible name remains `Compose email` |
| `.simulator-messages__compose-action` | Messages compose action; accessible name remains `New thread` |
| `.simulator-home-settings__back-bar` | Default Home Settings back bar; name remains `Back to Home` |
| `.simulator-home-settings__header` | Default Home Settings title banner |

Hosts may style or suppress the explicit Settings chrome when they supply their own heading and navigation. Compose hooks apply only to the matching compose actions, not to Contacts actions. The back bar accepts an optional `className`; omitting it preserves default markup classes. Hooks do not change navigation, event delivery, providers, storage, or payload contracts.

PhoneMe's migration replaces its Email/Messages `aria-label` selectors with the two compose hooks, its Settings `div:has(...)` suppression with the Settings back-bar hook, and all banner `flex...:has(> span)` selectors with the header-row hook. Consumers on older registry versions need compatibility fallbacks until matching package/theme artifacts are installed and verified. PhoneMe uses its reviewed local artifact workflow. The theme package's new header-row CSS requires the corresponding React hooks; do not release or adopt that theme change against an older React package without compatibility review.

Tenth-batch verification used built source through isolated Vite aliases, leaving PhoneMe's installed packages unchanged. Semantic tests preserve accessible names; package tests/typecheck/build/smoke and default/PhoneMe browser comparisons are recorded in PhoneMe's `docs/tenth-batch-evidence.md`. This is source verification, not publication or full PKG-04 acceptance.
