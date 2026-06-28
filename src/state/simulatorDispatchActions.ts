/**
 * Dispatch action types for simulator session view state.
 */

import type { SimulatorApp } from '../types/portableSimulator.js';
import type { SimulatorAction, SimulatorChannel } from '../types/session.js';
import { channelToApp } from '../types/session.js';

export type SimulatorDispatchAction =
    | { type: 'SWITCH_APP'; app: SimulatorApp }
    | { type: 'NAV_LOCAL'; app: SimulatorApp; screen: string }
    | { type: 'BACK' }
    | { type: 'BACK_TO_PRIMARY' }
    | { type: 'CANCEL' }
    | { type: 'SELECT_EMAIL'; messageId: string | null }
    | { type: 'SMS_REVEAL_NEXT' }
    | { type: 'BROWSER_SCREEN'; screen: string }
    | { type: 'PHONE_CHOOSE'; index: number }
    | { type: 'TOGGLE_CONTACTS_PANEL' }
    | { type: 'SET_CONTACTS_SEARCH'; query: string }
    | { type: 'SIMULATOR_ACTION'; action: SimulatorAction };

/** Shell nav dispatches channel; we translate to SWITCH_APP (sms→messages, browser→internet). */
export function switchChannelAction(channel: SimulatorChannel): SimulatorDispatchAction {
    return { type: 'SWITCH_APP', app: channelToApp(channel) };
}
