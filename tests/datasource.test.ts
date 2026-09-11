import { describe, expect, it } from 'vitest';
import {
  createSimulatorDatasource,
  createSimulatorDatasourceFromPayload,
  deviceJsonToPayload,
  simulatorDatasourceToPayload,
  updateSimulatorDatasource,
} from '../src/datasource/datasource.js';
import { getInitialSessionState } from '../src/state/simulatorSessionInitialState.js';
import { simulatorSessionReducer } from '../src/state/simulatorSessionReducer.js';
import type { SimulatorDevicePayload } from '../src/types/portableSimulator.js';
const json: SimulatorDevicePayload = {
  entry_point: { app: 'phone', screen: 'incoming_call' },
  contacts: [{ id: 'c1', display_name: 'Sample', number: '+12025550123' }],
  phone: {
    history: [{ id: 'h1', direction: 'missed' }],
    incoming_call: { caller_name: 'Sample', transcript: 'Scenario content' },
  },
  messages: {
    threads: [{ id: 't1', contact_name: 'Sample' }],
    thread_detail: {
      id: 't1',
      messages: [
        {
          from: 'them',
          text: 'Sample SMS',
          attachment: { label: 'File', url: '/sample' },
        },
      ],
    },
  },
  email: {
    messages: [
      {
        id: 'e1',
        subject: 'Sample mail',
        from: 'sample@example.test',
        folder_id: 'inbox',
      },
    ],
    detail: {
      id: 'e1',
      subject: 'Sample mail',
      from: 'sample@example.test',
      body: 'Mail content',
    },
  },
  home: { settings: { sections: [{ id: 's1', title: 'General' }] } },
  internet: {
    pages: [
      { id: 'landing', url: 'https://example.test', title: 'Sample page' },
    ],
  },
};
describe('JSON datasource compatibility', () => {
  it('normalizes text/object JSON identically to the existing full-device adapter', () => {
    const ds = createSimulatorDatasource(JSON.stringify(json));
    expect(simulatorDatasourceToPayload(ds)).toEqual(deviceJsonToPayload(json));
    expect(ds.calls?.content.transcript).toBe('Scenario content');
    expect(ds.calls?.callHistory?.[0].number).toBe('');
    expect(ds.contacts?.[0].id).toBe('c1');
    expect(ds.sms?.thread.messages[0].text).toBe('Sample SMS');
    expect(ds.email?.inbox[0].id).toBe('e1');
    expect(ds.context.home?.settingsSections[0].id).toBe('s1');
    expect(ds.context.browser?.pages[0].id).toBe('landing');
  });
  it('copies and freezes content and does not invent missing collections', () => {
    const ds = createSimulatorDatasource(json);
    expect(Object.isFrozen(ds.contacts?.[0])).toBe(true);
    const payload = simulatorDatasourceToPayload(ds);
    if (payload.contacts) payload.contacts[0].displayName = 'Changed';
    expect(ds.contacts?.[0].displayName).toBe('Sample');
    const empty = createSimulatorDatasource({
      entry_point: { app: 'home', screen: 'home' },
    });
    expect(empty.contacts).toBeNull();
    expect(empty.email).toBeNull();
  });
  it('rejects unsupported versions, duplicate ids, invalid fields and malformed JSON with paths', () => {
    expect(() => createSimulatorDatasource('{')).toThrow('JSON text');
    expect(() =>
      createSimulatorDatasource({ ...json, schema_version: 2 }),
    ).toThrow('schema_version');
    expect(() =>
      createSimulatorDatasource({
        ...json,
        contacts: [json.contacts?.[0], json.contacts?.[0]],
      }),
    ).toThrow('unique');
    expect(() =>
      createSimulatorDatasource({
        ...json,
        messages: {
          thread_detail: { messages: [{ from: 'invalid', text: 'x' }] },
        },
      }),
    ).toThrow('messages[0].from');
    expect(() =>
      createSimulatorDatasource({ ...json, email: { messages: 'invalid' } }),
    ).toThrow('$.email.messages');
  });
  it('refreshes content without resetting choices, navigation or scenario state', () => {
    const payload = deviceJsonToPayload(json);
    let state = getInitialSessionState(payload);
    state = simulatorSessionReducer(state, { type: 'PHONE_CHOOSE', index: 1 });
    state = simulatorSessionReducer(state, {
      type: 'SWITCH_APP',
      app: 'messages',
    });
    const source = createSimulatorDatasourceFromPayload({
      ...payload,
      contacts: [],
    });
    const next = updateSimulatorDatasource(state, source);
    expect(next.view).toBe(state.view);
    expect(next.view.phone.chosenIndex).toBe(1);
    expect(next.payload.contacts).toEqual([]);
    expect(next.payload.phone?.content).toEqual(state.payload.phone?.content);
  });
  it('clears a deleted email selection without disturbing other app state', () => {
    const state = getInitialSessionState(deviceJsonToPayload(json));
    state.view.email = {
      screen: 'detail',
      stack: ['list'],
      selectedMessageId: 'e1',
    };
    const ds = createSimulatorDatasource({ ...json, email: { messages: [] } });
    const next = updateSimulatorDatasource(state, ds);
    expect(next.view.email.screen).toBe('list');
    expect(next.view.email.selectedMessageId).toBeNull();
    expect(next.view.phone).toBe(state.view.phone);
  });
});
