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
    DEFAULT_PHONE_SCREEN,
    DEFAULT_EMAIL_SCREEN,
    DEFAULT_MESSAGES_SCREEN,
    DEFAULT_INTERNET_SCREEN,
    DEFAULT_HOME_SCREEN,
} from '../types/session.js';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import { isInternetScreen } from './simulatorViewStateHelpers.js';
import { ownValue } from '../utils/lookup.js';

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

type NavLocalHandler = (
    next: SimulatorViewState,
    state: SimulatorViewState,
    screen: string,
) => void;

const NAV_LOCAL_HANDLERS: Readonly<Record<SimulatorApp, NavLocalHandler>> = Object.freeze({
    [SimulatorApp.Phone]: (next, state, screen) =>
        pushScreen(next, state, SimulatorApp.Phone, screen, isPhoneScreen),
    [SimulatorApp.Email]: (next, state, screen) =>
        pushScreen(next, state, SimulatorApp.Email, screen, isEmailScreen),
    [SimulatorApp.Messages]: (next, state, screen) =>
        pushScreen(next, state, SimulatorApp.Messages, screen, isMessagesScreen),
    [SimulatorApp.Internet]: updateInternetLocalNavigation,
    [SimulatorApp.Home]: updateHomeLocalNavigation,
});

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
    ownValue(NAV_LOCAL_HANDLERS, app)?.(next, state, screen);
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

type BackHandler = (next: SimulatorViewState, state: SimulatorViewState) => void;

function leaveToHome(next: SimulatorViewState, state: SimulatorViewState): void {
    next.activeApp = SimulatorApp.Home;
    next.home = { ...state.home, screen: DEFAULT_HOME_SCREEN };
}

function backFromPhone(next: SimulatorViewState, state: SimulatorViewState): void {
    const screen = state.phone.screen;
    const parent = phoneParentScreen(screen);
    next.phone = { ...state.phone, screen: parent ?? screen, stack: [] };
    next.showPrimaryMenu = parent === null;
    if (parent === null) leaveToHome(next, state);
}

function backFromEmail(next: SimulatorViewState, state: SimulatorViewState): void {
    const screen = state.email.screen;
    const isDetail =
        screen === SimulatorEmailScreenId.Detail || screen === SimulatorEmailScreenId.Compose;
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
    if (!isDetail) leaveToHome(next, state);
}

function backFromMessages(next: SimulatorViewState, state: SimulatorViewState): void {
    next.messages = { ...state.messages, screen: DEFAULT_MESSAGES_SCREEN, stack: [] };
    next.showPrimaryMenu = state.messages.screen === DEFAULT_MESSAGES_SCREEN;
    if (next.showPrimaryMenu) leaveToHome(next, state);
}

function backFromHome(next: SimulatorViewState, state: SimulatorViewState): void {
    if (state.home.screen !== DEFAULT_HOME_SCREEN) {
        next.home = { ...state.home, screen: DEFAULT_HOME_SCREEN };
    }
}

const BACK_HANDLERS: Readonly<Record<SimulatorApp, BackHandler>> = Object.freeze({
    [SimulatorApp.Phone]: backFromPhone,
    [SimulatorApp.Email]: backFromEmail,
    [SimulatorApp.Messages]: backFromMessages,
    [SimulatorApp.Internet]: (next, state) => {
        next.internet = applyInternetBack(state);
    },
    [SimulatorApp.Home]: backFromHome,
});

export function applyBack(state: SimulatorViewState): SimulatorViewState {
    const next = { ...state };
    ownValue(BACK_HANDLERS, state.activeApp)?.(next, state);
    return next;
}

type CancelHandler = (next: SimulatorViewState, state: SimulatorViewState) => void;

const CANCEL_HANDLERS: Readonly<Record<SimulatorApp, CancelHandler>> = Object.freeze({
    [SimulatorApp.Phone]: (next, state) => {
        next.phone = { ...state.phone, screen: DEFAULT_PHONE_SCREEN, stack: [] };
    },
    [SimulatorApp.Email]: (next, state) => {
        next.email = {
            ...state.email,
            screen: DEFAULT_EMAIL_SCREEN,
            stack: [],
            selectedMessageId: null,
        };
    },
    [SimulatorApp.Messages]: (next, state) => {
        next.messages = { ...state.messages, screen: DEFAULT_MESSAGES_SCREEN, stack: [] };
    },
    [SimulatorApp.Internet]: (next, state) => {
        next.internet = { ...state.internet, screen: DEFAULT_INTERNET_SCREEN, stack: [] };
    },
    [SimulatorApp.Home]: (next, state) => {
        next.home = { ...state.home, screen: DEFAULT_HOME_SCREEN };
    },
});

export function applyCancel(state: SimulatorViewState): SimulatorViewState {
    const next = { ...state };
    ownValue(CANCEL_HANDLERS, state.activeApp)?.(next, state);
    return next;
}
