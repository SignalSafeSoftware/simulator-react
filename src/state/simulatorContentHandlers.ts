/**
 * Content and simulator-action handlers: email, browser, SIMULATOR_ACTION.
 */

import type { SimulatorViewState, SimulatorAction } from '../types/session.js';
import { BROWSER_HISTORY_MAX } from '../types/session.js';
import { applyNavLocal, applySwitchApp } from './simulatorNavigationHandlers.js';

export function updateInternetHistory(
    activeApp: SimulatorViewState['activeApp'],
    internet: SimulatorViewState['internet'],
    nextScreen: string
): string[] {
    if (activeApp !== 'internet' || nextScreen === internet.screen) return internet.stack;
    return [...internet.stack, internet.screen].slice(-BROWSER_HISTORY_MAX);
}

export function applySelectEmail(state: SimulatorViewState, messageId: string | null): SimulatorViewState {
    if (messageId != null) {
        return {
            ...state,
            email: {
                ...state.email,
                stack: [...state.email.stack, state.email.screen],
                screen: 'detail',
                selectedMessageId: messageId,
            },
        };
    }

    return {
        ...state,
        email: {
            ...state.email,
            screen: 'list',
            stack: [],
            selectedMessageId: null,
        },
    };
}

export function applyBrowserScreen(state: SimulatorViewState, targetScreen: string): SimulatorViewState {
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
    action: Extract<SimulatorAction, { type: 'click_link' }>
): SimulatorViewState {
    if (action.href == null && action.pageId == null) return state;
    const pageId = typeof action.pageId === 'string' && action.pageId.length > 0 ? action.pageId : 'landing';
    const switched = applySwitchApp(state, 'internet');
    return {
        ...switched,
        internet: {
            ...switched.internet,
            screen: pageId,
            stack: updateInternetHistory(state.activeApp, state.internet, pageId),
        },
    };
}

export function applySimulatorAction(state: SimulatorViewState, action: SimulatorAction): SimulatorViewState {
    let next: SimulatorViewState = {
        ...state,
        actionHistory: [...state.actionHistory, action],
    };

    switch (action.type) {
        case 'navigate_screen':
            next = applyNavLocal(next, action.app, action.screen);
            break;
        case 'open_app':
            next = applySwitchApp(next, action.app);
            break;
        case 'click_link':
            next = applyClickLinkAction(next, action);
            break;
        case 'check_contact':
        case 'check_contacts':
            next = { ...next, contactsPanelOpen: true };
            break;
        case 'answer_call':
            if (typeof action.choiceIndex === 'number') {
                next = { ...next, phone: { ...next.phone, chosenIndex: action.choiceIndex } };
            }
            break;
        default:
            break;
    }

    return next;
}
