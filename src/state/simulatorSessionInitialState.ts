import {
    channelToApp,
    type SimulatorSessionState,
    DEFAULT_INTERNET_SCREEN,
    DEFAULT_HOME_SCREEN,
} from '../types/session.js';
import {
    SimulatorEmailScreenId,
    isEmailScreen,
    isMessagesScreen,
    isHomeScreen,
    isPhoneScreen,
} from '@signalsafe/simulator-core/devicePayload';
/**
 * Build initial session state from payload (entry_point when present).
 */

import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import { validateSimulatorPayload } from '../utils/payload/validateSimulatorPayload.js';
import {
    createInitialEmailState,
    createInitialHomeState,
    createInitialMessagesState,
    createInitialPhoneState,
    getDefaultScreen,
    initialViewState,
    parseEntryScreen,
} from './simulatorViewStateHelpers.js';

function getEntryAppFromPayload(payload: SimulatorSessionState['payload']): SimulatorApp {
    if (payload.entryPoint?.app != null) return payload.entryPoint.app;
    return channelToApp(payload.channel);
}

function resolveInitialInternetScreen(
    payload: SimulatorSessionState['payload'],
    app: SimulatorApp,
    entryScreen: string,
): string {
    if (app !== SimulatorApp.Internet) return DEFAULT_INTERNET_SCREEN;
    const pages = payload.browser?.pages;
    const defaultId = payload.browser?.defaultPageId ?? DEFAULT_INTERNET_SCREEN;
    if (pages?.length === 0 || pages == null) return defaultId;
    return pages.some((page) => page?.id === entryScreen) ? entryScreen : defaultId;
}

export function getInitialSessionState(
    payload: SimulatorSessionState['payload'],
): SimulatorSessionState {
    validateSimulatorPayload(payload);
    const app = getEntryAppFromPayload(payload);
    const rawEntryScreen = payload.entryPoint?.screen;
    const entryScreen =
        rawEntryScreen == null ? getDefaultScreen(app) : parseEntryScreen(app, rawEntryScreen);

    const view: SimulatorSessionState['view'] = {
        ...initialViewState,
        activeApp: app,
        showPrimaryMenu: app !== SimulatorApp.Phone && app !== SimulatorApp.Email,
        phone: createInitialPhoneState(),
        email: {
            ...createInitialEmailState(),
            screen: app === SimulatorApp.Email && isEmailScreen(entryScreen) ? entryScreen : 'list',
            selectedMessageId:
                app === SimulatorApp.Email && entryScreen === SimulatorEmailScreenId.Detail
                    ? (payload.email?.selectedMessageId ?? payload.email?.inbox?.[0]?.id ?? null)
                    : null,
        },
        messages: {
            ...createInitialMessagesState(),
            screen:
                app === SimulatorApp.Messages && isMessagesScreen(entryScreen)
                    ? entryScreen
                    : 'threads',
        },
        internet: {
            screen: resolveInitialInternetScreen(payload, app, entryScreen),
            stack: [],
        },
        home: {
            ...createInitialHomeState(),
            screen:
                app === SimulatorApp.Home && isHomeScreen(entryScreen)
                    ? entryScreen
                    : DEFAULT_HOME_SCREEN,
        },
    };
    if (app === SimulatorApp.Phone && isPhoneScreen(entryScreen)) {
        view.phone.screen = entryScreen;
    }
    return { payload, view };
}
