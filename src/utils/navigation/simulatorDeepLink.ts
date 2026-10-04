import {
    SimulatorEmailScreenId,
    SimulatorMessagesScreenId,
    SimulatorPhoneScreenId,
    isEmailScreen,
    isHomeScreen,
    isMessagesScreen,
    isPhoneScreen,
} from '@signalsafe/simulator-core/devicePayload';
/**
 * Deep-link parsing and application for the unified simulator.
 * Query params allow opening a specific app/screen/context (preview, QA, debugging).
 * Optional: when no params present, entry_point and normal init are unchanged.
 */

import { SimulatorApp, isSimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import type { SimulatorSessionState, SimulatorViewState } from '../../types/session.js';
import { BROWSER_HISTORY_MAX, DEFAULT_INTERNET_SCREEN } from '../../types/session.js';

export interface SimulatorDeepLink {
    app: SimulatorApp;
    screen?: string;
    /** Email: open message by id (inbox row id). */
    messageId?: string;
    /** Internet: open page by id (payload.browser.pages[].id). */
    pageId?: string;
    /** Contacts: prefilled search query (passed to view as initial). */
    search?: string;
}

const QUERY_APP = 'app';
const QUERY_SCREEN = 'screen';
const QUERY_MESSAGE_ID = 'messageId';
const QUERY_PAGE_ID = 'pageId';
const QUERY_SEARCH = 'search';

function normalizeQueryValue(value: string | null): string | undefined {
    return value != null && value !== '' ? value : undefined;
}

function isValidScreenForApp(app: SimulatorApp, screen: string): boolean {
    switch (app) {
        case SimulatorApp.Phone:
            return isPhoneScreen(screen);
        case SimulatorApp.Email:
            return isEmailScreen(screen);
        case SimulatorApp.Messages:
            return isMessagesScreen(screen);
        case SimulatorApp.Internet:
            return screen.length > 0;
        case SimulatorApp.Home:
            return isHomeScreen(screen);
    }
}

function buildEmailView(
    view: SimulatorViewState,
    payload: SimulatorSessionState['payload'],
    link: SimulatorDeepLink,
): SimulatorViewState['email'] {
    const screen = resolveEmailScreen(view, link);

    let selectedMessageId = view.email.selectedMessageId;
    if (link.messageId != null && link.messageId !== '') {
        const exists = payload.email?.inbox?.some((row) => row.id === link.messageId);
        if (exists) selectedMessageId = link.messageId;
    }

    const nextSelectedMessageId = getEmailSelectedMessageId(view, screen, selectedMessageId);
    const nextStack =
        screen === SimulatorEmailScreenId.Detail
            ? [...view.email.stack, view.email.screen]
            : view.email.stack;

    return {
        ...view.email,
        screen,
        selectedMessageId: nextSelectedMessageId,
        stack: nextStack,
    };
}

function buildMessagesView(
    view: SimulatorViewState,
    payload: SimulatorSessionState['payload'],
    link: SimulatorDeepLink,
): SimulatorViewState['messages'] {
    const screen = isMessagesScreen(link.screen) ? link.screen : view.messages.screen;
    const visibleCount =
        screen === SimulatorMessagesScreenId.ThreadDetail &&
        payload.sms?.thread?.messages?.length != null
            ? Math.max(view.messages.visibleCount, payload.sms.thread.messages.length)
            : view.messages.visibleCount;

    return {
        ...view.messages,
        screen,
        visibleCount,
        stack:
            screen === SimulatorMessagesScreenId.ThreadDetail
                ? [...view.messages.stack, view.messages.screen]
                : view.messages.stack,
    };
}

function resolveInternetTargetScreen(
    payload: SimulatorSessionState['payload'],
    currentScreen: string,
    link: SimulatorDeepLink,
): string {
    const requestedPageId =
        link.pageId != null && link.pageId !== '' ? link.pageId : (link.screen ?? currentScreen);
    const pages = payload.browser?.pages ?? [];
    const exists = pages.some((page) => page?.id === requestedPageId);
    return exists ? requestedPageId : (payload.browser?.defaultPageId ?? DEFAULT_INTERNET_SCREEN);
}

function buildInternetView(
    view: SimulatorViewState,
    payload: SimulatorSessionState['payload'],
    link: SimulatorDeepLink,
): SimulatorViewState['internet'] {
    const screen = resolveInternetTargetScreen(payload, view.internet.screen, link);
    const stack =
        screen === view.internet.screen
            ? view.internet.stack
            : [...view.internet.stack, view.internet.screen].slice(-BROWSER_HISTORY_MAX);
    return {
        ...view.internet,
        screen,
        stack,
    };
}

function buildPhoneView(
    view: SimulatorViewState,
    link: SimulatorDeepLink,
): SimulatorViewState['phone'] {
    const screen = isPhoneScreen(link.screen) ? link.screen : view.phone.screen;
    const stack = getNextPhoneStack(view.phone.stack, view.phone.screen, screen);
    return {
        ...view.phone,
        screen,
        stack,
    };
}

function buildHomeView(
    view: SimulatorViewState,
    link: SimulatorDeepLink,
): SimulatorViewState['home'] {
    const screen = isHomeScreen(link.screen) ? link.screen : view.home.screen;
    return { ...view.home, screen };
}

/**
 * Parse search params into a typed deep-link. Returns null if no deep-link params present.
 * Validates app (and screen when provided); does not validate messageId/pageId against payload here.
 */
export function parseSimulatorSearchParams(params: URLSearchParams): SimulatorDeepLink | null {
    const appRaw = params.get(QUERY_APP);
    if (appRaw == null || appRaw === '') return null;

    const app = appRaw.toLowerCase();
    if (!isSimulatorApp(app)) return null;

    const screen = normalizeQueryValue(params.get(QUERY_SCREEN));
    const messageId = normalizeQueryValue(params.get(QUERY_MESSAGE_ID));
    const pageId = normalizeQueryValue(params.get(QUERY_PAGE_ID));
    const search = normalizeQueryValue(params.get(QUERY_SEARCH));

    if (screen !== undefined && !isValidScreenForApp(app, screen)) return null;

    return {
        app,
        screen,
        messageId,
        pageId,
        search,
    };
}

/**
 * Apply a validated deep-link to session state. Only overrides view when the target exists in payload.
 * Returns a new state; does not mutate. If link is invalid for payload (e.g. messageId not in inbox), leaves state unchanged for that part.
 */
export function applyDeepLinkToState(
    state: SimulatorSessionState,
    link: SimulatorDeepLink,
): SimulatorSessionState {
    const { payload, view } = state;
    let nextView: SimulatorViewState = { ...view, activeApp: link.app };

    switch (link.app) {
        case SimulatorApp.Email:
            nextView = { ...nextView, email: buildEmailView(view, payload, link) };
            break;
        case SimulatorApp.Messages:
            nextView = { ...nextView, messages: buildMessagesView(view, payload, link) };
            break;
        case SimulatorApp.Internet:
            nextView = { ...nextView, internet: buildInternetView(view, payload, link) };
            break;
        case SimulatorApp.Phone:
            nextView = { ...nextView, phone: buildPhoneView(view, link) };
            break;
        case SimulatorApp.Home:
            nextView = { ...nextView, home: buildHomeView(view, link) };
            break;
        default:
            break;
    }

    return { ...state, view: nextView };
}

/**
 * If a deep-link requested contacts with a search query, return it; otherwise undefined.
 * Used by the shell to pass initial search to ContactsView.
 */
export function getDeepLinkContactsSearch(link: SimulatorDeepLink | null): string | undefined {
    if (link == null) {
        return undefined;
    }
    if (link.app === SimulatorApp.Phone && link.screen === SimulatorPhoneScreenId.Contacts) {
        return link.search != null && link.search !== '' ? link.search : undefined;
    }
    return undefined;
}

function resolveEmailScreen(
    view: SimulatorViewState,
    link: SimulatorDeepLink,
): SimulatorViewState['email']['screen'] {
    if (
        link.screen === SimulatorEmailScreenId.Detail ||
        (link.messageId != null && link.messageId !== '')
    ) {
        return SimulatorEmailScreenId.Detail;
    }
    if (isEmailScreen(link.screen)) {
        return link.screen;
    }
    return view.email.screen;
}

function getEmailSelectedMessageId(
    view: SimulatorViewState,
    screen: SimulatorViewState['email']['screen'],
    selectedMessageId: string | null,
): string | null {
    if (screen === SimulatorEmailScreenId.Detail) {
        return selectedMessageId;
    }
    if (screen === SimulatorEmailScreenId.List) {
        return null;
    }
    return view.email.selectedMessageId;
}

function getNextPhoneStack(
    stack: SimulatorViewState['phone']['stack'],
    currentScreen: SimulatorViewState['phone']['screen'],
    nextScreen: SimulatorViewState['phone']['screen'],
): SimulatorViewState['phone']['stack'] {
    if (nextScreen === currentScreen) {
        return stack;
    }
    return [...stack, currentScreen];
}
