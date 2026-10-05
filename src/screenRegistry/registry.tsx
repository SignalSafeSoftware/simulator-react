/**
 * Screen registry: declarative (app, screen) → component + getProps.
 * Resolution: exact (app, screen) first, then (app) default. No reducer logic here.
 */
import {
    SimulatorMessagesScreenId,
    SimulatorPhoneScreenId,
} from '@signalsafe/simulator-core/devicePayload';
import { SimulatorDispatchActionType } from '../state/simulatorDispatchActions.js';
import { createTranslator, simulatorEnglish } from '../i18n/catalog.js';
import type { ComponentType, ReactNode } from 'react';
import {
    type PhoneScreenId,
    type EmailScreenId,
    type HomeScreenId,
    getCurrentScreenForApp,
} from '../types/session.js';
import { SimulatorActions } from '../actions/simulatorActions.js';
import { getPhoneLocalNavItems } from '../utils/navigation/phoneLocalNavItems.js';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import type {
    EntryDefinition,
    ScreenEntry,
    ScreenEntryRender,
    SimulatorRenderContext,
} from './types.js';
import EmailSimulatorView from '../views/email/EmailSimulatorView.js';
import MessagesThreadListView from '../views/messages/MessagesThreadListView.js';
import { buildMessagesThreadList } from './messagesThreadList.js';
import MessagesNewThreadView from '../views/messages/MessagesNewThreadView.js';
import SmsSimulatorView from '../views/messages/SmsSimulatorView.js';
import BrowserSimulatorView from '../views/browser/BrowserSimulatorView.js';
import ContactsView from '../views/contacts/ContactsView.js';
import DirectoryView from '../views/contacts/DirectoryView.js';
import PhoneSimulatorView from '../views/phone/PhoneSimulatorView.js';
import HomeSimulatorView from '../views/home/HomeSimulatorView.js';

const defaultLocale = createTranslator(simulatorEnglish);

/** Binds a component to its own props builder, so rendering needs no cast. */
function bind<P extends object>(
    component: ComponentType<P>,
    getProps: (ctx: SimulatorRenderContext) => NoInfer<P>,
): EntryDefinition<P> & ScreenEntryRender {
    return {
        component,
        getProps,
        render: (ctx) => {
            const Component = component;
            return <Component {...getProps(ctx)} />;
        },
    };
}

const SCREEN_REGISTRY: ScreenEntry[] = [
    {
        app: SimulatorApp.Email,
        ...bind(EmailSimulatorView, (ctx) => ({
            payload: ctx.state.payload.email,
            screen: ctx.state.view.email.screen,
            selectedMessageId: ctx.state.view.email.selectedMessageId,
            onAction: ctx.onAction,
            onSelectMessage: ctx.onSelectEmail,
            onBack: ctx.onBack,
            onNavigate: (screen: EmailScreenId) => navigateTo(ctx, SimulatorApp.Email, screen),
            navRenderedByShell:
                ctx.hostOwnsScreenActions ||
                (!ctx.state.view.showPrimaryMenu &&
                    ctx.state.view.activeApp === SimulatorApp.Email),
        })),
    },
    {
        app: SimulatorApp.Messages,
        screen: SimulatorMessagesScreenId.Threads,
        ...bind(MessagesThreadListView, (ctx) => ({
            threads: buildMessagesThreadList(ctx.state.payload, ctx.locale ?? defaultLocale),
            onSelectThread: ctx.onSelectThread,
            onCompose: () =>
                ctx.dispatch({
                    type: SimulatorDispatchActionType.NavLocal,
                    app: SimulatorApp.Messages,
                    screen: SimulatorMessagesScreenId.NewThread,
                }),
        })),
    },
    {
        app: SimulatorApp.Messages,
        screen: SimulatorMessagesScreenId.NewThread,
        ...bind(MessagesNewThreadView, (ctx) => ({
            onBack: ctx.onBack,
            navRenderedByShell: ctx.hostOwnsScreenActions ?? false,
        })),
    },
    {
        app: SimulatorApp.Messages,
        screen: SimulatorMessagesScreenId.ThreadDetail,
        ...bind(SmsSimulatorView, (ctx) => ({
            payload: ctx.state.payload.sms,
            visibleCount: ctx.state.view.messages.visibleCount,
            onAction: ctx.onAction,
            onRevealNext: ctx.onSmsRevealNext,
            onBack: ctx.onBack,
            showReplyBox: true,
            navRenderedByShell: ctx.hostOwnsScreenActions ?? false,
            renderChoice: ctx.renderChoice,
        })),
    },
    {
        app: SimulatorApp.Internet,
        ...bind(BrowserSimulatorView, (ctx) => ({
            payload: ctx.state.payload.browser,
            screen: ctx.state.view.internet.screen,
            stack: ctx.state.view.internet.stack,
            onAction: ctx.onAction,
            onBack: ctx.onBack,
            renderChoice: ctx.renderChoice,
            renderFeedback: ctx.renderFeedback,
        })),
    },
    {
        app: SimulatorApp.Phone,
        screen: SimulatorPhoneScreenId.Contacts,
        ...bind(ContactsView, (ctx) => {
            const phoneScreen = ctx.state.view.phone.screen;
            const onPhoneNav = (id: string) => navigateTo(ctx, SimulatorApp.Phone, id);
            const navRenderedByShell = isPhoneNavRenderedByShell(ctx);
            const contactsSearchQuery = getContactsSearchQuery(
                ctx.state.view.contactsSearchQuery,
                ctx.initialContactsSearch,
            );
            const payload = ctx.state.payload;
            const isItHelpdeskWireframe =
                payload.templateKey === 'harness-phone-contact-it-helpdesk';
            return {
                contacts: payload.contacts,
                title: (ctx.locale ?? defaultLocale).t('nav.contacts'),
                onBack: ctx.onBack,
                onOpenContact: ctx.onOpenContactFromPhone,
                onSearchSubmit: (query) => ctx.onAction(SimulatorActions.searchContacts(query)),
                initialSearch: ctx.initialContactsSearch,
                searchQuery: contactsSearchQuery,
                onSearchChange: (query) =>
                    ctx.dispatch({ type: SimulatorDispatchActionType.SetContactsSearch, query }),
                phoneLocalNavItems: navRenderedByShell
                    ? undefined
                    : getPhoneLocalNavItems(ctx.capabilities.phone, ctx.locale),
                phoneActiveId: phoneScreen,
                onPhoneNavSelect: navRenderedByShell ? undefined : onPhoneNav,
                onAddContact: () =>
                    navigateTo(ctx, SimulatorApp.Phone, SimulatorPhoneScreenId.AddContact),
                initialSelectedContactId: isItHelpdeskWireframe ? 'it-helpdesk' : null,
                contactDetailTitleOnly: isItHelpdeskWireframe,
                hostOwnsPhoneContactDetail: ctx.hostOwnsPhoneContactDetail,
                onPhoneContactOpen:
                    ctx.hostOwnsPhoneContactDetail && ctx.onPhoneContactOpen
                        ? (contactId, contact) =>
                              ctx.onPhoneContactOpen!({
                                  state: ctx.state,
                                  dispatch: ctx.dispatch,
                                  contactId,
                                  contact,
                              })
                        : undefined,
            };
        }),
    },
    {
        app: SimulatorApp.Phone,
        screen: SimulatorPhoneScreenId.Directory,
        ...bind(DirectoryView, (ctx) => {
            const phoneScreen = ctx.state.view.phone.screen;
            const onPhoneNav = (id: string) => navigateTo(ctx, SimulatorApp.Phone, id);
            const navRenderedByShell = isPhoneNavRenderedByShell(ctx);
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
                onViewEntry: (entryId: string) =>
                    ctx.onAction(SimulatorActions.viewDirectoryEntry(entryId)),
                phoneLocalNavItems: navRenderedByShell
                    ? undefined
                    : getPhoneLocalNavItems(ctx.capabilities.phone, ctx.locale),
                phoneActiveId: phoneScreen,
                onPhoneNavSelect: navRenderedByShell ? undefined : onPhoneNav,
                initialSelectedDirectoryId,
            };
        }),
    },
    {
        app: SimulatorApp.Phone,
        ...bind(PhoneSimulatorView, (ctx) => ({
            payload: ctx.state.payload.phone,
            directory: ctx.state.payload.directory,
            contacts: ctx.state.payload.contacts,
            phoneCapabilities: ctx.capabilities.phone,
            screen: ctx.state.view.phone.screen,
            onNavigate: (screenId: PhoneScreenId) => navigateTo(ctx, SimulatorApp.Phone, screenId),
            onAction: ctx.onAction,
            onDismissIncoming: ctx.onBack,
            onBack: ctx.onBack,
            navRenderedByShell: isPhoneNavRenderedByShell(ctx),
            renderChoice: ctx.renderChoice,
            sessionState: ctx.state,
            sessionDispatch: ctx.dispatch,
            renderIncomingCallExtra: ctx.renderIncomingCallExtra,
        })),
    },
    {
        app: SimulatorApp.Home,
        ...bind(HomeSimulatorView, (ctx) => ({
            payload: ctx.state.payload.home,
            homeCapabilities: ctx.capabilities.home,
            screen: ctx.state.view.home.screen,
            onNavigate: (screenId: HomeScreenId) => navigateTo(ctx, SimulatorApp.Home, screenId),
            onAction: ctx.onAction,
            onBack: ctx.onBack,
        })),
    },
];

/** Current screen id for an app (from view state). */
function getScreenForApp(app: SimulatorApp, ctx: SimulatorRenderContext): string {
    return getCurrentScreenForApp(ctx.state.view, app);
}

function navigateTo(ctx: SimulatorRenderContext, app: SimulatorApp, screen: string): void {
    ctx.dispatch({
        type: SimulatorDispatchActionType.SimulatorAction,
        action: SimulatorActions.navigateScreen(app, screen),
    });
}

function isPhoneNavRenderedByShell(ctx: SimulatorRenderContext): boolean {
    return !ctx.state.view.showPrimaryMenu && ctx.state.view.activeApp === SimulatorApp.Phone;
}

function getContactsSearchQuery(
    contactsSearchQuery: string,
    initialContactsSearch: string | undefined,
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
    const exact = SCREEN_REGISTRY.find(
        (e) => e.app === app && e.screen !== undefined && e.screen === screen,
    );
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
    return entry.render(ctx);
}

export { SCREEN_REGISTRY };
