# Native history consumer contract

`PhoneHistoryList` and `PhoneHistoryListProps` are exported from the package root. This additive source contract is available for reproducible local consumer artifacts; registry publication is a separate release gate.

The list retains its native rows, search, empty state, incoming-call card, and voicemail behavior. `onSelectEntry(id)` makes ordinary rows actionable. Hosts own selected-call details, persistence, pagination, deletion confirmation, and recovery; the list does not issue requests or place calls.

Optional consumer controls:

- `searchQuery` controls the search value; omit it to keep built-in local state. `onSearchQueryChange(query)` reports changes in either mode. Filtering still matches native name, number, timestamp, and label fields.
- `searchAriaLabel` changes the accessible search name; the default remains `Search calls`.
- `selectedEntryId` marks the matching native row with `aria-current="true"` without changing navigation.
- `renderEntryActions(entry)` adds host actions as siblings of the native row button, preventing nested interactive controls. Returning null omits the action group.

When actions exist, `.simulator-phone-history-entry` groups the native row and its sibling actions for layout. Without actions, the default row DOM is unchanged. Stable presentation hooks are `.simulator-phone-history-row`, `.simulator-phone-history-actions`, and `.simulator-phone-history-search`. The host must keep meaningful labels on supplied actions. A host that filters server-side must provide native fields compatible with the displayed query; selected-detail lookup may retain a broader history than the visible search results.

The existing dialer also accepts `--simulator-phone-dialer-digit-font-size` with the unchanged `1.1rem` default. This permits theme customization without overriding inline size with `!important`.

## Honest composition defaults

Email compose and Messages new-thread retain their native form layouts. When `onSend` is absent, fields and Send are disabled and an explicit unconfigured status is displayed. Cancel still navigates back. An explicit callback enables composition; Messages accepts `{ phoneNumber, messageBody }`, while Email retains `{ to, subject, body }`. Callbacks belong to the embedding consumer and do not imply real delivery. Default registry screens do not configure transmission.
