/**
 * Screen registry: declarative (app, screen) → component + getProps.
 * Resolution: exact (app, screen) first, then (app) default. No reducer logic here.
 */
import type { ComponentType, ReactNode } from 'react';
import type { PhoneScreenId, EmailScreenId } from '../types/session';
import { SimulatorActions } from '../actions';
import { getPhoneLocalNavItems } from '../utils/phoneLocalNavItems';
import type { SimulatorApp } from '../types/portableSimulator';
import type { SimulatorRenderContext, ScreenEntry } from './types';
import EmailSimulatorView from '../views/EmailSimulatorView';
import MessagesThreadListView from '../views/MessagesThreadListView';
import MessagesNewThreadView from '../views/MessagesNewThreadView';
import SmsSimulatorView from '../views/SmsSimulatorView';
import BrowserSimulatorView from '../views/BrowserSimulatorView';
import ContactsView from '../views/ContactsView';
import DirectoryView from '../views/DirectoryView';
import PhoneSimulatorView from '../views/PhoneSimulatorView';
import HomeSimulatorView from '../views/HomeSimulatorView';
import type { ThreadListRow } from '../views/MessagesThreadListView';

function buildMessagesThreadList(payload: SimulatorRenderContext['state']['payload']): ThreadListRow[] {
    const sms = payload.sms;
    if (sms?.threads != null && sms.threads.length > 0) {
        return sms.threads;
    }
    const thread = sms?.thread;
    if (thread == null) return [];
    const first = thread.messages?.find((m: { text?: string }) => m?.text);
    const preview = getThreadPreview(first?.text);
    return [
        {
            id: '0',
            preview,
            senderName: thread.sender_display_name,
            senderNumber: thread.sender_number,
            timestamp: thread.last_at,
            unread: thread.unread,
        },
    ];
}

function getThreadPreview(text: string | undefined): string {
    if (typeof text !== 'string') {
        return 'New message';
    }
    if (text.length > 60) {
        return `${text.slice(0, 60)}…`;
    }
    return text;
}

const SCREEN_REGISTRY: ScreenEntry[] = [
    {
        app: 'email',
        component: EmailSimulatorView,
        getProps: (ctx) => ({
            payload: ctx.state.payload.email,
            screen: ctx.state.view.email.screen,
            selectedMessageId: ctx.state.view.email.selectedMessageId,
            onAction: ctx.onAction,
            onSelectMessage: ctx.onSelectEmail,
            onBack: ctx.onBack,
            onNavigate: (screen: EmailScreenId) =>
                ctx.dispatch({ type: 'SIMULATOR_ACTION', action: SimulatorActions.navigateScreen('email', screen) }),
            navRenderedByShell:
                !ctx.state.view.showPrimaryMenu && ctx.state.view.activeApp === 'email',
        }),
    },
    {
        app: 'messages',
        screen: 'threads',
        component: MessagesThreadListView,
        getProps: (ctx) => ({
            threads: buildMessagesThreadList(ctx.state.payload),
            onSelectThread: ctx.onSelectThread,
            onCompose: () =>
                ctx.dispatch({ type: 'NAV_LOCAL', app: 'messages', screen: 'new_thread' }),
        }),
    },
    {
        app: 'messages',
        screen: 'new_thread',
        component: MessagesNewThreadView,
        getProps: (ctx) => ({
            onBack: ctx.onBack,
        }),
    },
    {
        app: 'messages',
        screen: 'thread_detail',
        component: SmsSimulatorView,
        getProps: (ctx) => ({
            payload: ctx.state.payload.sms,
            visibleCount: ctx.state.view.messages.visibleCount,
            onAction: ctx.onAction,
            onRevealNext: ctx.onSmsRevealNext,
            onBack: ctx.onBack,
            showReplyBox: true,
        }),
    },
    {
        app: 'internet',
        component: BrowserSimulatorView,
        getProps: (ctx) => ({
            payload: ctx.state.payload.browser,
            screen: ctx.state.view.internet.screen,
            stack: ctx.state.view.internet.stack,
            onAction: ctx.onAction,
            onBack: ctx.onBack,
        }),
    },
    {
        app: 'phone',
        screen: 'contacts',
        component: ContactsView,
        getProps: (ctx) => {
            const phoneScreen = ctx.state.view.phone.screen;
            const onPhoneNav = (id: string) =>
                ctx.dispatch({ type: 'SIMULATOR_ACTION', action: SimulatorActions.navigateScreen('phone', id) });
            const navRenderedByShell =
                !ctx.state.view.showPrimaryMenu && ctx.state.view.activeApp === 'phone';
            const contactsSearchQuery = getContactsSearchQuery(
                ctx.state.view.contactsSearchQuery,
                ctx.initialContactsSearch
            );
            const payload = ctx.state.payload;
            const isItHelpdeskWireframe = payload.templateKey === 'harness-phone-contact-it-helpdesk';
            return {
                contacts: payload.contacts,
                title: 'Contacts',
                onBack: ctx.onBack,
                onOpenContact: ctx.onOpenContactFromPhone,
                onSearchSubmit: (query) => ctx.onAction(SimulatorActions.searchContacts(query)),
                initialSearch: ctx.initialContactsSearch,
                searchQuery: contactsSearchQuery,
                onSearchChange: (query) => ctx.dispatch({ type: 'SET_CONTACTS_SEARCH', query }),
                phoneLocalNavItems: navRenderedByShell ? undefined : getPhoneLocalNavItems(ctx.capabilities.phone),
                phoneActiveId: phoneScreen,
                onPhoneNavSelect: navRenderedByShell ? undefined : onPhoneNav,
                onAddContact: () =>
                    ctx.dispatch({ type: 'SIMULATOR_ACTION', action: SimulatorActions.navigateScreen('phone', 'add_contact') }),
                initialSelectedContactId: isItHelpdeskWireframe ? 'it-helpdesk' : null,
                contactDetailTitleOnly: isItHelpdeskWireframe,
            };
        },
    },
    {
        app: 'phone',
        screen: 'directory',
        component: DirectoryView,
        getProps: (ctx) => {
            const phoneScreen = ctx.state.view.phone.screen;
            const onPhoneNav = (id: string) =>
                ctx.dispatch({ type: 'SIMULATOR_ACTION', action: SimulatorActions.navigateScreen('phone', id) });
            const navRenderedByShell =
                !ctx.state.view.showPrimaryMenu && ctx.state.view.activeApp === 'phone';
            const payload = ctx.state.payload;
            const initialSelectedDirectoryId =
                payload.templateKey === 'harness-phone-directory-entry'
                    ? (payload.directory?.[0]?.id ?? null)
                    : null;
            return {
                directory: payload.directory,
                contacts: payload.contacts,
                onBack: ctx.onBack,
                onAction: ctx.onAction,
                onViewEntry: (entryId: string) => ctx.onAction(SimulatorActions.viewDirectoryEntry(entryId)),
                phoneLocalNavItems: navRenderedByShell ? undefined : getPhoneLocalNavItems(ctx.capabilities.phone),
                phoneActiveId: phoneScreen,
                onPhoneNavSelect: navRenderedByShell ? undefined : onPhoneNav,
                initialSelectedDirectoryId,
            };
        },
    },
    {
        app: 'phone',
        component: PhoneSimulatorView,
        getProps: (ctx) => ({
            payload: ctx.state.payload.phone,
            directory: ctx.state.payload.directory,
            contacts: ctx.state.payload.contacts,
            phoneCapabilities: ctx.capabilities.phone,
            screen: ctx.state.view.phone.screen,
            onNavigate: (screenId: PhoneScreenId) =>
                ctx.dispatch({ type: 'SIMULATOR_ACTION', action: SimulatorActions.navigateScreen('phone', screenId) }),
            onAction: ctx.onAction,
            onDismissIncoming: ctx.onBack,
            onBack: ctx.onBack,
            navRenderedByShell:
                !ctx.state.view.showPrimaryMenu && ctx.state.view.activeApp === 'phone',
        }),
    },
    {
        app: 'home',
        component: HomeSimulatorView,
        getProps: (ctx) => ({
            payload: ctx.state.payload.home,
            homeCapabilities: ctx.capabilities.home,
            screen: ctx.state.view.home.screen,
            onNavigate: (screenId: 'home' | 'store' | 'settings') =>
                ctx.dispatch({ type: 'SIMULATOR_ACTION', action: SimulatorActions.navigateScreen('home', screenId) }),
            onAction: ctx.onAction,
            onBack: ctx.onBack,
        }),
    },
];

/** Current screen id for an app (from view state). */
function getScreenForApp(app: SimulatorApp, ctx: SimulatorRenderContext): string {
    switch (app) {
        case 'email':
            return ctx.state.view.email.screen;
        case 'messages':
            return ctx.state.view.messages.screen;
        case 'internet':
            return ctx.state.view.internet.screen;
        case 'phone':
            return ctx.state.view.phone.screen;
        case 'home':
            return ctx.state.view.home.screen;
        default:
            return '';
    }
}

function getContactsSearchQuery(
    contactsSearchQuery: string,
    initialContactsSearch: string | undefined
): string {
    if (contactsSearchQuery === '') {
        return initialContactsSearch ?? '';
    }
    return contactsSearchQuery;
}

/**
 * Resolve (app, view state) to the registry entry. Exact (app, screen) match first, then app default.
 */
export function resolveScreen(app: SimulatorApp, ctx: SimulatorRenderContext): ScreenEntry | null {
    const screen = getScreenForApp(app, ctx);
    const exact = SCREEN_REGISTRY.find((e) => e.app === app && e.screen !== undefined && e.screen === screen);
    if (exact != null) return exact;
    const fallback = SCREEN_REGISTRY.find((e) => e.app === app && e.screen === undefined);
    return fallback ?? null;
}

/**
 * Render the active app screen using the registry. Returns React node or null if no entry.
 */
export function renderActiveScreen(app: SimulatorApp, ctx: SimulatorRenderContext): ReactNode {
    const entry = resolveScreen(app, ctx);
    if (entry == null) {
        return null;
    }
    const props = entry.getProps(ctx);
    const Component = entry.component as unknown as ComponentType<Record<string, unknown>>;
    return <Component {...props} />;
}

export { SCREEN_REGISTRY };
