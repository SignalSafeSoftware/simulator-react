import { afterEach, describe, expect, it, vi } from 'vitest';
import { diffSimulatorPayloads } from '../src/utils/simulatorPayloadDiff';
import { getScreenContextLabel, getScreenMetadata } from '../src/utils/screenMetadata';
import {
    applyDeepLinkToState,
    getDeepLinkContactsSearch,
    parseSimulatorSearchParams,
} from '../src/utils/simulatorDeepLink';
import { lintSimulatorPayload } from '../src/utils/lintSimulatorPayload';
import {
    isSimulatorTransitionLoggingEnabled,
    logSimulatorTransition,
} from '../src/utils/simulatorTransitionLogger';
import {
    actionToInteractionEvent,
    appOpenedEvent,
    screenViewedEvent,
} from '../src/utils/simulatorEventMapper';
import { getInitialSessionState, initialViewState } from '../src/state/simulatorSessionReducer';
import type { SimulatorSessionState, SimulatorTemplatePayload, SimulatorViewState } from '../src/types/session';

const originalNodeEnv = process.env.NODE_ENV;
const originalWindow = (globalThis as { window?: unknown }).window;
const originalLocalStorage = (globalThis as { localStorage?: unknown }).localStorage;

function createPayload(overrides: Record<string, unknown> = {}): SimulatorTemplatePayload {
    return {
        templateId: 1,
        templateKey: 'sim-template',
        name: 'Simulator Template',
        channel: 'email',
        topicTags: [{ key: 'phish', name: 'Phishing' }],
        runId: 2,
        attemptId: 3,
        entryPoint: { app: 'email', screen: 'list' },
        device: {
            mainMenuItems: [
                { id: 'email', label: 'Email' },
                { id: 'messages', label: 'Messages' },
                { id: 'internet', label: 'Internet' },
                { id: 'phone', label: 'Phone' },
                { id: 'home', label: 'Home' },
            ],
            secondaryDefaults: {},
        },
        email: {
            inbox: [{ id: 'm1', subject: 'Alert', from: 'alerts@example.test', unread: true }],
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
                messages: [{ from: 'them', text: 'Message one' }],
                sender_display_name: 'Security Team',
                sender_number: '+15550000001',
            },
            visibleMessageCount: 0,
        },
        browser: {
            defaultPageId: 'landing',
            pages: [
                { id: 'landing', url: 'https://example.test', title: 'Landing', layout: 'landing' },
                { id: 'pricing', url: 'https://example.test/pricing', title: 'Pricing', layout: 'content' },
            ],
        },
        phone: {
            content: {
                transcript: 'Incoming call',
                choices: [{ label: 'Answer', correct: true }],
                phone_number: '+15550000002',
                caller_name: 'Caller',
            },
            chosenIndex: null,
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
            email: { screen: 'list', stack: [], selectedMessageId: 'm1' },
            messages: { screen: 'threads', stack: [], visibleCount: 0 },
            internet: { screen: 'landing', stack: [] },
            home: { screen: 'home' },
            contactsPanelOpen: false,
            contactsSearchQuery: '',
            actionHistory: [],
            ...((overrides.view as Record<string, unknown> | undefined) ?? {}),
        },
    } as never;
}

afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalWindow === undefined) {
        delete (globalThis as { window?: unknown }).window;
    } else {
        (globalThis as { window?: unknown }).window = originalWindow;
    }
    if (originalLocalStorage === undefined) {
        delete (globalThis as { localStorage?: unknown }).localStorage;
    } else {
        (globalThis as { localStorage?: unknown }).localStorage = originalLocalStorage;
    }
    vi.restoreAllMocks();
});

describe('utility tail coverage', () => {
    it('covers structured payload diffs across all major sections', () => {
        const circular: Record<string, unknown> = {};
        circular.self = circular;

        const diffs = diffSimulatorPayloads(
            {
                entry_point: { app: 'email', screen: 'list' },
                device: {
                    main_menu_items: [{ id: 'email' }],
                    secondary_defaults: { phone: circular, email: true, internet: null },
                },
                contacts: [{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }, { id: 'c4' }, { id: 'c5' }, { id: 'c6' }],
                directory: [{ id: 'd1' }],
                phone: {
                    incoming_call: { transcript: 'Incoming' },
                    history: [{ id: 'call-1' }, { id: 'call-2' }],
                },
                email: {
                    messages: [{ id: 'm1' }],
                    detail: { subject: 'Old subject' },
                },
                messages: {
                    threads: [{ id: 't1' }],
                    thread_detail: { messages: [{ id: 'msg-1' }, { id: 'msg-2' }] },
                },
                internet: {
                    pages: [{ id: 'landing' }],
                    forms: [{ id: 'form-1' }],
                },
                home: {
                    widgets: [{ id: 'w1' }],
                    store: { featured_apps: [{ id: 'app-1' }] },
                    settings: { sections: [{ id: 's1' }] },
                },
            },
            {
                entry_point: { app: 'phone', screen: 'history' },
                device: {
                    main_menu_items: [{ id: 'email' }, { id: 'phone' }],
                    secondary_defaults: { phone: 'history', email: false, internet: 2 },
                },
                contacts: [{ id: 'c1' }, { id: 'c2' }, { id: 'c7' }, { id: 'c8' }, { id: 'c9' }, { id: 'c10' }, { id: 'c11' }],
                directory: [{ id: 'd2' }, { id: 'd3' }],
                phone: {
                    history: [{ id: 'call-1' }],
                },
                email: {
                    messages: [{ id: 'm2' }, { id: 'm3' }],
                    detail: { subject: 'New subject' },
                },
                messages: {
                    threads: [{ id: 't1' }, { id: 't2' }],
                    thread_detail: { messages: [{ id: 'msg-1' }] },
                },
                internet: {
                    pages: [{ id: 'pricing' }, { id: 'support' }],
                    forms: [{ id: 'form-1' }, { id: 'form-2' }],
                },
                home: {
                    widgets: [],
                    store: { featured_apps: [] },
                    settings: { sections: [] },
                },
            }
        );

        expect(diffs.map((item) => item.section)).toEqual(
            expect.arrayContaining([
                'entry_point',
                'device',
                'contacts',
                'directory',
                'phone',
                'email',
                'messages',
                'internet',
                'home',
            ])
        );
        expect(diffs).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ change: 'Entry point: email/list → phone/history' }),
                expect.objectContaining({ section: 'device', change: 'Device menu: 1 → 2 items' }),
                expect.objectContaining({ section: 'device', detail: expect.stringContaining('(unserializable)') }),
                expect.objectContaining({ section: 'contacts', detail: expect.stringContaining('+') }),
                expect.objectContaining({ section: 'directory', change: 'Directory: 1 → 2 entries' }),
                expect.objectContaining({ section: 'phone', change: 'Phone: incoming_call removed' }),
                expect.objectContaining({ section: 'phone', change: 'Phone history: 2 → 1 entries' }),
                expect.objectContaining({ section: 'email', change: 'Email detail (subject) changed' }),
                expect.objectContaining({ section: 'messages', change: 'Messages threads: 1 → 2' }),
                expect.objectContaining({ section: 'messages', change: 'Messages thread_detail: 2 → 1 messages' }),
                expect.objectContaining({ section: 'internet', change: 'Browser pages: landing → pricing, support' }),
                expect.objectContaining({ section: 'internet', change: 'Browser forms: 1 → 2' }),
                expect.objectContaining({ section: 'home', change: 'Home: widgets 1→0, store apps 1→0, settings sections 1→0' }),
            ])
        );
    });

    it('covers screen metadata for all app variants and fallback labels', () => {
        const payload = createPayload();

        const emailMeta = getScreenMetadata(
            createState({ view: { activeApp: 'email', email: { screen: 'detail', stack: ['list'], selectedMessageId: 'm1' } } }).view,
            payload
        );
        expect(emailMeta).toEqual(
            expect.objectContaining({
                app: 'email',
                parentScreen: 'list',
                showBack: true,
                showCancel: false,
                label: 'Email → Message',
                source: 'detail',
            })
        );

        const messagesMeta = getScreenMetadata(
            createState({ view: { activeApp: 'messages', messages: { screen: 'new_thread', stack: [], visibleCount: 0 } } }).view,
            payload
        );
        expect(messagesMeta.label).toBe('Messages → New Thread');
        expect(messagesMeta.source).toBe('new_thread');

        const messageDetailMeta = getScreenMetadata(
            createState({ view: { activeApp: 'messages', messages: { screen: 'thread_detail', stack: ['threads'], visibleCount: 1 } } }).view,
            payload
        );
        expect(messageDetailMeta.label).toBe('Messages → Thread');
        expect(messageDetailMeta.source).toBe('detail');
        expect(messageDetailMeta.showBack).toBe(true);

        const messageListMeta = getScreenMetadata(
            createState({ view: { activeApp: 'messages', messages: { screen: 'threads', stack: [], visibleCount: 0 } } }).view,
            payload
        );
        expect(messageListMeta.label).toBe('Messages → Threads');
        expect(messageListMeta.source).toBe('list');
        expect(messageListMeta.showCancel).toBe(true);

        const internetMeta = getScreenMetadata(
            createState({ view: { activeApp: 'internet', internet: { screen: 'pricing', stack: ['landing'] } } }).view,
            payload
        );
        expect(internetMeta.pageTitle).toBe('Pricing');
        expect(getScreenContextLabel(internetMeta)).toBe('Internet → Pricing');

        const internetFallbackMeta = getScreenMetadata(
            createState({ view: { activeApp: 'internet', internet: { screen: 'missing', stack: [] } } }).view,
            payload
        );
        expect(internetFallbackMeta.pageTitle).toBeNull();
        expect(internetFallbackMeta.label).toBe('Internet → missing');
        expect(internetFallbackMeta.showCancel).toBe(true);

        const phoneMeta = getScreenMetadata(
            createState({ view: { activeApp: 'phone', phone: { screen: 'directory', stack: [], chosenIndex: null } } }).view,
            payload
        );
        expect(phoneMeta.label).toBe('Phone → Directory');

        const unknownPhoneMeta = getScreenMetadata(
            createState({ view: { activeApp: 'phone', phone: { screen: 'custom' as never, stack: [], chosenIndex: null } } }).view,
            payload
        );
        expect(unknownPhoneMeta.label).toBe('Phone → custom');
        expect(unknownPhoneMeta.showCancel).toBe(true);

        const homeMeta = getScreenMetadata(
            createState({ view: { activeApp: 'home', home: { screen: 'settings' } } }).view,
            payload
        );
        expect(homeMeta).toEqual(expect.objectContaining({ parentScreen: 'home', showBack: true, showCancel: false }));

        const homeRootMeta = getScreenMetadata(
            createState({ view: { activeApp: 'home', home: { screen: 'home' } } }).view,
            payload
        );
        expect(homeRootMeta.label).toBe('Home → Home');
        expect(homeRootMeta.showCancel).toBe(true);

        const fallbackView = {
            ...createState().view,
            activeApp: 'bogus' as never,
        } as SimulatorViewState;
        const fallbackMeta = getScreenMetadata(fallbackView, {
            ...payload,
            browser: null as never,
        });
        expect(fallbackMeta.label).toBe('bogus / ');
        expect(fallbackMeta.showCancel).toBe(true);
    });

    it('covers deep-link parsing and app-specific application behavior', () => {
        expect(parseSimulatorSearchParams(new URLSearchParams())).toBeNull();
        expect(parseSimulatorSearchParams(new URLSearchParams('app=bogus'))).toBeNull();
        expect(parseSimulatorSearchParams(new URLSearchParams('app=email&screen=not-real'))).toBeNull();
        expect(parseSimulatorSearchParams(new URLSearchParams('app=internet&pageId=pricing'))).toEqual({
            app: 'internet',
            screen: undefined,
            messageId: undefined,
            pageId: 'pricing',
            search: undefined,
        });

        const state = getInitialSessionState(createPayload({
            channel: 'browser',
            entryPoint: { app: 'internet', screen: 'landing' },
        }));

        const emailNext = applyDeepLinkToState(state, { app: 'email', messageId: 'missing' });
        expect(emailNext.view.activeApp).toBe('email');
        expect(emailNext.view.email.screen).toBe('detail');
        expect(emailNext.view.email.selectedMessageId).toBeNull();

        const messagesNext = applyDeepLinkToState(state, { app: 'messages', screen: 'thread_detail' });
        expect(messagesNext.view.messages.screen).toBe('thread_detail');
        expect(messagesNext.view.messages.visibleCount).toBe(1);

        const internetNext = applyDeepLinkToState(state, { app: 'internet', pageId: 'missing' });
        expect(internetNext.view.internet.screen).toBe('landing');

        const phoneNext = applyDeepLinkToState(state, { app: 'phone', screen: 'contacts', search: 'Ada' });
        expect(phoneNext.view.phone.screen).toBe('contacts');
        expect(phoneNext.view.phone.stack).toEqual(['history']);

        const phoneUnchanged = applyDeepLinkToState(phoneNext, { app: 'phone', screen: 'contacts' });
        expect(phoneUnchanged.view.phone.stack).toEqual(['history']);

        const homeNext = applyDeepLinkToState(state, { app: 'home', screen: 'settings' });
        expect(homeNext.view.home.screen).toBe('settings');

        expect(getDeepLinkContactsSearch({ app: 'phone', screen: 'contacts', search: 'Ada' })).toBe('Ada');
        expect(getDeepLinkContactsSearch({ app: 'phone', screen: 'contacts', search: '' })).toBeUndefined();
        expect(getDeepLinkContactsSearch({ app: 'email', screen: 'list', search: 'Ada' })).toBeUndefined();
    });

    it('covers advisory lint branches for entry content, verification, and naming', () => {
        const warnings = lintSimulatorPayload(
            createPayload({
                templateKey: 'Bad_Template',
                entryPoint: { app: 'home', screen: 'home' },
                home: { widgets: [], featuredApps: [], settingsSections: [] },
                contacts: [],
                phone: {
                    content: { transcript: 'Incoming', choices: [{ label: 'Answer', correct: true }] },
                    chosenIndex: null,
                },
                directory: [],
                email: {
                    inbox: [{ id: 'Bad Message', subject: 'Alert', from: 'alerts@example.test' }],
                    selectedMessage: null,
                    selectedMessageId: null,
                },
                browser: {
                    defaultPageId: 'landing',
                    pages: [
                        { id: 'Bad Page', url: '', title: '', content: '', layout: 'content', buttons: [] },
                    ],
                },
            })
        ).warnings;

        expect(warnings.map((warning) => warning.code)).toEqual(
            expect.arrayContaining([
                'entry_app_empty',
                'key_naming',
                'browser_page_bare',
            ])
        );

        const emailWarnings = lintSimulatorPayload(
            createPayload({
                entryPoint: { app: 'email', screen: 'detail' },
                email: { inbox: [], selectedMessage: null, selectedMessageId: null },
            })
        ).warnings;
        expect(emailWarnings.map((warning) => warning.code)).toContain('entry_app_empty');

        const messagesWarnings = lintSimulatorPayload(
            createPayload({
                entryPoint: { app: 'messages', screen: 'thread_detail' },
                sms: { thread: { messages: [] }, visibleMessageCount: 0 },
            })
        ).warnings;
        expect(messagesWarnings.map((warning) => warning.code)).toContain('entry_app_empty');

        const phoneWarnings = lintSimulatorPayload(
            createPayload({
                entryPoint: { app: 'phone', screen: 'contacts' },
                contacts: [],
                phone: {
                    content: { transcript: 'Incoming', choices: [{ label: 'Answer', correct: true }] },
                    chosenIndex: null,
                },
            })
        ).warnings;
        expect(phoneWarnings.map((warning) => warning.code)).toContain('phone_verification_without_contacts');

        const phoneEntryWarnings = lintSimulatorPayload(
            createPayload({
                entryPoint: { app: 'phone', screen: 'dial' },
                phone: null,
            })
        ).warnings;
        expect(phoneEntryWarnings.map((warning) => warning.code)).toContain('entry_app_empty');
    });

    it('covers generic lint empty-state branches and null entry-point fallback', () => {
        const nullEntryWarnings = lintSimulatorPayload(
            createPayload({
                entryPoint: null,
                browser: null,
                email: null,
                sms: null,
                phone: null,
                home: null,
                contacts: [],
                directory: [],
            })
        ).warnings;
        expect(nullEntryWarnings).toEqual([]);

        const emailListWarnings = lintSimulatorPayload(
            createPayload({
                entryPoint: { app: 'email', screen: 'list' },
                email: { inbox: [], outbox: [], trash: [], selectedMessage: null, selectedMessageId: null },
            })
        ).warnings;
        expect(emailListWarnings).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'entry_app_empty',
                    message: 'Entry point is email but inbox and selected message are empty.',
                }),
            ])
        );

        const messagesListWarnings = lintSimulatorPayload(
            createPayload({
                entryPoint: { app: 'messages', screen: 'threads' },
                sms: { thread: { messages: [] }, visibleMessageCount: 0 },
            })
        ).warnings;
        expect(messagesListWarnings).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'entry_app_empty',
                    message: 'Entry point is messages but the SMS thread is empty.',
                }),
            ])
        );

        const internetWarnings = lintSimulatorPayload(
            createPayload({
                entryPoint: { app: 'internet', screen: 'landing' },
                browser: { defaultPageId: 'landing', pages: [] },
            })
        ).warnings;
        expect(internetWarnings).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'entry_app_empty',
                    message: 'Entry point is internet but there are no browser pages.',
                }),
            ])
        );
    });

    it('covers remaining lint warnings for unreachable internet targets, sender identity, and directory naming', () => {
        const warnings = lintSimulatorPayload(
            createPayload({
                templateKey: 'clean-template',
                entryPoint: { app: 'internet', screen: 'missing-page' },
                sms: {
                    thread: { messages: [{ from: 'them', text: 'Hello' }], sender_display_name: '', sender_number: '' },
                    visibleMessageCount: 1,
                },
                browser: {
                    defaultPageId: 'landing',
                    pages: [
                        null as never,
                        {
                            id: 'landing',
                            url: 'https://example.test',
                            title: 'Landing',
                            layout: 'content',
                            buttons: [{ label: 'Broken', targetPageId: 'missing-target' }],
                        },
                    ],
                },
                directory: [{ id: 'Bad Directory', label: 'Directory', number: '+1555' }],
            })
        ).warnings;

        expect(warnings).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ code: 'entry_point_unreachable' }),
                expect.objectContaining({ code: 'unreachable_action_target' }),
                expect.objectContaining({ code: 'messages_no_sender_identity' }),
                expect.objectContaining({
                    code: 'key_naming',
                    path: 'directory[0].id',
                }),
            ])
        );
    });

    it('keeps lint quiet for populated entry states and supported browser targets', () => {
        const warnings = lintSimulatorPayload(
            createPayload({
                templateKey: 'clean-template',
                entryPoint: { app: 'internet', screen: 'landing' },
                home: { widgets: [{ id: 'widget-1', label: 'News' }], featuredApps: [], settingsSections: [] },
                phone: {
                    content: { transcript: 'Incoming', choices: [{ label: 'Answer', correct: true }] },
                    chosenIndex: null,
                },
                contacts: [{ id: 'contact-1', displayName: 'Ada Lovelace' }],
                directory: [{ id: 'helpdesk', label: 'Help Desk', number: '+1555' }],
                email: {
                    inbox: [{ id: 'message-1', subject: 'Alert', from: 'alerts@example.test' }],
                    selectedMessage: { subject: 'Alert', from: 'alerts@example.test', body: 'Body' },
                    selectedMessageId: 'message-1',
                },
                sms: {
                    thread: {
                        messages: [{ from: 'them', text: 'Hello' }],
                        sender_display_name: 'Security Team',
                        sender_number: '+15550000001',
                    },
                    visibleMessageCount: 1,
                },
                browser: {
                    defaultPageId: 'landing',
                    pages: [
                        {
                            id: 'landing',
                            url: 'https://example.test',
                            title: 'Landing',
                            content: 'Body',
                            layout: 'content',
                            buttons: [{ label: 'Next', targetPageId: 'landing' }],
                        },
                    ],
                },
            })
        ).warnings;

        expect(warnings.map((warning) => warning.code)).not.toEqual(
            expect.arrayContaining([
                'entry_app_empty',
                'entry_point_unreachable',
                'unreachable_action_target',
                'browser_page_bare',
                'messages_no_sender_identity',
                'phone_verification_without_contacts',
            ])
        );
    });

    it('covers transition logging enablement and formatted change output', () => {
        process.env.NODE_ENV = 'production';
        (globalThis as { window?: unknown }).window = { __SIMULATOR_LOG_TRANSITIONS__: true };
        expect(isSimulatorTransitionLoggingEnabled()).toBe(false);

        process.env.NODE_ENV = 'development';
        (globalThis as { window?: unknown }).window = {};
        (globalThis as { localStorage?: unknown }).localStorage = {
            getItem: () => '1',
        };
        expect(isSimulatorTransitionLoggingEnabled()).toBe(true);

        (globalThis as { localStorage?: unknown }).localStorage = {
            getItem: () => {
                throw new Error('blocked');
            },
        };
        expect(isSimulatorTransitionLoggingEnabled()).toBe(false);

        (globalThis as { window?: unknown }).window = { __SIMULATOR_LOG_TRANSITIONS__: true };
        (globalThis as { localStorage?: unknown }).localStorage = {
            getItem: () => null,
        };
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const prev = createState({
            view: {
                activeApp: 'email',
                email: { screen: 'list', stack: [], selectedMessageId: null },
                messages: { screen: 'threads', stack: [], visibleCount: 0 },
                internet: { screen: 'landing', stack: [] },
                phone: { screen: 'history', stack: [], chosenIndex: null },
                home: { screen: 'home' },
                contactsPanelOpen: false,
            },
        });
        const next = createState({
            view: {
                activeApp: 'phone',
                email: { screen: 'detail', stack: ['list'], selectedMessageId: 'm1' },
                messages: { screen: 'thread_detail', stack: ['threads'], visibleCount: 2 },
                internet: { screen: 'pricing', stack: ['landing'] },
                phone: { screen: 'directory', stack: ['history'], chosenIndex: 1 },
                home: { screen: 'settings' },
                contactsPanelOpen: true,
            },
        });

        logSimulatorTransition(prev, { type: 'SIMULATOR_ACTION', action: { type: 'navigate_screen', app: 'internet', screen: 'pricing' } }, next);
        logSimulatorTransition(prev, { type: 'NAV_LOCAL', app: 'phone', screen: 'contacts' }, next);
        logSimulatorTransition(prev, { type: 'BROWSER_SCREEN', screen: 'pricing' }, next);
        logSimulatorTransition(prev, { type: 'SELECT_EMAIL', messageId: 'm1' }, next);
        logSimulatorTransition(prev, { type: 'SWITCH_APP', app: 'phone' }, next);
        logSimulatorTransition(prev, { type: 'PHONE_CHOOSE', index: 1 }, next);
        logSimulatorTransition(prev, { type: 'SIMULATOR_ACTION', action: { type: 'open_email', messageId: 'm1' } }, next);
        logSimulatorTransition(prev, { type: 'SIMULATOR_ACTION', action: { type: 'open_thread', threadId: 't1' } }, next);
        logSimulatorTransition(prev, { type: 'SIMULATOR_ACTION', action: { type: 'open_page', pageId: 'pricing' } }, next);
        logSimulatorTransition(prev, { type: 'BACK' }, prev);

        const logged = consoleSpy.mock.calls.map(([line]) => String(line)).join('\n');
        expect(logged).toContain('SIMULATOR_ACTION(navigate_screen internet/pricing)');
        expect(logged).toContain('NAV_LOCAL(phone/contacts)');
        expect(logged).toContain('BROWSER_SCREEN(pricing)');
        expect(logged).toContain('SELECT_EMAIL(m1)');
        expect(logged).toContain('SWITCH_APP(phone)');
        expect(logged).toContain('PHONE_CHOOSE(1)');
        expect(logged).toContain('SIMULATOR_ACTION(open_email m1)');
        expect(logged).toContain('SIMULATOR_ACTION(open_thread t1)');
        expect(logged).toContain('SIMULATOR_ACTION(open_page pricing)');
        expect(logged).toContain('contactsPanel=true');
        expect(logged).toContain('visibleCount=2');
        expect(logged).toContain('chosenIndex=1');
        expect(logged).toContain('[Phone → Directory]');
    });

    it('covers transition logger fallback action formatting and no-op transitions', () => {
        process.env.NODE_ENV = 'development';
        (globalThis as { window?: unknown }).window = { __SIMULATOR_LOG_TRANSITIONS__: true };
        (globalThis as { localStorage?: unknown }).localStorage = {
            getItem: () => null,
        };

        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const prev = createState({
            view: {
                activeApp: 'bogus' as never,
                email: { screen: 'list', stack: [], selectedMessageId: null },
                messages: { screen: 'threads', stack: [], visibleCount: 0 },
                internet: { screen: 'landing', stack: [] },
                phone: { screen: 'history', stack: [], chosenIndex: null },
                home: { screen: 'home' },
                contactsPanelOpen: false,
            },
        });
        const emailNext = createState({
            view: {
                activeApp: 'email',
                email: { screen: 'detail', stack: ['list'], selectedMessageId: 'm1' },
                messages: { screen: 'thread_detail', stack: ['threads'], visibleCount: 3 },
                internet: { screen: 'landing', stack: [] },
                phone: { screen: 'history', stack: [], chosenIndex: null },
                home: { screen: 'settings' },
                contactsPanelOpen: true,
            },
        });

        logSimulatorTransition(prev, { type: 'SIMULATOR_ACTION', action: { type: 'report' } }, emailNext);
        logSimulatorTransition(emailNext, { type: 'SELECT_EMAIL', messageId: null }, emailNext);
        logSimulatorTransition(emailNext, { type: 'UNKNOWN_ACTION' }, emailNext as never);

        const logged = consoleSpy.mock.calls.map(([line]) => String(line)).join('\n');
        expect(logged).toContain('SIMULATOR_ACTION(report)');
        expect(logged).toContain('SELECT_EMAIL(null)');
        expect(logged).toContain('bogus/?');
        expect(logged).toContain('app bogus→email');
        expect(logged).toContain('email list→detail');
        expect(logged).toContain('msg=m1');
        expect(logged).toContain('contactsPanel=true');
        expect(logged).toContain('visibleCount=3');
        expect(logged).toContain('UNKNOWN_ACTION');
        expect(logged).toContain('[Email → Message]');
    });

    it('covers remaining transition logger branches for disabled flags and messages/home transitions', () => {
        process.env.NODE_ENV = 'development';
        delete (globalThis as { window?: unknown }).window;
        expect(isSimulatorTransitionLoggingEnabled()).toBe(false);

        (globalThis as { window?: unknown }).window = {};
        (globalThis as { localStorage?: unknown }).localStorage = {
            getItem: () => null,
        };
        expect(isSimulatorTransitionLoggingEnabled()).toBe(false);

        (globalThis as { window?: unknown }).window = { __SIMULATOR_LOG_TRANSITIONS__: true };
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        const messagesPrev = createState({
            view: {
                activeApp: 'messages',
                messages: { screen: 'threads', stack: [], visibleCount: 0 },
                home: { screen: 'home' },
            },
        });
        const messagesNext = createState({
            view: {
                activeApp: 'messages',
                messages: { screen: 'thread_detail', stack: ['threads'], visibleCount: 4 },
                home: { screen: 'home' },
            },
        });
        const homeNext = createState({
            view: {
                activeApp: 'home',
                messages: { screen: 'thread_detail', stack: ['threads'], visibleCount: 4 },
                home: { screen: 'settings' },
            },
        });

        logSimulatorTransition(messagesPrev, { type: 'SIMULATOR_ACTION', action: { type: 'open_thread', threadId: 't2' } }, messagesNext);
        logSimulatorTransition(messagesNext, { type: 'SWITCH_APP', app: 'home' }, homeNext);

        const logged = consoleSpy.mock.calls.map(([line]) => String(line)).join('\n');
        expect(logged).toContain('messages/threads → messages/thread_detail');
        expect(logged).toContain('messages threads→thread_detail');
        expect(logged).toContain('visibleCount=4');
        expect(logged).toContain('home/settings');
        expect(logged).toContain('app messages→home');
        expect(logged).toContain('home home→settings');
    });

    it('covers logger no-op when console.log is unavailable', () => {
        process.env.NODE_ENV = 'development';
        (globalThis as { window?: unknown }).window = { __SIMULATOR_LOG_TRANSITIONS__: true };

        const originalLog = console.log;
        Object.defineProperty(console, 'log', {
            configurable: true,
            value: undefined,
        });

        try {
            const state = createState();
            expect(() =>
                logSimulatorTransition(state, { type: 'SWITCH_APP', app: 'email' }, state)
            ).not.toThrow();
        } finally {
            Object.defineProperty(console, 'log', {
                configurable: true,
                value: originalLog,
            });
        }
    });

    it('covers event mapping for emitted and skipped simulator actions', () => {
        const view = createState({
            view: {
                activeApp: 'phone',
                phone: { screen: 'history', stack: [], chosenIndex: null },
                email: { screen: 'detail', stack: ['list'], selectedMessageId: 'm1' },
                messages: { screen: 'thread_detail', stack: ['threads'], visibleCount: 1 },
                internet: { screen: 'pricing', stack: ['landing'] },
                home: { screen: 'settings' },
            },
        }).view;
        const payload = createPayload();

        expect(actionToInteractionEvent({ type: 'open_contact', contactId: 'c1' }, view, payload)?.kind).toBe('contact_opened');
        expect(actionToInteractionEvent({ type: 'click_link', href: 'https://example.test' }, view, payload)?.kind).toBe('link_clicked');
        expect(actionToInteractionEvent({ type: 'open_attachment', attachmentIndex: 1 }, view, payload)?.kind).toBe('attachment_opened');
        expect(actionToInteractionEvent({ type: 'download_attachment', attachmentIndex: 2 }, view, payload)?.kind).toBe('attachment_downloaded');
        expect(actionToInteractionEvent({ type: 'answer_call', choiceIndex: 0 }, view, payload)?.kind).toBe('call_answered');
        expect(actionToInteractionEvent({ type: 'ignore_call' }, view, payload)?.kind).toBe('call_ignored');
        expect(actionToInteractionEvent({ type: 'dial_phone', dialedNumber: '+1555' }, view, payload)?.kind).toBe('dial_started');
        expect(actionToInteractionEvent({ type: 'submit_form', submitMetadata: { ok: true } }, view, payload)?.kind).toBe('form_submitted');
        expect(actionToInteractionEvent({ type: 'send_reply', replyText: 'Reply' }, view, payload)?.kind).toBe('message_sent');
        expect(actionToInteractionEvent({ type: 'open_page', pageId: 'pricing' }, view, payload)?.screen).toBe('pricing');
        expect(actionToInteractionEvent({ type: 'open_voicemail' }, view, payload)?.kind).toBe('voicemail_opened');
        expect(actionToInteractionEvent({ type: 'open_store' }, view, payload)?.kind).toBe('store_opened');
        expect(actionToInteractionEvent({ type: 'open_settings' }, view, payload)?.kind).toBe('settings_opened');
        expect(actionToInteractionEvent({ type: 'report' }, view, payload)?.kind).toBe('report_clicked');
        expect(actionToInteractionEvent({ type: 'download_click', downloadTarget: '/file.exe' }, view, payload)?.kind).toBe('download_clicked');
        expect(actionToInteractionEvent({ type: 'check_contact' }, view, payload)?.kind).toBe('check_contact_clicked');
        expect(actionToInteractionEvent({ type: 'check_contacts' }, view, payload)?.kind).toBe('check_contact_clicked');
        expect(actionToInteractionEvent({ type: 'view_directory_entry', entryId: 'd1' }, view, payload)?.kind).toBe('directory_entry_viewed');
        expect(actionToInteractionEvent({ type: 'search_contacts', query: 'Ada' }, view, payload)?.kind).toBe('search_performed');
        expect(actionToInteractionEvent({ type: 'navigate_screen', app: 'email', screen: 'list' }, view, payload)).toBeNull();
        expect(actionToInteractionEvent({ type: 'open_app', app: 'email' }, view, payload)).toBeNull();
        expect(actionToInteractionEvent({ type: 'switch_channel', channel: 'email' }, view, payload)).toBeNull();
        expect(appOpenedEvent('messages', view, payload)).toEqual(expect.objectContaining({ kind: 'app_opened', app: 'messages', screen: 'thread_detail' }));
        expect(screenViewedEvent('internet', 'pricing', view, payload)).toEqual(expect.objectContaining({ kind: 'screen_viewed', app: 'internet', screen: 'pricing' }));
        expect(actionToInteractionEvent({ type: 'open_email', messageId: 'm1' }, view, null)?.template_id).toBeUndefined();
    });
});
