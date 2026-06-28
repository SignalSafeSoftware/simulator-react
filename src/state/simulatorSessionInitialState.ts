/**
 * Build initial session state from payload (entry_point when present).
 */

import type { SimulatorApp } from '../types/portableSimulator.js';
import type { SimulatorSessionState } from '../types/session.js';
import { DEFAULT_INTERNET_SCREEN, DEFAULT_HOME_SCREEN } from '../types/session.js';
import { validateSimulatorPayload } from '../utils/validateSimulatorPayload.js';
import {
    createInitialEmailState,
    createInitialHomeState,
    createInitialMessagesState,
    createInitialPhoneState,
    getDefaultScreen,
    initialViewState,
    isHomeScreen,
    isPhoneScreen,
    parseEntryScreen,
} from './simulatorViewStateHelpers.js';

function getEntryAppFromPayload(payload: SimulatorSessionState['payload']): SimulatorApp {
    if (payload.entryPoint?.app != null) return payload.entryPoint.app;
    switch (payload.channel) {
        case 'sms':
            return 'messages';
        case 'browser':
            return 'internet';
        case 'phone':
        case 'contacts':
            return 'phone';
        case 'home':
            return 'home';
        default:
            return 'email';
    }
}

function resolveInitialInternetScreen(
    payload: SimulatorSessionState['payload'],
    app: SimulatorApp,
    entryScreen: string
): string {
    if (app !== 'internet') return DEFAULT_INTERNET_SCREEN;
    const pages = payload.browser?.pages;
    const defaultId = payload.browser?.defaultPageId ?? DEFAULT_INTERNET_SCREEN;
    if (pages?.length === 0 || pages == null) return defaultId;
    return pages.some((page) => page?.id === entryScreen) ? entryScreen : defaultId;
}

export function getInitialSessionState(payload: SimulatorSessionState['payload']): SimulatorSessionState {
    validateSimulatorPayload(payload);
    const app = getEntryAppFromPayload(payload);
    const rawEntryScreen = payload.entryPoint?.screen;
    const entryScreen = rawEntryScreen == null ? getDefaultScreen(app) : parseEntryScreen(app, rawEntryScreen);

    const view: SimulatorSessionState['view'] = {
        ...initialViewState,
        activeApp: app,
        showPrimaryMenu: app !== 'phone' && app !== 'email',
        phone: createInitialPhoneState(),
        email: {
            ...createInitialEmailState(),
            screen: app === 'email' && entryScreen === 'detail' ? 'detail' : 'list',
            selectedMessageId:
                app === 'email' && entryScreen === 'detail'
                    ? payload.email?.selectedMessageId ?? payload.email?.inbox?.[0]?.id ?? null
                    : null,
        },
        messages: {
            ...createInitialMessagesState(),
            screen: app === 'messages' && entryScreen === 'thread_detail' ? 'thread_detail' : 'threads',
        },
        internet: {
            screen: resolveInitialInternetScreen(payload, app, entryScreen),
            stack: [],
        },
        home: {
            ...createInitialHomeState(),
            screen: app === 'home' && isHomeScreen(entryScreen) ? entryScreen : DEFAULT_HOME_SCREEN,
        },
    };
    if (app === 'phone' && isPhoneScreen(entryScreen)) {
        view.phone.screen = entryScreen;
    }
    return { payload, view };
}
