/**
 * Reducer for simulator session view state (shell state).
 * Apps: email, messages, internet, phone, home. entry_point sets initial app/screen. Supports Back, Cancel, NAV_LOCAL.
 */

import type { SimulatorSessionState, SimulatorViewState } from '../types/session.js';
import { isSimulatorTransitionLoggingEnabled, logSimulatorTransition } from '../utils/simulatorTransitionLogger.js';
import type { SimulatorDispatchAction } from './simulatorDispatchActions.js';
import { applyBack, applyCancel, applyNavLocal, applySwitchApp } from './simulatorNavigationHandlers.js';
import {
    applyBrowserScreen,
    applySelectEmail,
    applySimulatorAction,
} from './simulatorContentHandlers.js';

export type { SimulatorDispatchAction } from './simulatorDispatchActions.js';
export { switchChannelAction } from './simulatorDispatchActions.js';
export { getInitialSessionState } from './simulatorSessionInitialState.js';
export { initialViewState } from './simulatorViewStateHelpers.js';

function viewReducer(state: SimulatorViewState, action: SimulatorDispatchAction): SimulatorViewState {
    switch (action.type) {
        case 'SWITCH_APP':
            return applySwitchApp(state, action.app);
        case 'NAV_LOCAL':
            return applyNavLocal(state, action.app, action.screen);
        case 'BACK':
            return applyBack(state);
        case 'BACK_TO_PRIMARY':
            return { ...state, showPrimaryMenu: true, activeApp: 'home' };
        case 'CANCEL':
            return applyCancel(state);
        case 'SELECT_EMAIL':
            return applySelectEmail(state, action.messageId);
        case 'SMS_REVEAL_NEXT':
            return {
                ...state,
                messages: { ...state.messages, visibleCount: state.messages.visibleCount + 1 },
            };
        case 'BROWSER_SCREEN':
            return applyBrowserScreen(state, action.screen);
        case 'PHONE_CHOOSE':
            return { ...state, phone: { ...state.phone, chosenIndex: action.index } };
        case 'TOGGLE_CONTACTS_PANEL':
            return { ...state, contactsPanelOpen: !state.contactsPanelOpen };
        case 'SET_CONTACTS_SEARCH':
            return { ...state, contactsSearchQuery: typeof action.query === 'string' ? action.query : '' };
        case 'SIMULATOR_ACTION':
            return applySimulatorAction(state, action.action);
        default:
            return state;
    }
}

export function simulatorSessionReducer(
    state: SimulatorSessionState,
    action: SimulatorDispatchAction
): SimulatorSessionState {
    return {
        ...state,
        view: viewReducer(state.view, action),
    };
}

/**
 * Reducer wrapper that logs state transitions when dev logging is enabled.
 * Use this in app code so authors can enable logging to diagnose navigation bugs.
 */
export function simulatorSessionReducerWithLogging(
    state: SimulatorSessionState,
    action: SimulatorDispatchAction
): SimulatorSessionState {
    const next = simulatorSessionReducer(state, action);
    if (isSimulatorTransitionLoggingEnabled()) {
        logSimulatorTransition(state, action, next);
    }
    return next;
}
