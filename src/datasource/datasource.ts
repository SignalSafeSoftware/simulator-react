import type { SimulatorDevicePayload } from '../types/portableSimulator.js';
import type {
  SimulatorTemplatePayload,
  SimulatorSessionState,
} from '../types/session.js';
import { templateDetailToPayload } from '../adapters/templateToSession.js';
import { validateSimulatorPayload } from '../utils/validateSimulatorPayload.js';
import { validateDeviceJson } from './validateDeviceJson.js';

type Context = Omit<
  SimulatorTemplatePayload,
  'phone' | 'contacts' | 'sms' | 'email'
>;
/** Read-only content, not a transport or an action provider. Calls retain scenario and history separately. */
export interface SimulatorDatasource {
  readonly calls: SimulatorTemplatePayload['phone'];
  readonly contacts: SimulatorTemplatePayload['contacts'];
  readonly sms: SimulatorTemplatePayload['sms'];
  readonly email: SimulatorTemplatePayload['email'];
  readonly context: Context;
}

function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

/** For already validated, typed host/session data. Copies input and freezes the snapshot. */
export function createSimulatorDatasourceFromPayload(
  payload: SimulatorTemplatePayload,
): SimulatorDatasource {
  validateSimulatorPayload(payload);
  const {
    phone: calls,
    contacts,
    sms,
    email,
    ...context
  } = structuredClone(payload);
  return freeze({ calls, contacts, sms, email, context });
}

/** Accept parsed full-device JSON or JSON text; preserve the established adapter's defaults. */
export function createSimulatorDatasource(input: unknown): SimulatorDatasource {
  let value: unknown = input;
  if (typeof input === 'string') {
    try {
      value = JSON.parse(input);
    } catch {
      throw new Error('Invalid simulator JSON: source is not valid JSON text.');
    }
  }
  validateDeviceJson(value);
  return createSimulatorDatasourceFromPayload(deviceJsonToPayload(value));
}

/** Legacy conversion stays tolerant; strict source validation is opt-in through the JSON adapter. */
export function deviceJsonToPayload(
  value: SimulatorDevicePayload,
): SimulatorTemplatePayload {
  return templateDetailToPayload({
    id: 0,
    channel: 'phone',
    key: 'simulator-device',
    name: 'Simulator',
    is_master: false,
    is_active: true,
    company: null,
    topics: [],
    created_on: '',
    updated_on: '',
    description: '',
    content_json: {},
    simulator_json: value,
    simulator: value,
    thread_id: null,
    reply_to_message: null,
    attachment_name: '',
    attachment_type: '',
    attachment_behavior: '',
    messages: [],
    browser_template: null,
  });
}

/** A fresh mutable copy for the existing session reducer; it cannot mutate the source snapshot. */
export function simulatorDatasourceToPayload(
  datasource: SimulatorDatasource,
): SimulatorTemplatePayload {
  return structuredClone({
    ...datasource.context,
    phone: datasource.calls,
    contacts: datasource.contacts,
    sms: datasource.sms,
    email: datasource.email,
  });
}

/** Refresh content without restarting the scenario, navigation stacks, choices or component drafts. */
export function updateSimulatorDatasource(
  state: SimulatorSessionState,
  datasource: SimulatorDatasource,
): SimulatorSessionState {
  const payload = simulatorDatasourceToPayload(datasource);
  const selected = state.view.email.selectedMessageId;
  const emailStillExists =
    selected === null ||
    [
      ...(payload.email?.inbox ?? []),
      ...(payload.email?.outbox ?? []),
      ...(payload.email?.trash ?? []),
    ].some((row) => row.id === selected);
  return {
    ...state,
    payload,
    view: emailStillExists
      ? state.view
      : {
          ...state.view,
          email: {
            ...state.view.email,
            selectedMessageId: null,
            screen:
              state.view.email.screen === 'detail'
                ? 'list'
                : state.view.email.screen,
          },
        },
  };
}
