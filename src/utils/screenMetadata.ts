/**
 * Structured screen metadata for the simulator: current app/screen, list-detail relationship,
 * back/cancel affordances, and optional labels. Used by admin preview, debug logging, and
 * optional breadcrumbs. Kept declarative and derived from view + payload.
 */

import type { SimulatorViewState, SimulatorTemplatePayload } from '../types/session';
import type { SimulatorApp } from '../types/portableSimulator';

export interface SimulatorScreenMetadata {
    /** Current app. */
    app: SimulatorApp;
    /** Current screen id (list, detail, thread_detail, page id, etc.). */
    screen: string;
    /** Parent screen when this is a detail/viewer (e.g. list for email/detail, threads for thread_detail). */
    parentScreen: string | null;
    /** Whether Back should be shown (stack has previous or we navigated from a list). */
    showBack: boolean;
    /** Whether Cancel is the appropriate exit (e.g. at a list/root so user can dismiss). */
    showCancel: boolean;
    /** Short human label for tooling/preview (e.g. "Email → Message", "Internet → landing"). */
    label: string;
    /** Source context for structure: list, detail, page, or messages new-thread. */
    source: 'list' | 'detail' | 'page' | 'new_thread';
    /** Optional page title when app is internet (from payload). */
    pageTitle: string | null;
}

const APP_LABELS: Record<SimulatorApp, string> = {
    email: 'Email',
    messages: 'Messages',
    internet: 'Internet',
    phone: 'Phone',
    home: 'Home',
};

/** Human labels for phone app screens (metadata/debug). */
const PHONE_SCREEN_LABELS: Record<string, string> = {
    history: 'History',
    contacts: 'Contacts',
    dial: 'Dial',
    incoming_call: 'Incoming call',
    voicemail: 'Voicemail',
    directory: 'Directory',
};

/** Human labels for home app screens (metadata/debug). */
const HOME_SCREEN_LABELS: Record<string, string> = {
    home: 'Home',
    store: 'Store',
    settings: 'Settings',
};

function getInternetPageTitle(payload: SimulatorTemplatePayload, pageId: string): string | null {
    const pages = payload.browser?.pages;
    if (!Array.isArray(pages)) return null;
    const page = pages.find((p) => p?.id === pageId);
    return page && typeof page.title === 'string' ? page.title : null;
}

function buildEmailMetadata(view: SimulatorViewState['email']): SimulatorScreenMetadata {
    const screen = view.screen;
    const isDetail = screen === 'detail';
    return {
        app: 'email',
        screen,
        parentScreen: isDetail ? 'list' : null,
        showBack: isDetail && view.stack.length > 0,
        showCancel: !isDetail,
        label: isDetail ? 'Email → Message' : 'Email → Inbox',
        source: isDetail ? 'detail' : 'list',
        pageTitle: null,
    };
}

function buildMessagesMetadata(view: SimulatorViewState['messages']): SimulatorScreenMetadata {
    const screen = view.screen;
    const isDetail = screen === 'thread_detail';
    const isNewThread = screen === 'new_thread';
    return {
        app: 'messages',
        screen,
        parentScreen: isDetail || isNewThread ? 'threads' : null,
        showBack: (isDetail || isNewThread) && view.stack.length > 0,
        showCancel: !isDetail && !isNewThread,
        label: getMessagesLabel(isDetail, isNewThread),
        source: getMessagesSource(isDetail, isNewThread),
        pageTitle: null,
    };
}

function getMessagesLabel(isDetail: boolean, isNewThread: boolean): string {
    if (isDetail) {
        return 'Messages → Thread';
    }
    if (isNewThread) {
        return 'Messages → New Thread';
    }
    return 'Messages → Threads';
}

function getMessagesSource(
    isDetail: boolean,
    isNewThread: boolean
): SimulatorScreenMetadata['source'] {
    if (isDetail) {
        return 'detail';
    }
    if (isNewThread) {
        return 'new_thread';
    }
    return 'list';
}

function getStackParent(stack: readonly string[]): string | null {
    return stack.at(-1) ?? null;
}

function buildInternetMetadata(
    view: SimulatorViewState['internet'],
    payload: SimulatorTemplatePayload
): SimulatorScreenMetadata {
    const screen = view.screen;
    const pageTitle = getInternetPageTitle(payload, screen);
    return {
        app: 'internet',
        screen,
        parentScreen: getStackParent(view.stack),
        showBack: view.stack.length > 0,
        showCancel: view.stack.length === 0,
        label: `Internet → ${pageTitle ?? screen}`,
        source: 'page',
        pageTitle,
    };
}

function buildPhoneMetadata(view: SimulatorViewState['phone']): SimulatorScreenMetadata {
    const screen = view.screen;
    return {
        app: 'phone',
        screen,
        parentScreen: getStackParent(view.stack),
        showBack: view.stack.length > 0,
        showCancel: true,
        label: `Phone → ${PHONE_SCREEN_LABELS[screen] ?? screen}`,
        source: 'list',
        pageTitle: null,
    };
}

function buildHomeMetadata(view: SimulatorViewState['home']): SimulatorScreenMetadata {
    const screen = view.screen;
    const isHome = screen === 'home';
    return {
        app: 'home',
        screen,
        parentScreen: isHome ? null : 'home',
        showBack: !isHome,
        showCancel: isHome,
        label: `Home → ${HOME_SCREEN_LABELS[screen] ?? screen}`,
        source: isHome ? 'list' : 'detail',
        pageTitle: null,
    };
}

function getFallbackScreen(_view: SimulatorViewState, _app: SimulatorApp): string {
    return '';
}

/**
 * Derive structured screen metadata from current view state and payload.
 * Declarative: no side effects; safe to call on every render or log.
 */
export function getScreenMetadata(
    view: SimulatorViewState,
    payload: SimulatorTemplatePayload
): SimulatorScreenMetadata {
    const app = view.activeApp;

    switch (app) {
        case 'email':
            return buildEmailMetadata(view.email);
        case 'messages':
            return buildMessagesMetadata(view.messages);
        case 'internet':
            return buildInternetMetadata(view.internet, payload);
        case 'phone':
            return buildPhoneMetadata(view.phone);
        case 'home':
            return buildHomeMetadata(view.home);
        default: {
            const screen = getFallbackScreen(view, app);
            return {
                app,
                screen: String(screen),
                parentScreen: null,
                showBack: false,
                showCancel: true,
                label: `${APP_LABELS[app] ?? app} / ${screen}`,
                source: 'list',
                pageTitle: null,
            };
        }
    }
}

/**
 * Short one-line label for admin/debug (e.g. "Email → Message", "Internet → Verify your account").
 */
export function getScreenContextLabel(meta: SimulatorScreenMetadata): string {
    return meta.label;
}
