import { describe, expect, it } from 'vitest';
import {
    getInitialSessionState,
    initialViewState,
    simulatorSessionReducer,
    switchChannelAction,
} from '../src/state/simulatorSessionReducer';
import type { SimulatorSessionState } from '../src/types/session';

function createPayload(overrides: Record<string, unknown> = {}): SimulatorSessionState['payload'] {
    return {
        templateId: null,
        templateKey: 'reducer-template',
        name: 'Reducer Template',
        channel: 'email',
        topicTags: [],
        runId: null,
        attemptId: null,
        entryPoint: { app: 'email', screen: 'list' },
        browser: {
            defaultPageId: 'landing',
            pages: [
                { id: 'landing', url: 'https://example.test', title: 'Landing', layout: 'landing' },
                { id: 'pricing', url: 'https://example.test/pricing', title: 'Pricing', layout: 'content' },
                { id: 'result', url: 'https://example.test/result', title: 'Result', layout: 'result' },
            ],
        },
        email: {
            inbox: [
                { id: 'm1', subject: 'Alert', from: 'alerts@example.test', snippet: 'Alert body' },
            ],
            outbox: [],
            trash: [],
            selectedMessage: {
                subject: 'Alert',
                from: 'alerts@example.test',
                body: 'Alert body',
            },
            selectedMessageId: 'm1',
        },
        sms: {
            thread: {
                messages: [{ from: 'them', text: 'Message body' }],
                sender_display_name: 'Security Team',
                sender_number: '+15550000001',
            },
            visibleMessageCount: 0,
        },
        phone: {
            content: {
                transcript: 'Incoming call',
                choices: [],
                phone_number: '+15550000002',
                caller_name: 'Caller',
            },
            chosenIndex: null,
            voicemailTranscript: 'Voicemail transcript',
        },
        contacts: [{ id: 'c1', displayName: 'Helpdesk', number: '+15550000003' }],
        directory: [{ id: 'd1', label: 'Helpdesk', number: '+15550000003' }],
        home: {
            widgets: [{ id: 'w1', label: 'News' }],
            featuredApps: [{ id: 'app-1', name: 'Store App' }],
            settingsSections: [{ id: 's1', title: 'General' }],
        },
        ...overrides,
    } as never;
}

function createState(overrides: Record<string, unknown> = {}): SimulatorSessionState {
    return {
        payload: createPayload((overrides.payload as Record<string, unknown> | undefined) ?? {}),
        view: {
            ...initialViewState,
            activeApp: 'email',
            showPrimaryMenu: false,
            phone: { screen: 'history', stack: [], chosenIndex: null },
            email: { screen: 'list', stack: [], selectedMessageId: null },
            messages: { screen: 'threads', stack: [], visibleCount: 0 },
            internet: { screen: 'landing', stack: [] },
            home: { screen: 'home' },
            ...((overrides.view as Record<string, unknown> | undefined) ?? {}),
        },
    } as never;
}

describe('simulatorSessionReducer branch coverage', () => {
    it('maps shell channels to apps', () => {
        expect(switchChannelAction('sms')).toEqual({ type: 'SWITCH_APP', app: 'messages' });
        expect(switchChannelAction('browser')).toEqual({ type: 'SWITCH_APP', app: 'internet' });
        expect(switchChannelAction('contacts')).toEqual({ type: 'SWITCH_APP', app: 'phone' });
        expect(switchChannelAction('home')).toEqual({ type: 'SWITCH_APP', app: 'home' });
    });

    it('derives initial app and screen across channels and entry-point variants', () => {
        const phoneState = getInitialSessionState(
            createPayload({ channel: 'phone', entryPoint: null })
        );
        expect(phoneState.view.activeApp).toBe('phone');
        expect(phoneState.view.phone.screen).toBe('history');
        expect(phoneState.view.showPrimaryMenu).toBe(false);

        const smsState = getInitialSessionState(
            createPayload({ channel: 'sms', entryPoint: null })
        );
        expect(smsState.view.activeApp).toBe('messages');
        expect(smsState.view.messages.screen).toBe('threads');

        const browserState = getInitialSessionState(
            createPayload({ channel: 'browser', entryPoint: null })
        );
        expect(browserState.view.activeApp).toBe('internet');
        expect(browserState.view.internet.screen).toBe('landing');

        const contactsState = getInitialSessionState(
            createPayload({ channel: 'contacts', entryPoint: null })
        );
        expect(contactsState.view.activeApp).toBe('phone');
        expect(contactsState.view.phone.screen).toBe('history');
        expect(contactsState.view.showPrimaryMenu).toBe(false);

        const homeState = getInitialSessionState(
            createPayload({ channel: 'home', entryPoint: null })
        );
        expect(homeState.view.activeApp).toBe('home');
        expect(homeState.view.home.screen).toBe('home');
        expect(homeState.view.showPrimaryMenu).toBe(true);

        const explicitHomeState = getInitialSessionState(
            createPayload({ channel: 'home', entryPoint: { app: 'home', screen: 'settings' } })
        );
        expect(explicitHomeState.view.activeApp).toBe('home');
        expect(explicitHomeState.view.home.screen).toBe('settings');
        expect(explicitHomeState.view.showPrimaryMenu).toBe(true);

        const emailDefaultState = getInitialSessionState(
            createPayload({ channel: 'email', entryPoint: null })
        );
        expect(emailDefaultState.view.activeApp).toBe('email');
        expect(emailDefaultState.view.email.screen).toBe('list');

        const invalidHomeScreen = getInitialSessionState(
            createPayload({ entryPoint: { app: 'home', screen: 'not-real' } })
        );
        expect(invalidHomeScreen.view.home.screen).toBe('home');

        const undefinedHomeScreen = getInitialSessionState(
            createPayload({ entryPoint: { app: 'home', screen: undefined as never } })
        );
        expect(undefinedHomeScreen.view.home.screen).toBe('home');

        const invalidBrowserScreen = getInitialSessionState(
            createPayload({ channel: 'browser', entryPoint: { app: 'internet', screen: '' } })
        );
        expect(invalidBrowserScreen.view.internet.screen).toBe('landing');

        const invalidEmailScreen = getInitialSessionState(
            createPayload({ entryPoint: { app: 'email', screen: 'not-real' } })
        );
        expect(invalidEmailScreen.view.email.screen).toBe('list');

        const threadDetailState = getInitialSessionState(
            createPayload({ entryPoint: { app: 'messages', screen: 'thread_detail' } })
        );
        expect(threadDetailState.view.messages.screen).toBe('thread_detail');

        const invalidMessagesScreen = getInitialSessionState(
            createPayload({ entryPoint: { app: 'messages', screen: 'bogus' } })
        );
        expect(invalidMessagesScreen.view.messages.screen).toBe('threads');

        const missingEmailSelection = getInitialSessionState(
            createPayload({
                entryPoint: { app: 'email', screen: 'detail' },
                email: {
                    inbox: [{ id: 'fallback-id', subject: 'Alert', from: 'alerts@example.test' }],
                    outbox: [],
                    trash: [],
                    selectedMessage: null,
                    selectedMessageId: null,
                },
            })
        );
        expect(missingEmailSelection.view.email.selectedMessageId).toBe('fallback-id');

        const noEmailSelection = getInitialSessionState(
            createPayload({
                entryPoint: { app: 'email', screen: 'detail' },
                email: {
                    inbox: [],
                    outbox: [],
                    trash: [],
                    selectedMessage: null,
                    selectedMessageId: null,
                },
            })
        );
        expect(noEmailSelection.view.email.selectedMessageId).toBeNull();

        const phoneFallback = getInitialSessionState(
            createPayload({ entryPoint: { app: 'phone', screen: 'not-real' } })
        );
        expect(phoneFallback.view.phone.screen).toBe('history');

        const undefinedPhoneScreen = getInitialSessionState(
            createPayload({ entryPoint: { app: 'phone', screen: undefined as never } })
        );
        expect(undefinedPhoneScreen.view.phone.screen).toBe('history');

        const unsupportedEntryApp = getInitialSessionState(
            createPayload({ entryPoint: { app: 'bogus' as never, screen: 'custom-screen' } })
        );
        expect(unsupportedEntryApp.view.activeApp).toBe('bogus');

        const emailDetail = getInitialSessionState(
            createPayload({ entryPoint: { app: 'email', screen: 'detail' } })
        );
        expect(emailDetail.view.email.screen).toBe('detail');
        expect(emailDetail.view.email.selectedMessageId).toBe('m1');

        const messagesNewThread = getInitialSessionState(
            createPayload({ entryPoint: { app: 'messages', screen: 'new_thread' } })
        );
        expect(messagesNewThread.view.messages.screen).toBe('threads');

        const browserWithoutPages = getInitialSessionState(
            createPayload({
                channel: 'browser',
                entryPoint: { app: 'internet', screen: 'missing' },
                browser: { defaultPageId: 'custom-default', pages: [] },
            })
        );
        expect(browserWithoutPages.view.internet.screen).toBe('custom-default');

        const browserWithoutPageList = getInitialSessionState(
            createPayload({
                channel: 'browser',
                entryPoint: { app: 'internet', screen: 'missing' },
                browser: { defaultPageId: 'custom-default', pages: null as never },
            })
        );
        expect(browserWithoutPageList.view.internet.screen).toBe('custom-default');
    });

    it('handles app switches and local navigation across app families', () => {
        const start = createState({
            view: {
                activeApp: 'home',
                showPrimaryMenu: true,
                phone: { screen: 'contacts', stack: ['history'], chosenIndex: 1 },
                email: { screen: 'detail', stack: ['list'], selectedMessageId: 'm1' },
            },
        });

        const phoneApp = simulatorSessionReducer(start, { type: 'SWITCH_APP', app: 'phone' });
        expect(phoneApp.view.activeApp).toBe('phone');
        expect(phoneApp.view.showPrimaryMenu).toBe(false);
        expect(phoneApp.view.phone).toEqual({ screen: 'history', stack: [], chosenIndex: 1 });

        const emailApp = simulatorSessionReducer(start, { type: 'SWITCH_APP', app: 'email' });
        expect(emailApp.view.email).toEqual({ screen: 'list', stack: [], selectedMessageId: null });

        const untouchedHome = simulatorSessionReducer(start, { type: 'SWITCH_APP', app: 'home' });
        expect(untouchedHome.view.showPrimaryMenu).toBe(true);

        const phoneNav = simulatorSessionReducer(
            createState({ view: { activeApp: 'phone', phone: { screen: 'history', stack: [], chosenIndex: null } } }),
            { type: 'NAV_LOCAL', app: 'phone', screen: 'dial' }
        );
        expect(phoneNav.view.phone).toEqual({ screen: 'dial', stack: ['history'], chosenIndex: null });

        const emailNav = simulatorSessionReducer(
            createState({ view: { activeApp: 'email', email: { screen: 'list', stack: [], selectedMessageId: null } } }),
            { type: 'NAV_LOCAL', app: 'email', screen: 'outbox' }
        );
        expect(emailNav.view.email.screen).toBe('outbox');
        expect(emailNav.view.email.stack).toEqual(['list']);

        const messagesNav = simulatorSessionReducer(
            createState({ view: { activeApp: 'messages', messages: { screen: 'threads', stack: [], visibleCount: 0 } } }),
            { type: 'NAV_LOCAL', app: 'messages', screen: 'new_thread' }
        );
        expect(messagesNav.view.messages.screen).toBe('new_thread');
        expect(messagesNav.view.messages.stack).toEqual(['threads']);

        const internetNav = simulatorSessionReducer(
            createState({ view: { activeApp: 'internet', internet: { screen: 'landing', stack: ['old'] } } }),
            { type: 'NAV_LOCAL', app: 'internet', screen: 'pricing' }
        );
        expect(internetNav.view.internet).toEqual({ screen: 'pricing', stack: ['old'] });

        const homeNav = simulatorSessionReducer(
            createState({ view: { activeApp: 'home', home: { screen: 'home' } } }),
            { type: 'NAV_LOCAL', app: 'home', screen: 'settings' }
        );
        expect(homeNav.view.home.screen).toBe('settings');

        const ignoredSameScreen = simulatorSessionReducer(
            createState({ view: { activeApp: 'phone', phone: { screen: 'history', stack: [], chosenIndex: null } } }),
            { type: 'NAV_LOCAL', app: 'phone', screen: 'history' }
        );
        expect(ignoredSameScreen.view.phone.stack).toEqual([]);

        const ignoredInvalid = simulatorSessionReducer(
            createState({ view: { activeApp: 'home', home: { screen: 'home' } } }),
            { type: 'NAV_LOCAL', app: 'home', screen: 'bogus' }
        );
        expect(ignoredInvalid.view.home.screen).toBe('home');

        const ignoredEmailInvalid = simulatorSessionReducer(
            createState({ view: { activeApp: 'email', email: { screen: 'list', stack: [], selectedMessageId: null } } }),
            { type: 'NAV_LOCAL', app: 'email', screen: 'bogus' }
        );
        expect(ignoredEmailInvalid.view.email.screen).toBe('list');

        const ignoredMessagesInvalid = simulatorSessionReducer(
            createState({ view: { activeApp: 'messages', messages: { screen: 'threads', stack: [], visibleCount: 0 } } }),
            { type: 'NAV_LOCAL', app: 'messages', screen: 'bogus' }
        );
        expect(ignoredMessagesInvalid.view.messages.screen).toBe('threads');

        const ignoredInternetInvalid = simulatorSessionReducer(
            createState({ view: { activeApp: 'internet', internet: { screen: 'landing', stack: [] } } }),
            { type: 'NAV_LOCAL', app: 'internet', screen: '' }
        );
        expect(ignoredInternetInvalid.view.internet.screen).toBe('landing');

        const invalidAppNav = simulatorSessionReducer(
            createState({ view: { activeApp: 'mystery' as never } }),
            { type: 'NAV_LOCAL', app: 'mystery' as never, screen: 'bogus' }
        );
        expect(invalidAppNav.view.activeApp).toBe('mystery');
    });

    it('handles back and cancel behavior per app', () => {
        const phoneBackToPrimary = simulatorSessionReducer(
            createState({ view: { activeApp: 'phone', showPrimaryMenu: false, phone: { screen: 'history', stack: [], chosenIndex: null } } }),
            { type: 'BACK' }
        );
        expect(phoneBackToPrimary.view.showPrimaryMenu).toBe(true);

        const phoneBackFromStack = simulatorSessionReducer(
            createState({ view: { activeApp: 'phone', phone: { screen: 'dial', stack: ['history'], chosenIndex: null } } }),
            { type: 'BACK' }
        );
        expect(phoneBackFromStack.view.phone).toEqual({ screen: 'history', stack: [], chosenIndex: null });

        const phoneBackUndefinedFallback = simulatorSessionReducer(
            createState({ view: { activeApp: 'phone', phone: { screen: 'dial', stack: [undefined as never], chosenIndex: null } } }),
            { type: 'BACK' }
        );
        expect(phoneBackUndefinedFallback.view.phone).toEqual({ screen: 'history', stack: [], chosenIndex: null });

        const emailBackEmpty = simulatorSessionReducer(
            createState({ view: { activeApp: 'email', email: { screen: 'detail', stack: [], selectedMessageId: 'm1' } } }),
            { type: 'BACK' }
        );
        expect(emailBackEmpty.view.email).toEqual({ screen: 'list', stack: [], selectedMessageId: null });

        const emailBackFromStack = simulatorSessionReducer(
            createState({ view: { activeApp: 'email', email: { screen: 'trash', stack: ['outbox'], selectedMessageId: 'm1' } } }),
            { type: 'BACK' }
        );
        expect(emailBackFromStack.view.email).toEqual({ screen: 'outbox', stack: [], selectedMessageId: null });

        const emailBackUndefinedFallback = simulatorSessionReducer(
            createState({ view: { activeApp: 'email', email: { screen: 'trash', stack: [undefined as never], selectedMessageId: 'm1' } } }),
            { type: 'BACK' }
        );
        expect(emailBackUndefinedFallback.view.email).toEqual({ screen: 'list', stack: [], selectedMessageId: null });

        const messagesBack = simulatorSessionReducer(
            createState({ view: { activeApp: 'messages', messages: { screen: 'thread_detail', stack: [], visibleCount: 0 } } }),
            { type: 'BACK' }
        );
        expect(messagesBack.view.messages.screen).toBe('threads');

        const internetBackToStack = simulatorSessionReducer(
            createState({ view: { activeApp: 'internet', internet: { screen: 'pricing', stack: ['landing'] } } }),
            { type: 'BACK' }
        );
        expect(internetBackToStack.view.internet).toEqual({ screen: 'landing', stack: [] });

        const internetBackUndefinedFallback = simulatorSessionReducer(
            createState({ view: { activeApp: 'internet', internet: { screen: 'pricing', stack: [undefined as never] } } }),
            { type: 'BACK' }
        );
        expect(internetBackUndefinedFallback.view.internet).toEqual({ screen: 'landing', stack: [] });

        const internetBackToDefault = simulatorSessionReducer(
            createState({ view: { activeApp: 'internet', internet: { screen: 'pricing', stack: [] } } }),
            { type: 'BACK' }
        );
        expect(internetBackToDefault.view.internet.screen).toBe('landing');

        const homeBack = simulatorSessionReducer(
            createState({ view: { activeApp: 'home', home: { screen: 'settings' } } }),
            { type: 'BACK' }
        );
        expect(homeBack.view.home.screen).toBe('home');

        const phoneCancel = simulatorSessionReducer(
            createState({ view: { activeApp: 'phone', phone: { screen: 'dial', stack: ['history'], chosenIndex: 2 } } }),
            { type: 'CANCEL' }
        );
        expect(phoneCancel.view.phone).toEqual({ screen: 'history', stack: [], chosenIndex: 2 });

        const emailCancel = simulatorSessionReducer(
            createState({ view: { activeApp: 'email', email: { screen: 'trash', stack: ['list'], selectedMessageId: 'm1' } } }),
            { type: 'CANCEL' }
        );
        expect(emailCancel.view.email).toEqual({ screen: 'list', stack: [], selectedMessageId: null });

        const messagesCancel = simulatorSessionReducer(
            createState({ view: { activeApp: 'messages', messages: { screen: 'new_thread', stack: ['threads'], visibleCount: 0 } } }),
            { type: 'CANCEL' }
        );
        expect(messagesCancel.view.messages).toEqual({ screen: 'threads', stack: [], visibleCount: 0 });

        const internetCancel = simulatorSessionReducer(
            createState({ view: { activeApp: 'internet', internet: { screen: 'pricing', stack: ['landing'] } } }),
            { type: 'CANCEL' }
        );
        expect(internetCancel.view.internet).toEqual({ screen: 'landing', stack: [] });

        const homeCancel = simulatorSessionReducer(
            createState({ view: { activeApp: 'home', home: { screen: 'settings' } } }),
            { type: 'CANCEL' }
        );
        expect(homeCancel.view.home.screen).toBe('home');

        const invalidBack = simulatorSessionReducer(
            createState({ view: { activeApp: 'mystery' as never } }),
            { type: 'BACK' }
        );
        expect(invalidBack.view.activeApp).toBe('mystery');

        const invalidCancel = simulatorSessionReducer(
            createState({ view: { activeApp: 'mystery' as never } }),
            { type: 'CANCEL' }
        );
        expect(invalidCancel.view.activeApp).toBe('mystery');
    });

    it('handles reducer side effects for view-only and simulator actions', () => {
        const selectedEmail = simulatorSessionReducer(createState(), { type: 'SELECT_EMAIL', messageId: 'm1' });
        expect(selectedEmail.view.email.screen).toBe('detail');
        expect(selectedEmail.view.email.stack).toEqual(['list']);

        const clearedEmail = simulatorSessionReducer(selectedEmail, { type: 'SELECT_EMAIL', messageId: null });
        expect(clearedEmail.view.email).toEqual({ screen: 'list', stack: [], selectedMessageId: null });

        const revealedSms = simulatorSessionReducer(
            createState({ view: { activeApp: 'messages', messages: { screen: 'threads', stack: [], visibleCount: 1 } } }),
            { type: 'SMS_REVEAL_NEXT' }
        );
        expect(revealedSms.view.messages.visibleCount).toBe(2);

        const browserScreen = simulatorSessionReducer(
            createState({ view: { activeApp: 'internet', internet: { screen: 'landing', stack: Array.from({ length: 20 }, (_, i) => `page-${i}`) } } }),
            { type: 'BROWSER_SCREEN', screen: 'pricing' }
        );
        expect(browserScreen.view.internet.screen).toBe('pricing');
        expect(browserScreen.view.internet.stack).toHaveLength(20);
        expect(browserScreen.view.internet.stack.at(-1)).toBe('landing');

        const phoneChoose = simulatorSessionReducer(createState(), { type: 'PHONE_CHOOSE', index: 3 });
        expect(phoneChoose.view.phone.chosenIndex).toBe(3);

        const toggledContacts = simulatorSessionReducer(createState(), { type: 'TOGGLE_CONTACTS_PANEL' });
        expect(toggledContacts.view.contactsPanelOpen).toBe(true);

        const resetSearch = simulatorSessionReducer(createState(), {
            type: 'SET_CONTACTS_SEARCH',
            query: 123 as never,
        });
        expect(resetSearch.view.contactsSearchQuery).toBe('');

        const setSearch = simulatorSessionReducer(createState(), {
            type: 'SET_CONTACTS_SEARCH',
            query: 'Ada',
        });
        expect(setSearch.view.contactsSearchQuery).toBe('Ada');

        const switchedViaBackToPrimary = simulatorSessionReducer(createState(), { type: 'BACK_TO_PRIMARY' });
        expect(switchedViaBackToPrimary.view.activeApp).toBe('home');
        expect(switchedViaBackToPrimary.view.showPrimaryMenu).toBe(true);

        const navAction = simulatorSessionReducer(
            createState({ view: { activeApp: 'home', home: { screen: 'home' } } }),
            { type: 'SIMULATOR_ACTION', action: { type: 'navigate_screen', app: 'home', screen: 'store' } }
        );
        expect(navAction.view.home.screen).toBe('store');
        expect(navAction.view.actionHistory).toHaveLength(1);

        const openAppAction = simulatorSessionReducer(
            createState({ view: { activeApp: 'home', showPrimaryMenu: true } }),
            { type: 'SIMULATOR_ACTION', action: { type: 'open_app', app: 'phone' } }
        );
        expect(openAppAction.view.activeApp).toBe('phone');

        const linkNoTarget = simulatorSessionReducer(
            createState({ view: { activeApp: 'email', internet: { screen: 'landing', stack: [] } } }),
            { type: 'SIMULATOR_ACTION', action: { type: 'click_link' } as never }
        );
        expect(linkNoTarget.view.internet.screen).toBe('landing');
        expect(linkNoTarget.view.actionHistory).toHaveLength(1);

        const linkWithFallbackPage = simulatorSessionReducer(
            createState({ view: { activeApp: 'email', email: { screen: 'detail', stack: [], selectedMessageId: 'm1' } } }),
            { type: 'SIMULATOR_ACTION', action: { type: 'click_link', href: 'https://example.test' } }
        );
        expect(linkWithFallbackPage.view.activeApp).toBe('internet');
        expect(linkWithFallbackPage.view.internet.screen).toBe('landing');

        const linkWithinInternet = simulatorSessionReducer(
            createState({ view: { activeApp: 'internet', internet: { screen: 'landing', stack: [] } } }),
            { type: 'SIMULATOR_ACTION', action: { type: 'click_link', pageId: 'pricing' } }
        );
        expect(linkWithinInternet.view.internet).toEqual({ screen: 'pricing', stack: ['landing'] });

        const checkContacts = simulatorSessionReducer(
            createState(),
            { type: 'SIMULATOR_ACTION', action: { type: 'check_contacts' } }
        );
        expect(checkContacts.view.contactsPanelOpen).toBe(true);

        const checkSingleContact = simulatorSessionReducer(
            createState(),
            { type: 'SIMULATOR_ACTION', action: { type: 'check_contact', contactId: 'c1' } as never }
        );
        expect(checkSingleContact.view.contactsPanelOpen).toBe(true);

        const answered = simulatorSessionReducer(
            createState(),
            { type: 'SIMULATOR_ACTION', action: { type: 'answer_call', choiceIndex: 2 } }
        );
        expect(answered.view.phone.chosenIndex).toBe(2);

        const unanswered = simulatorSessionReducer(
            createState(),
            { type: 'SIMULATOR_ACTION', action: { type: 'answer_call', choiceIndex: undefined } }
        );
        expect(unanswered.view.phone.chosenIndex).toBeNull();

        const defaultAction = simulatorSessionReducer(
            createState(),
            { type: 'SIMULATOR_ACTION', action: { type: 'report' } }
        );
        expect(defaultAction.view.actionHistory).toHaveLength(1);
        expect(defaultAction.view.activeApp).toBe('email');

        const unknownReducerAction = simulatorSessionReducer(
            createState(),
            { type: 'UNKNOWN' } as never
        );
        expect(unknownReducerAction.view).toEqual(createState().view);
    });
});
