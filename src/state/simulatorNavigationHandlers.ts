import {
    SimulatorEmailScreenId,
    SimulatorPhoneScreenId,
    isEmailScreen,
    isHomeScreen,
    isMessagesScreen,
    isPhoneScreen,
} from '@signalsafe/simulator-core/devicePayload';
/**
 * Navigation handlers: SWITCH_APP, NAV_LOCAL, BACK, CANCEL.
 */

import {
    type SimulatorViewState,
    type PhoneScreenId,
    type EmailScreenId,
    type MessagesScreenId,
    type HomeScreenId,
} from '../types/session.js';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import {
    DEFAULT_PHONE_SCREEN,
    DEFAULT_EMAIL_SCREEN,
    DEFAULT_MESSAGES_SCREEN,
    DEFAULT_INTERNET_SCREEN,
    DEFAULT_HOME_SCREEN,
} from '../types/session.js';
import { getDefaultScreen, isInternetScreen } from './simulatorViewStateHelpers.js';

export function applySwitchApp(state: SimulatorViewState, app: SimulatorApp): SimulatorViewState {
    const next = { ...state, activeApp: app };
    if (app === SimulatorApp.Phone) {
        next.showPrimaryMenu = false;
        next.phone = {
            ...state.phone,
            screen: DEFAULT_PHONE_SCREEN,
            stack: [],
        };
    } else if (app === SimulatorApp.Email) {
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

function pushScreen<
    K extends typeof SimulatorApp.Phone | typeof SimulatorApp.Email | typeof SimulatorApp.Messages,
>(
    next: SimulatorViewState,
    state: SimulatorViewState,
    key: K,
    screen: string,
    isScreen: (value: string) => value is SimulatorViewState[K]['screen'],
): void {
    if (!isScreen(screen) || screen === state[key].screen) {
        return;
    }
    next[key] = {
        ...state[key],
        stack: [...state[key].stack, state[key].screen],
        screen,
    };
}

function updateInternetLocalNavigation(
    next: SimulatorViewState,
    state: SimulatorViewState,
    screen: string,
): void {
    if (!isInternetScreen(screen) || screen === state.internet.screen) {
        return;
    }
    next.internet = { ...state.internet, screen };
}

function updateHomeLocalNavigation(
    next: SimulatorViewState,
    state: SimulatorViewState,
    screen: string,
): void {
    if (!isHomeScreen(screen) || screen === state.home.screen) {
        return;
    }
    next.home = { ...state.home, screen };
}

export function applyNavLocal(
    state: SimulatorViewState,
    app: SimulatorApp,
    screen: string,
): SimulatorViewState {
    const next = { ...state };
    const current = state.activeApp;
    if (app !== current) {
        return next;
    }
    switch (app) {
        case SimulatorApp.Phone:
            pushScreen(next, state, SimulatorApp.Phone, screen, isPhoneScreen);
            break;
        case SimulatorApp.Email:
            pushScreen(next, state, SimulatorApp.Email, screen, isEmailScreen);
            break;
        case SimulatorApp.Messages:
            pushScreen(next, state, SimulatorApp.Messages, screen, isMessagesScreen);
            break;
        case SimulatorApp.Internet:
            updateInternetLocalNavigation(next, state, screen);
            break;
        case SimulatorApp.Home:
            updateHomeLocalNavigation(next, state, screen);
            break;
        default:
            break;
    }
    return next;
}

function phoneParentScreen(screen: PhoneScreenId): PhoneScreenId | null {
    if (screen === SimulatorPhoneScreenId.AddContact || screen === SimulatorPhoneScreenId.Directory)
        return SimulatorPhoneScreenId.Contacts;
    if (
        screen === SimulatorPhoneScreenId.IncomingCall ||
        screen === SimulatorPhoneScreenId.Voicemail
    )
        return SimulatorPhoneScreenId.History;
    return null;
}

function applyInternetBack(state: SimulatorViewState): SimulatorViewState['internet'] {
    const { stack, screen } = state.internet;
    if (stack.length > 0) {
        return {
            ...state.internet,
            screen: stack.at(-1) ?? DEFAULT_INTERNET_SCREEN,
            stack: stack.slice(0, -1),
        };
    }
    if (screen !== DEFAULT_INTERNET_SCREEN) {
        return { ...state.internet, screen: DEFAULT_INTERNET_SCREEN };
    }
    return state.internet;
}

export function applyBack(state: SimulatorViewState): SimulatorViewState {
    const app = state.activeApp;
    const next = { ...state };
    switch (app) {
        case SimulatorApp.Phone: {
            const screen = state.phone.screen;
            const parent = phoneParentScreen(screen);
            next.phone = { ...state.phone, screen: parent ?? screen, stack: [] };
            next.showPrimaryMenu = parent === null;
            if (parent === null) {
                next.activeApp = SimulatorApp.Home;
                next.home = { ...state.home, screen: DEFAULT_HOME_SCREEN };
            }
            break;
        }
        case SimulatorApp.Email: {
            const screen = state.email.screen;
            const isDetail =
                screen === SimulatorEmailScreenId.Detail ||
                screen === SimulatorEmailScreenId.Compose;
            const folder =
                [...state.email.stack]
                    .reverse()
                    .find(
                        (item) =>
                            item === SimulatorEmailScreenId.List ||
                            item === SimulatorEmailScreenId.Outbox ||
                            item === SimulatorEmailScreenId.Trash,
                    ) ?? DEFAULT_EMAIL_SCREEN;
            next.email = {
                ...state.email,
                screen: isDetail ? folder : screen,
                stack: [],
                selectedMessageId: null,
            };
            next.showPrimaryMenu = !isDetail;
            if (!isDetail) {
                next.activeApp = SimulatorApp.Home;
                next.home = { ...state.home, screen: DEFAULT_HOME_SCREEN };
            }
            break;
        }
        case SimulatorApp.Messages: {
            next.messages = { ...state.messages, screen: DEFAULT_MESSAGES_SCREEN, stack: [] };
            next.showPrimaryMenu = state.messages.screen === DEFAULT_MESSAGES_SCREEN;
            if (next.showPrimaryMenu) {
                next.activeApp = SimulatorApp.Home;
                next.home = { ...state.home, screen: DEFAULT_HOME_SCREEN };
            }
            break;
        }
        case SimulatorApp.Internet:
            next.internet = applyInternetBack(state);
            break;
        case SimulatorApp.Home:
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
        case SimulatorApp.Phone:
            next.phone = { ...state.phone, screen: defaultScreen as PhoneScreenId, stack: [] };
            break;
        case SimulatorApp.Email:
            next.email = {
                ...state.email,
                screen: defaultScreen as EmailScreenId,
                stack: [],
                selectedMessageId: null,
            };
            break;
        case SimulatorApp.Messages:
            next.messages = {
                ...state.messages,
                screen: defaultScreen as MessagesScreenId,
                stack: [],
            };
            break;
        case SimulatorApp.Internet:
            next.internet = { ...state.internet, screen: defaultScreen, stack: [] };
            break;
        case SimulatorApp.Home:
            next.home = { ...state.home, screen: defaultScreen as HomeScreenId };
            break;
        default:
            break;
    }
    return next;
}
