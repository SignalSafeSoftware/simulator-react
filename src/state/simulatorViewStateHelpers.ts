import {
    isPhoneScreen,
    isEmailScreen,
    isMessagesScreen,
    isHomeScreen,
} from '@signalsafe/simulator-core/devicePayload';
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

export function getDefaultScreen(app: SimulatorApp): string {
    switch (app) {
        case SimulatorApp.Phone:
            return DEFAULT_PHONE_SCREEN;
        case SimulatorApp.Email:
            return DEFAULT_EMAIL_SCREEN;
        case SimulatorApp.Messages:
            return DEFAULT_MESSAGES_SCREEN;
        case SimulatorApp.Internet:
            return DEFAULT_INTERNET_SCREEN;
        case SimulatorApp.Home:
            return DEFAULT_HOME_SCREEN;
        default:
            return DEFAULT_EMAIL_SCREEN;
    }
}

export function isInternetScreen(s: string): s is string {
    return typeof s === 'string' && s.length > 0;
}

export function parseEntryScreen(app: SimulatorApp, screen: string): string {
    const lower = screen.toLowerCase();
    switch (app) {
        case SimulatorApp.Phone:
            return isPhoneScreen(lower) ? lower : DEFAULT_PHONE_SCREEN;
        case SimulatorApp.Email:
            if (isEmailScreen(lower)) return lower;
            return DEFAULT_EMAIL_SCREEN;
        case SimulatorApp.Messages:
            if (isMessagesScreen(lower)) return lower;
            return DEFAULT_MESSAGES_SCREEN;
        case SimulatorApp.Internet:
            return isInternetScreen(screen) ? screen : DEFAULT_INTERNET_SCREEN;
        case SimulatorApp.Home:
            return isHomeScreen(lower) ? lower : DEFAULT_HOME_SCREEN;
        default:
            return getDefaultScreen(app);
    }
}
