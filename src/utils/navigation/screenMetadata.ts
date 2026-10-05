import {
    SimulatorEmailScreenId,
    SimulatorHomeScreenId,
    SimulatorMessagesScreenId,
} from '@signalsafe/simulator-core/devicePayload';
import { ownValue } from '../lookup.js';
import { englishLocale } from '../../i18n/englishLocale.js';
/**
 * Structured screen metadata for the simulator: current app/screen, list-detail relationship,
 * back/cancel affordances, and optional labels. Used by admin preview, debug logging, and
 * optional breadcrumbs. Kept declarative and derived from view + payload.
 */

import type { SimulatorViewState, SimulatorTemplatePayload } from '../../types/session.js';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';

/** Where a screen sits in its app: list, detail, page or new thread. */
export const SimulatorScreenSource = Object.freeze({
    List: 'list',
    Detail: 'detail',
    Page: 'page',
    NewThread: 'new_thread',
} as const);
export type SimulatorScreenSource =
    (typeof SimulatorScreenSource)[keyof typeof SimulatorScreenSource];

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
    source: SimulatorScreenSource;
    /** Optional page title when app is internet (from payload). */
    pageTitle: string | null;
}

const APP_LABELS: Record<SimulatorApp, string> = {
    [SimulatorApp.Email]: 'Email',
    [SimulatorApp.Messages]: 'Messages',
    [SimulatorApp.Internet]: 'Internet',
    [SimulatorApp.Phone]: 'Phone',
    [SimulatorApp.Home]: 'Home',
};

/** Human labels for phone app screens (metadata/debug). */
const PHONE_SCREEN_LABELS: Record<string, string> = {
    history: 'History',
    contacts: 'Contacts',
    dial: 'Dial',
    incoming_call: englishLocale.t('copy.screenMetadata.incoming.call'),
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
    const isDetail = screen === SimulatorEmailScreenId.Detail;
    return {
        app: SimulatorApp.Email,
        screen,
        parentScreen: isDetail ? SimulatorEmailScreenId.List : null,
        showBack: isDetail && view.stack.length > 0,
        showCancel: !isDetail,
        label: isDetail ? 'Email → Message' : 'Email → Inbox',
        source: isDetail ? SimulatorScreenSource.Detail : SimulatorScreenSource.List,
        pageTitle: null,
    };
}

function buildMessagesMetadata(view: SimulatorViewState['messages']): SimulatorScreenMetadata {
    const screen = view.screen;
    const isDetail = screen === SimulatorMessagesScreenId.ThreadDetail;
    const isNewThread = screen === SimulatorMessagesScreenId.NewThread;
    return {
        app: SimulatorApp.Messages,
        screen,
        parentScreen: isDetail || isNewThread ? SimulatorMessagesScreenId.Threads : null,
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
    isNewThread: boolean,
): SimulatorScreenMetadata['source'] {
    if (isDetail) {
        return SimulatorEmailScreenId.Detail;
    }
    if (isNewThread) {
        return SimulatorMessagesScreenId.NewThread;
    }
    return SimulatorEmailScreenId.List;
}

function getStackParent(stack: readonly string[]): string | null {
    return stack.at(-1) ?? null;
}

function buildInternetMetadata(
    view: SimulatorViewState['internet'],
    payload: SimulatorTemplatePayload,
): SimulatorScreenMetadata {
    const screen = view.screen;
    const pageTitle = getInternetPageTitle(payload, screen);
    return {
        app: SimulatorApp.Internet,
        screen,
        parentScreen: getStackParent(view.stack),
        showBack: view.stack.length > 0,
        showCancel: view.stack.length === 0,
        label: `Internet → ${pageTitle ?? screen}`,
        source: SimulatorScreenSource.Page,
        pageTitle,
    };
}

function buildPhoneMetadata(view: SimulatorViewState['phone']): SimulatorScreenMetadata {
    const screen = view.screen;
    return {
        app: SimulatorApp.Phone,
        screen,
        parentScreen: getStackParent(view.stack),
        showBack: view.stack.length > 0,
        showCancel: true,
        label: `Phone → ${PHONE_SCREEN_LABELS[screen] ?? screen}`,
        source: SimulatorScreenSource.List,
        pageTitle: null,
    };
}

function buildHomeMetadata(view: SimulatorViewState['home']): SimulatorScreenMetadata {
    const screen = view.screen;
    const isHome = screen === SimulatorHomeScreenId.Home;
    return {
        app: SimulatorApp.Home,
        screen,
        parentScreen: isHome ? null : SimulatorHomeScreenId.Home,
        showBack: !isHome,
        showCancel: isHome,
        label: `Home → ${HOME_SCREEN_LABELS[screen] ?? screen}`,
        source: isHome ? SimulatorScreenSource.List : SimulatorScreenSource.Detail,
        pageTitle: null,
    };
}

function getFallbackScreen(_view: SimulatorViewState, _app: SimulatorApp): string {
    return '';
}

const METADATA_BUILDERS: Readonly<
    Record<
        SimulatorApp,
        (view: SimulatorViewState, payload: SimulatorTemplatePayload) => SimulatorScreenMetadata
    >
> = Object.freeze({
    [SimulatorApp.Email]: (view) => buildEmailMetadata(view.email),
    [SimulatorApp.Messages]: (view) => buildMessagesMetadata(view.messages),
    [SimulatorApp.Internet]: (view, payload) => buildInternetMetadata(view.internet, payload),
    [SimulatorApp.Phone]: (view) => buildPhoneMetadata(view.phone),
    [SimulatorApp.Home]: (view) => buildHomeMetadata(view.home),
});

/**
 * Derive structured screen metadata from current view state and payload.
 * Declarative: no side effects; safe to call on every render or log.
 */
export function getScreenMetadata(
    view: SimulatorViewState,
    payload: SimulatorTemplatePayload,
): SimulatorScreenMetadata {
    const app = view.activeApp;
    const build = ownValue(METADATA_BUILDERS, app);
    if (build) return build(view, payload);
    const screen = getFallbackScreen(view, app);
    return {
        app,
        screen: String(screen),
        parentScreen: null,
        showBack: false,
        showCancel: true,
        label: `${APP_LABELS[app] ?? app} / ${screen}`,
        source: SimulatorScreenSource.List,
        pageTitle: null,
    };
}

/**
 * Short one-line label for admin/debug (e.g. "Email → Message", "Internet → Verify your account").
 */
export function getScreenContextLabel(meta: SimulatorScreenMetadata): string {
    return meta.label;
}
