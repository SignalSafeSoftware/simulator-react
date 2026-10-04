import {
    SimulatorDispatchActionType,
    type SimulatorDispatchAction,
} from './simulatorDispatchActions.js';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
/**
 * Reducer for simulator session view state (shell state).
 * Apps: email, messages, internet, phone, home. entry_point sets initial app/screen. Supports Back, Cancel, NAV_LOCAL.
 */

import type { SimulatorSessionState, SimulatorViewState } from '../types/session.js';
import {
    isSimulatorTransitionLoggingEnabled,
    logSimulatorTransition,
} from '../utils/telemetry/simulatorTransitionLogger.js';
import {
    applyBack,
    applyCancel,
    applyNavLocal,
    applySwitchApp,
} from './simulatorNavigationHandlers.js';
import {
    applyBrowserScreen,
    applySelectEmail,
    applySimulatorAction,
} from './simulatorContentHandlers.js';

function viewReducer(
    state: SimulatorViewState,
    action: SimulatorDispatchAction,
): SimulatorViewState {
    switch (action.type) {
        case SimulatorDispatchActionType.SwitchApp:
            return applySwitchApp(state, action.app);
        case SimulatorDispatchActionType.NavLocal:
            return applyNavLocal(state, action.app, action.screen);
        case SimulatorDispatchActionType.Back:
            return applyBack(state);
        case SimulatorDispatchActionType.BackToPrimary:
            return { ...state, showPrimaryMenu: true, activeApp: SimulatorApp.Home };
        case SimulatorDispatchActionType.Cancel:
            return applyCancel(state);
        case SimulatorDispatchActionType.SelectEmail:
            return applySelectEmail(state, action.messageId);
        case SimulatorDispatchActionType.SmsRevealNext:
            return {
                ...state,
                messages: { ...state.messages, visibleCount: state.messages.visibleCount + 1 },
            };
        case SimulatorDispatchActionType.BrowserScreen:
            return applyBrowserScreen(state, action.screen);
        case SimulatorDispatchActionType.PhoneChoose:
            return { ...state, phone: { ...state.phone, chosenIndex: action.index } };
        case SimulatorDispatchActionType.ToggleContactsPanel:
            return { ...state, contactsPanelOpen: !state.contactsPanelOpen };
        case SimulatorDispatchActionType.SetContactsSearch:
            return {
                ...state,
                contactsSearchQuery: typeof action.query === 'string' ? action.query : '',
            };
        case SimulatorDispatchActionType.SimulatorAction:
            return applySimulatorAction(state, action.action);
        default:
            return state;
    }
}

export function simulatorSessionReducer(
    state: SimulatorSessionState,
    action: SimulatorDispatchAction,
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
    action: SimulatorDispatchAction,
): SimulatorSessionState {
    const next = simulatorSessionReducer(state, action);
    if (isSimulatorTransitionLoggingEnabled()) {
        logSimulatorTransition(state, action, next);
    }
    return next;
}
