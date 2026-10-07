/**
 * Dispatch action types for simulator session view state.
 */

import type { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import { type SimulatorAction, type SimulatorChannel, channelToApp } from '../types/session.js';

/** Session dispatch discriminants; values are stable for host integrations. */
export const SimulatorDispatchActionType = Object.freeze({
    SwitchApp: 'SWITCH_APP',
    NavLocal: 'NAV_LOCAL',
    Back: 'BACK',
    BackToPrimary: 'BACK_TO_PRIMARY',
    Cancel: 'CANCEL',
    SelectEmail: 'SELECT_EMAIL',
    SelectCallHistory: 'SELECT_CALL_HISTORY',
    SmsRevealNext: 'SMS_REVEAL_NEXT',
    BrowserScreen: 'BROWSER_SCREEN',
    PhoneChoose: 'PHONE_CHOOSE',
    ToggleContactsPanel: 'TOGGLE_CONTACTS_PANEL',
    SetContactsSearch: 'SET_CONTACTS_SEARCH',
    SimulatorAction: 'SIMULATOR_ACTION',
} as const);

export type SimulatorDispatchAction =
    | { type: typeof SimulatorDispatchActionType.SwitchApp; app: SimulatorApp }
    | { type: typeof SimulatorDispatchActionType.NavLocal; app: SimulatorApp; screen: string }
    | { type: typeof SimulatorDispatchActionType.Back }
    | { type: typeof SimulatorDispatchActionType.BackToPrimary }
    | { type: typeof SimulatorDispatchActionType.Cancel }
    | { type: typeof SimulatorDispatchActionType.SelectEmail; messageId: string | null }
    | { type: typeof SimulatorDispatchActionType.SelectCallHistory; entryId: string | null }
    | { type: typeof SimulatorDispatchActionType.SmsRevealNext }
    | { type: typeof SimulatorDispatchActionType.BrowserScreen; screen: string }
    | { type: typeof SimulatorDispatchActionType.PhoneChoose; index: number }
    | { type: typeof SimulatorDispatchActionType.ToggleContactsPanel }
    | { type: typeof SimulatorDispatchActionType.SetContactsSearch; query: string }
    | { type: typeof SimulatorDispatchActionType.SimulatorAction; action: SimulatorAction };

/** Shell nav dispatches channel; we translate to SWITCH_APP (sms→messages, browser→internet). */
export function switchChannelAction(channel: SimulatorChannel): SimulatorDispatchAction {
    return { type: SimulatorDispatchActionType.SwitchApp, app: channelToApp(channel) };
}
