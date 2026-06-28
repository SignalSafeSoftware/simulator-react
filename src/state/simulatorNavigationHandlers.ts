/**
 * Navigation handlers: SWITCH_APP, NAV_LOCAL, BACK, CANCEL.
 */

import type {
    SimulatorViewState,
    SimulatorApp,
    PhoneScreenId,
    EmailScreenId,
    MessagesScreenId,
    HomeScreenId,
} from '../types/session.js';
import {
    DEFAULT_PHONE_SCREEN,
    DEFAULT_EMAIL_SCREEN,
    DEFAULT_MESSAGES_SCREEN,
    DEFAULT_INTERNET_SCREEN,
    DEFAULT_HOME_SCREEN,
} from '../types/session.js';
import {
    getDefaultScreen,
    isPhoneScreen,
    isEmailScreen,
    isMessagesScreen,
    isInternetScreen,
    isHomeScreen,
} from './simulatorViewStateHelpers.js';

export function applySwitchApp(state: SimulatorViewState, app: SimulatorApp): SimulatorViewState {
    const next = { ...state, activeApp: app };
    if (app === 'phone') {
        next.showPrimaryMenu = false;
        next.phone = {
            ...state.phone,
            screen: DEFAULT_PHONE_SCREEN,
            stack: [],
        };
    } else if (app === 'email') {
        next.showPrimaryMenu = false;
        next.email = {
            ...state.email,
            screen: DEFAULT_EMAIL_SCREEN,
            stack: [],
            selectedMessageId: null,
        };
    }
    return next;
}

function updatePhoneLocalNavigation(next: SimulatorViewState, state: SimulatorViewState, screen: string): void {
    if (!isPhoneScreen(screen) || screen === state.phone.screen) {
        return;
    }
    next.phone = {
        ...state.phone,
        stack: [...state.phone.stack, state.phone.screen],
        screen,
    };
}

function updateEmailLocalNavigation(next: SimulatorViewState, state: SimulatorViewState, screen: string): void {
    if (!isEmailScreen(screen) || screen === state.email.screen) {
        return;
    }
    next.email = {
        ...state.email,
        stack: [...state.email.stack, state.email.screen],
        screen,
    };
}

function updateMessagesLocalNavigation(next: SimulatorViewState, state: SimulatorViewState, screen: string): void {
    if (!isMessagesScreen(screen) || screen === state.messages.screen) {
        return;
    }
    next.messages = {
        ...state.messages,
        stack: [...state.messages.stack, state.messages.screen],
        screen,
    };
}

function updateInternetLocalNavigation(next: SimulatorViewState, state: SimulatorViewState, screen: string): void {
    if (!isInternetScreen(screen) || screen === state.internet.screen) {
        return;
    }
    next.internet = { ...state.internet, screen };
}

function updateHomeLocalNavigation(next: SimulatorViewState, state: SimulatorViewState, screen: string): void {
    if (!isHomeScreen(screen) || screen === state.home.screen) {
        return;
    }
    next.home = { ...state.home, screen };
}

export function applyNavLocal(state: SimulatorViewState, app: SimulatorApp, screen: string): SimulatorViewState {
    const next = { ...state };
    const current = state.activeApp;
    if (app !== current) {
        return next;
    }
    switch (app) {
        case 'phone':
            updatePhoneLocalNavigation(next, state, screen);
            break;
        case 'email':
            updateEmailLocalNavigation(next, state, screen);
            break;
        case 'messages':
            updateMessagesLocalNavigation(next, state, screen);
            break;
        case 'internet':
            updateInternetLocalNavigation(next, state, screen);
            break;
        case 'home':
            updateHomeLocalNavigation(next, state, screen);
            break;
        default:
            break;
    }
    return next;
}

export function applyBack(state: SimulatorViewState): SimulatorViewState {
    const app = state.activeApp;
    const next = { ...state };
    switch (app) {
        case 'phone': {
            const stack = state.phone.stack;
            if (stack.length === 0) {
                next.showPrimaryMenu = true;
                return next;
            }
            const prev = stack.at(-1);
            next.phone = {
                ...state.phone,
                screen: prev ?? DEFAULT_PHONE_SCREEN,
                stack: stack.slice(0, -1),
            };
            break;
        }
        case 'email': {
            const stack = state.email.stack;
            if (stack.length === 0) {
                next.email = {
                    ...state.email,
                    screen: DEFAULT_EMAIL_SCREEN,
                    stack: [],
                    selectedMessageId: null,
                };
                return next;
            }
            const prev = stack.at(-1);
            next.email = {
                ...state.email,
                screen: prev ?? DEFAULT_EMAIL_SCREEN,
                stack: stack.slice(0, -1),
                selectedMessageId: null,
            };
            break;
        }
        case 'messages': {
            const stack = state.messages.stack;
            const prev: MessagesScreenId = stack.at(-1) ?? DEFAULT_MESSAGES_SCREEN;
            next.messages = {
                ...state.messages,
                screen: prev,
                stack: stack.slice(0, -1),
            };
            break;
        }
        case 'internet': {
            const stack = state.internet.stack;
            if (stack.length > 0) {
                const prev = stack.at(-1);
                next.internet = {
                    ...state.internet,
                    screen: prev ?? DEFAULT_INTERNET_SCREEN,
                    stack: stack.slice(0, -1),
                };
            } else if (state.internet.screen !== DEFAULT_INTERNET_SCREEN) {
                next.internet = { ...state.internet, screen: DEFAULT_INTERNET_SCREEN };
            }
            break;
        }
        case 'home':
            if (state.home.screen !== DEFAULT_HOME_SCREEN) {
                next.home = { ...state.home, screen: DEFAULT_HOME_SCREEN };
            }
            break;
        default:
            break;
    }
    return next;
}

export function applyCancel(state: SimulatorViewState): SimulatorViewState {
    const app = state.activeApp;
    const next = { ...state };
    const defaultScreen = getDefaultScreen(app);
    switch (app) {
        case 'phone':
            next.phone = { ...state.phone, screen: defaultScreen as PhoneScreenId, stack: [] };
            break;
        case 'email':
            next.email = {
                ...state.email,
                screen: defaultScreen as EmailScreenId,
                stack: [],
                selectedMessageId: null,
            };
            break;
        case 'messages':
            next.messages = {
                ...state.messages,
                screen: defaultScreen as MessagesScreenId,
                stack: [],
            };
            break;
        case 'internet':
            next.internet = { ...state.internet, screen: defaultScreen, stack: [] };
            break;
        case 'home':
            next.home = { ...state.home, screen: defaultScreen as HomeScreenId };
            break;
        default:
            break;
    }
    return next;
}
