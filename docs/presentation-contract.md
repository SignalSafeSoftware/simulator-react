# Presentation hooks

These semantic CSS hooks are included in the current runtime release and supported by the shared theme. Accessible names remain independent of selectors.

| Hook | Role |
| --- | --- |
| `.simulator-screen__header` | Existing simple screen banner |
| `.simulator-screen__header-row` | Email inbox, Messages thread list, and Contacts row banners |
| `.simulator-email__compose-action` | Email Compose action; accessible name remains `Compose email` |
| `.simulator-messages__compose-action` | Messages compose action; accessible name remains `New thread` |
| `.simulator-home-settings__back-bar` | Default Home Settings back bar; name remains `Back to Home` |
| `.simulator-home-settings__header` | Default Home Settings title banner |

Hosts may style or suppress the explicit Settings chrome when they supply their own heading and navigation. Compose hooks apply only to the matching compose actions, not to Contacts actions. The back bar accepts an optional `className`; omitting it preserves default markup classes. Hooks do not change navigation, event delivery, providers, storage, or payload contracts.

Use theme tokens for host branding. Shared screen geometry belongs in the theme, while application navigation and provider state belong to the host. Validate full device shells as well as isolated controls when changing layout.
