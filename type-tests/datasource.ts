import { simulatorDatasourceToPayload, type SimulatorDatasource } from '../src/index.js';

// Compiled by typecheck. These errors must remain errors in the public API.
export function checkSnapshot(source: SimulatorDatasource) {
  if (source.calls) {
    // @ts-expect-error Snapshot objects are readonly.
    source.calls.content.transcript = 'changed';
    // @ts-expect-error Snapshot collections are readonly.
    source.calls.callHistory?.pop();
  }
  if (source.contacts) {
    // @ts-expect-error Snapshot arrays are readonly.
    source.contacts.pop();
    // @ts-expect-error Snapshot elements are readonly.
    source.contacts[0].displayName = 'changed';
  }
  if (source.sms) {
    // @ts-expect-error Nested messages are readonly.
    source.sms.thread.messages[0].text = 'changed';
    // @ts-expect-error Nested arrays are readonly.
    source.sms.thread.messages.pop();
  }
  if (source.email) {
    // @ts-expect-error Nested messages are readonly.
    source.email.inbox[0].subject = 'changed';
    // @ts-expect-error Nested arrays are readonly.
    source.email.inbox.pop();
  }
  if (source.context.home) {
    // @ts-expect-error Context objects are readonly too.
    source.context.home.settingsSections[0].title = 'changed';
    // @ts-expect-error Context arrays are readonly too.
    source.context.home.settingsSections.pop();
  }
  const session = simulatorDatasourceToPayload(source);
  if (session.contacts) session.contacts[0].displayName = 'editable';
  if (session.sms) session.sms.thread.messages.pop();
  if (session.email) session.email.inbox.pop();
  if (session.phone) session.phone.content.transcript = 'editable';
  if (session.home) session.home.settingsSections.pop();
}
