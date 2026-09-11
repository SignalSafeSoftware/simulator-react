# Datasource snapshots (0.3)

`createSimulatorDatasource(source)` accepts full-device JSON text or a parsed object. It exposes `calls`, `contacts`, `sms`, `email` and `context`, reusing the existing session types and full-device mapper. No fetching, credentials, storage or action handlers are required.

```tsx
import { createSimulatorDatasource } from '@signalsafe/simulator-react';
import { SimulatorDevice } from '@signalsafe/simulator-device';
const datasource = createSimulatorDatasource({
  entry_point: { app: 'phone', screen: 'history' },
  contacts: [{ id: 'alice', display_name: 'Alice', number: '+12025550123' }],
  phone: {
    incoming_call: { caller_name: 'Alice', transcript: 'Example scenario' },
    history: [{ id: 'call-1', name: 'Alice', number: '+12025550123', direction: 'missed' }],
  },
  email: { messages: [{ id: 'mail-1', folder_id: 'inbox', subject: 'Hello', from: 'alice@example.test', snippet: 'Example email' }] },
  messages: { threads: [{ id: 'thread-1', contact_name: 'Alice', snippet: 'Hello' }], thread_detail: { id: 'thread-1', messages: [{ from: 'them', text: 'Hello' }] } },
});
<SimulatorDevice datasource={datasource} />;
```

The existing `value={json}` API remains available and tolerant. Pass exactly one of `value` and `datasource`: TypeScript rejects both, and runtime throws for both. The strict adapter accepts an absent `schema_version` (legacy v1) or `schema_version: 1`; malformed JSON, unsupported versions, invalid known fields and duplicate collection identities throw errors containing the field path. Unknown additive fields do not change established normalization. This is the existing full-device format, not an importer for email archives or arbitrary provider exports.

Snapshots are copied and recursively frozen at runtime; properties are readonly in the public interface. Use `simulatorDatasourceToPayload` to obtain a mutable session copy. Typed hosts with already validated session data can use `createSimulatorDatasourceFromPayload`; this helper only performs the existing minimal session validation and is not an untrusted-input validator.

Calls retain scenario `content`, choices and `callHistory` separately. Context retains Home, Internet, navigation configuration and session metadata. Ordering, IDs and timestamp strings follow the existing mapper; the adapter does not sort, convert time zones, infer unknown callers or fetch attachments. Missing app sections retain their existing null/default behavior. Existing full-device conventions still apply: phone content requires `incoming_call`, SMS content requires `thread_detail.messages`, and the email list presents sender/snippet while detail presents the subject/body. An attachment reference remains a reference, not downloaded bytes.

Keep datasource identity stable until content changes. Replacement preserves the existing view state and mounted component drafts. A selected email removed from all folders is reconciled to its list. Other missing records continue to use existing view fallbacks. The legacy `value` replacement behavior still starts a new session. Hosts replacing the scenario itself should explicitly remount/reset the session; snapshot refresh is intended for updates within the same scenario. Reducer actions and choices remain session-owned and callbacks remain separate from content.

## Optional controlled presentation

`PhoneKeypad` is shared with the existing scenario dialer. `PhoneCallView` takes plain caller/status/timing values and explicit answer, end, mute and digit callbacks. Its clock only formats elapsed duration and is cleaned up on unmount; it cannot initiate a call or drive scenario transitions. `PhoneContactEditor` provides native form fields and save/cancel callbacks; persistence, revisions, conflicts and number normalization belong to the host. `PhoneHistoryDetail` offers action/diagnostic slots, and `PhoneHistoryPagination` offers an optional load-more control. `SimulatorScreenTile` provides an optional Home tile. Existing SMS, email and Settings components remain the shared implementation.

An API host should validate responses, build a snapshot, retain prior content on failure, cancel obsolete reads and guard against out-of-order responses. PhoneMe provides such an adapter locally; no HTTP or provider dependency has been added to simulator packages.
