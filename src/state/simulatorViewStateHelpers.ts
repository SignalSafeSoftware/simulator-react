import {
    isPhoneScreen,
    isEmailScreen,
    isMessagesScreen,
    isHomeScreen,
} from '@signalsafe/simulator-core/devicePayload';
import { ownValue } from '../utils/lookup.js';
/**
 * Initial view state builders and screen-id guards for the session reducer.
 */

import {
    type SimulatorViewState,
    DEFAULT_PHONE_SCREEN,
    DEFAULT_EMAIL_SCREEN,
    DEFAULT_MESSAGES_SCREEN,
    DEFAULT_INTERNET_SCREEN,
    DEFAULT_HOME_SCREEN,
} from '../types/session.js';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';

function initialPhoneState(): SimulatorViewState['phone'] {
    return {
        screen: DEFAULT_PHONE_SCREEN,
        stack: [],
        chosenIndex: null,
    };
}

function initialEmailState(): SimulatorViewState['email'] {
    return {
        screen: DEFAULT_EMAIL_SCREEN,
        stack: [],
        selectedMessageId: null,
    };
}

function initialMessagesState(): SimulatorViewState['messages'] {
    return {
        screen: DEFAULT_MESSAGES_SCREEN,
        stack: [],
        visibleCount: 0,
    };
}

function initialInternetState(): SimulatorViewState['internet'] {
    return {
        screen: DEFAULT_INTERNET_SCREEN,
        stack: [],
    };
}

function initialHomeState(): SimulatorViewState['home'] {
    return {
        screen: DEFAULT_HOME_SCREEN,
    };
}

export const initialViewState: SimulatorViewState = {
    activeApp: SimulatorApp.Email,
    showPrimaryMenu: true,
    phone: initialPhoneState(),
    email: initialEmailState(),
    messages: initialMessagesState(),
    internet: initialInternetState(),
    home: initialHomeState(),
    contactsPanelOpen: false,
    contactsSearchQuery: '',
    actionHistory: [],
};

export function createInitialPhoneState(): SimulatorViewState['phone'] {
    return initialPhoneState();
}

export function createInitialEmailState(): SimulatorViewState['email'] {
    return initialEmailState();
}

export function createInitialMessagesState(): SimulatorViewState['messages'] {
    return initialMessagesState();
}

export function createInitialHomeState(): SimulatorViewState['home'] {
    return initialHomeState();
}

const DEFAULT_SCREEN_BY_APP: Readonly<Record<SimulatorApp, string>> = Object.freeze({
    [SimulatorApp.Phone]: DEFAULT_PHONE_SCREEN,
    [SimulatorApp.Email]: DEFAULT_EMAIL_SCREEN,
    [SimulatorApp.Messages]: DEFAULT_MESSAGES_SCREEN,
    [SimulatorApp.Internet]: DEFAULT_INTERNET_SCREEN,
    [SimulatorApp.Home]: DEFAULT_HOME_SCREEN,
});

export function getDefaultScreen(app: SimulatorApp): string {
    return ownValue(DEFAULT_SCREEN_BY_APP, app) ?? DEFAULT_EMAIL_SCREEN;
}

export function isInternetScreen(s: string): s is string {
    return typeof s === 'string' && s.length > 0;
}

const ENTRY_SCREEN_PARSERS: Readonly<Record<SimulatorApp, (screen: string) => string>> =
    Object.freeze({
        [SimulatorApp.Phone]: (screen) => keepIf(isPhoneScreen, screen, DEFAULT_PHONE_SCREEN),
        [SimulatorApp.Email]: (screen) => keepIf(isEmailScreen, screen, DEFAULT_EMAIL_SCREEN),
        [SimulatorApp.Messages]: (screen) =>
            keepIf(isMessagesScreen, screen, DEFAULT_MESSAGES_SCREEN),
        [SimulatorApp.Internet]: (screen) =>
            isInternetScreen(screen) ? screen : DEFAULT_INTERNET_SCREEN,
        [SimulatorApp.Home]: (screen) => keepIf(isHomeScreen, screen, DEFAULT_HOME_SCREEN),
    });

/** Built-in screen ids are matched case-insensitively and normalized to lower case. */
function keepIf(isScreen: (value: string) => boolean, screen: string, fallback: string): string {
    const lower = screen.toLowerCase();
    return isScreen(lower) ? lower : fallback;
}

export function parseEntryScreen(app: SimulatorApp, screen: string): string {
    return ownValue(ENTRY_SCREEN_PARSERS, app)?.(screen) ?? getDefaultScreen(app);
}
