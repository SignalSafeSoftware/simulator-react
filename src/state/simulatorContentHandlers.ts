import { SimulatorActionType } from '../utils/telemetry/simulatorActionTaxonomy.js';
import { SimulatorEmailScreenId } from '@signalsafe/simulator-core/devicePayload';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
/**
 * Content and simulator-action handlers: email, browser, SIMULATOR_ACTION.
 */

import type { SimulatorViewState, SimulatorAction } from '../types/session.js';
import { BROWSER_HISTORY_MAX } from '../types/session.js';
import { applyNavLocal, applySwitchApp } from './simulatorNavigationHandlers.js';

function updateInternetHistory(
    activeApp: SimulatorViewState['activeApp'],
    internet: SimulatorViewState['internet'],
    nextScreen: string,
): string[] {
    if (activeApp !== SimulatorApp.Internet || nextScreen === internet.screen)
        return internet.stack;
    return [...internet.stack, internet.screen].slice(-BROWSER_HISTORY_MAX);
}

export function applySelectEmail(
    state: SimulatorViewState,
    messageId: string | null,
): SimulatorViewState {
    if (messageId != null) {
        return {
            ...state,
            email: {
                ...state.email,
                stack: [...state.email.stack, state.email.screen],
                screen: SimulatorEmailScreenId.Detail,
                selectedMessageId: messageId,
            },
        };
    }

    return {
        ...state,
        email: {
            ...state.email,
            screen: SimulatorEmailScreenId.List,
            stack: [],
            selectedMessageId: null,
        },
    };
}

export function applyBrowserScreen(
    state: SimulatorViewState,
    targetScreen: string,
): SimulatorViewState {
    return {
        ...state,
        internet: {
            ...state.internet,
            screen: targetScreen,
            stack: updateInternetHistory(state.activeApp, state.internet, targetScreen),
        },
    };
}

function applyClickLinkAction(
    state: SimulatorViewState,
    action: Extract<SimulatorAction, { type: typeof SimulatorActionType.ClickLink }>,
): SimulatorViewState {
    if (action.href == null && action.pageId == null) return state;
    const pageId =
        typeof action.pageId === 'string' && action.pageId.length > 0 ? action.pageId : 'landing';
    const switched = applySwitchApp(state, SimulatorApp.Internet);
    return {
        ...switched,
        internet: {
            ...switched.internet,
            screen: pageId,
            stack: updateInternetHistory(state.activeApp, state.internet, pageId),
        },
    };
}

export function applySimulatorAction(
    state: SimulatorViewState,
    action: SimulatorAction,
): SimulatorViewState {
    let next: SimulatorViewState = {
        ...state,
        actionHistory: [...state.actionHistory, action],
    };

    switch (action.type) {
        case SimulatorActionType.NavigateScreen:
            next = applyNavLocal(next, action.app, action.screen);
            break;
        case SimulatorActionType.OpenApp:
            next = applySwitchApp(next, action.app);
            break;
        case SimulatorActionType.ClickLink:
            next = applyClickLinkAction(next, action);
            break;
        case SimulatorActionType.CheckContact:
        case SimulatorActionType.CheckContacts:
            next = { ...next, contactsPanelOpen: true };
            break;
        case SimulatorActionType.AnswerCall:
            if (typeof action.choiceIndex === 'number') {
                next = { ...next, phone: { ...next.phone, chosenIndex: action.choiceIndex } };
            }
            break;
        default:
            break;
    }

    return next;
}
