/**
 * Initial view state builders and screen-id guards for the session reducer.
 */

import type {
    SimulatorViewState,
    SimulatorApp,
    PhoneScreenId,
    EmailScreenId,
    MessagesScreenId,
    HomeScreenId,
} from '../types/session';
import {
    DEFAULT_PHONE_SCREEN,
    DEFAULT_EMAIL_SCREEN,
    DEFAULT_MESSAGES_SCREEN,
    DEFAULT_INTERNET_SCREEN,
    DEFAULT_HOME_SCREEN,
} from '../types/session';

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
    activeApp: 'email',
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
        case 'phone':
            return DEFAULT_PHONE_SCREEN;
        case 'email':
            return DEFAULT_EMAIL_SCREEN;
        case 'messages':
            return DEFAULT_MESSAGES_SCREEN;
        case 'internet':
            return DEFAULT_INTERNET_SCREEN;
        case 'home':
            return DEFAULT_HOME_SCREEN;
        default:
            return DEFAULT_EMAIL_SCREEN;
    }
}

export function isPhoneScreen(s: string): s is PhoneScreenId {
    return ['history', 'contacts', 'add_contact', 'dial', 'incoming_call', 'voicemail', 'directory'].includes(s);
}

export function isEmailScreen(s: string): s is EmailScreenId {
    return ['list', 'detail', 'compose', 'outbox', 'trash'].includes(s);
}

export function isMessagesScreen(s: string): s is MessagesScreenId {
    return s === 'threads' || s === 'thread_detail' || s === 'new_thread';
}

export function isInternetScreen(s: string): s is string {
    return typeof s === 'string' && s.length > 0;
}

export function isHomeScreen(s: string): s is HomeScreenId {
    return ['home', 'store', 'settings'].includes(s);
}

export function parseEntryScreen(app: SimulatorApp, screen: string): string {
    const lower = screen?.toLowerCase() ?? '';
    switch (app) {
        case 'phone':
            return isPhoneScreen(lower) ? lower : DEFAULT_PHONE_SCREEN;
        case 'email':
            if (['detail', 'list', 'compose', 'outbox', 'trash'].includes(lower)) return lower;
            return DEFAULT_EMAIL_SCREEN;
        case 'messages':
            if (lower === 'thread_detail' || lower === 'threads' || lower === 'new_thread') return lower;
            return DEFAULT_MESSAGES_SCREEN;
        case 'internet':
            return isInternetScreen(lower) ? lower : DEFAULT_INTERNET_SCREEN;
        case 'home':
            return isHomeScreen(lower) ? lower : DEFAULT_HOME_SCREEN;
        default:
            return getDefaultScreen(app);
    }
}
