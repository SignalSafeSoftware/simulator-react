import { afterEach, describe, expect, it, vi } from 'vitest';
import { mapDirectory } from '../src/adapters/fullDeviceToSession';
import { getInitialSessionState } from '../src/state/simulatorSessionReducer';
import type { SimulatorSessionState, SimulatorTemplatePayload } from '../src/types/session';
import { lintSimulatorPayload } from '../src/utils/lintSimulatorPayload';
import { isSlugLike, keyNamingSuggestion } from '../src/utils/simulatorKeyPatterns';
import { getSimulatorCapabilities } from '../src/utils/simulatorCapabilities';
import { handleSimulatorKeyboard } from '../src/utils/simulatorKeyboardCommands';
import { buildSimulatorPreviewReport } from '../src/utils/simulatorPreviewReport';
import { captureSimulatorSnapshot, snapshotToJson } from '../src/utils/simulatorSnapshot';
import { logSimulatorTransition } from '../src/utils/simulatorTransitionLogger';

const originalNodeEnv = process.env.NODE_ENV;
const originalWindow = (globalThis as { window?: unknown }).window;
const originalHTMLElement = (globalThis as { HTMLElement?: unknown }).HTMLElement;

function createPayload(): SimulatorTemplatePayload {
    return {
        templateId: 1,
        templateKey: 'sim_template',
        name: 'Simulator Template',
        channel: 'browser',
        topicTags: [],
        runId: 7,
        attemptId: 3,
        entryPoint: { app: 'internet', screen: 'landing' },
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
            inbox: [],
            selectedMessage: null,
            selectedMessageId: null,
        },
        sms: {
            thread: {
                messages: [],
            },
            visibleMessageCount: 0,
        },
        browser: {
            defaultPageId: 'landing',
            pages: [
                {
                    id: 'landing',
                    url: 'https://example.test',
                    title: 'Landing',
                    layout: 'content',
                    buttons: [],
                },
            ],
        },
        phone: {
            content: {
                transcript: 'Incoming call.',
                choices: [],
            },
            chosenIndex: null,
        },
        contacts: [],
        directory: [],
        home: {
            widgets: [],
            featuredApps: [],
            settingsSections: [],
        },
    };
}

function createState(payload: SimulatorTemplatePayload = createPayload()): SimulatorSessionState {
    return getInitialSessionState(payload);
}

function createKeyboardEvent(
    overrides: Partial<KeyboardEvent> & { key: string }
): KeyboardEvent & { preventDefault: ReturnType<typeof vi.fn> } {
    return {
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        target: null,
        preventDefault: vi.fn(),
        ...overrides,
    } as KeyboardEvent & { preventDefault: ReturnType<typeof vi.fn> };
}

afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalWindow === undefined) {
        delete (globalThis as { window?: unknown }).window;
    } else {
        (globalThis as { window?: unknown }).window = originalWindow;
    }
    if (originalHTMLElement === undefined) {
        delete (globalThis as { HTMLElement?: unknown }).HTMLElement;
    } else {
        (globalThis as { HTMLElement?: unknown }).HTMLElement = originalHTMLElement;
    }
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('lintSimulatorPayload', () => {
    it('keeps advisory warnings for empty entry content, browser targets, duplicates, and missing sender identity', () => {
        const payload: SimulatorTemplatePayload = {
            ...createPayload(),
            entryPoint: { app: 'internet', screen: 'missing-page' },
            browser: {
                defaultPageId: 'landing',
                pages: [
                    {
                        id: 'landing',
                        url: '',
                        title: '',
                        content: '',
                        layout: 'content',
                        buttons: [{ label: 'Open', targetPageId: 'missing-page' }],
                    },
                    {
                        id: 'landing',
                        url: 'https://second.example.test',
                        title: 'Second',
                        layout: 'content',
                        buttons: [],
                    },
                ],
            },
            sms: {
                thread: {
                    messages: [{ from: 'them', text: 'Verify this request.' }],
                },
                visibleMessageCount: 0,
            },
            contacts: [
                { id: 'contact-1', displayName: 'Ada Lovelace' },
                { id: 'contact-1', displayName: 'Ada Lovelace' },
            ],
            email: {
                inbox: [
                    { id: 'message-1', subject: 'Subject', from: 'sender@example.test' },
                    { id: 'message-1', subject: 'Subject', from: 'sender@example.test' },
                ],
                selectedMessage: null,
                selectedMessageId: null,
            },
        };

        const warnings = lintSimulatorPayload(payload).warnings;
        const warningCodes = warnings.map((warning) => warning.code);

        expect(warningCodes).toEqual(
            expect.arrayContaining([
                'entry_point_unreachable',
                'unreachable_action_target',
                'browser_page_bare',
                'messages_no_sender_identity',
                'duplicate_keys',
            ])
        );
        expect(warnings).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ code: 'duplicate_keys', path: 'contacts' }),
                expect.objectContaining({ code: 'duplicate_keys', path: 'email.inbox' }),
                expect.objectContaining({ code: 'browser_page_bare', path: 'browser.pages[0]' }),
            ])
        );
    });
});

describe('captureSimulatorSnapshot', () => {
    it('serializes action history with the configured max length', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-26T12:00:00Z'));

        const payload = createPayload();
        const state: SimulatorSessionState = {
            ...createState(payload),
            view: {
                ...createState(payload).view,
                actionHistory: [
                    { type: 'open_page', pageId: 'landing' },
                    { type: 'search_contacts', query: 'Ada' },
                    { type: 'click_link', linkIndex: 2, pageId: 'pricing' },
                ],
            },
        };

        const snapshot = captureSimulatorSnapshot(state, { maxActions: 2 });

        expect(snapshot.capturedAt).toBe('2026-03-26T12:00:00.000Z');
        expect(snapshot.actionHistory).toEqual([
            { type: 'search_contacts', query: 'Ada' },
            { type: 'click_link', pageId: 'pricing', linkIndex: 2 },
        ]);
        expect(snapshot.payloadSummary.pageIds).toEqual(['landing']);
    });

    it('does not stringify object-valued action text fields as [object Object]', () => {
        const payload = createPayload();
        const state: SimulatorSessionState = {
            ...createState(payload),
            view: {
                ...createState(payload).view,
                actionHistory: [
                    { type: 'search_contacts', query: { nested: 'value' } as never },
                ],
            },
        };

        const snapshot = captureSimulatorSnapshot(state);

        expect(snapshot.actionHistory).toEqual([{ type: 'search_contacts' }]);
    });

    it('covers compact snapshot serialization and optional action field copying', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-26T12:34:56Z'));

        const payload: SimulatorTemplatePayload = {
            ...createPayload(),
            entryPoint: { app: 'internet', screen: null as never },
            browser: null,
            contacts: null,
        };
        const state: SimulatorSessionState = {
            ...createState(payload),
            view: {
                ...createState(payload).view,
                activeApp: 'phone',
                phone: {
                    screen: 'voicemail',
                    stack: ['history', 'incoming_call'],
                    chosenIndex: 1,
                },
                contactsPanelOpen: true,
                contactsSearchQuery: 'Ada',
                actionHistory: [
                    {
                        type: 'navigate_screen',
                        app: 'phone',
                        screen: 'voicemail',
                    },
                    {
                        type: 'send_reply',
                        replyText: '',
                    },
                    {
                        type: 'dial_phone',
                        dialedNumber: '+15550000001',
                        channel: 'sms',
                    },
                    {
                        type: 'open_attachment',
                        messageId: 'm1',
                        attachmentIndex: 0,
                    },
                    {
                        type: 'answer_call',
                        choiceIndex: 2,
                        threadId: 'thread-1',
                        contactId: 'c1',
                        entryId: 'call-1',
                        pageId: 'landing',
                        downloadTarget: 'invoice.pdf',
                    },
                ],
            },
        };

        const snapshot = captureSimulatorSnapshot(state, { maxActions: 10 });

        expect(snapshot.template.entryPoint).toEqual({ app: 'internet', screen: '' });
        expect(snapshot.view.phone).toEqual({ screen: 'voicemail', stackLength: 2, chosenIndex: 1 });
        expect(snapshot.view.contactsPanelOpen).toBe(true);
        expect(snapshot.view.contactsSearchQuery).toBe('Ada');
        expect(snapshot.payloadSummary.pageIds).toEqual([]);
        expect(snapshot.payloadSummary.contactCount).toBe(0);
        expect(snapshot.actionHistory).toEqual([
            { type: 'navigate_screen', app: 'phone', screen: 'voicemail' },
            { type: 'send_reply', replyText: '' },
            { type: 'dial_phone', dialedNumber: '+15550000001', channel: 'sms' },
            { type: 'open_attachment', messageId: 'm1', attachmentIndex: 0 },
            {
                type: 'answer_call',
                threadId: 'thread-1',
                pageId: 'landing',
                contactId: 'c1',
                entryId: 'call-1',
                choiceIndex: 2,
                downloadTarget: 'invoice.pdf',
            },
        ]);
        expect(snapshotToJson(snapshot, false)).toBe(JSON.stringify(snapshot));
    });

    it('covers nullish payload summaries and default pretty snapshot json', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-26T13:00:00Z'));

        const payload: SimulatorTemplatePayload = {
            ...createPayload(),
            entryPoint: null,
            email: null,
            sms: null,
            browser: null,
            contacts: null,
        };
        const state: SimulatorSessionState = createState(payload);

        const snapshot = captureSimulatorSnapshot(state);

        expect(snapshot.template.entryPoint).toBeNull();
        expect(snapshot.payloadSummary.inboxCount).toBe(0);
        expect(snapshot.payloadSummary.threadMessageCount).toBe(0);
        expect(snapshot.payloadSummary.pageIds).toEqual([]);
        expect(snapshot.payloadSummary.contactCount).toBe(0);
        expect(snapshotToJson(snapshot)).toContain('\n  "capturedAt"');
    });
});

describe('getSimulatorCapabilities', () => {
    it('detects attachments, browser forms, voicemail, and home affordances', () => {
        const payload: SimulatorTemplatePayload = {
            ...createPayload(),
            email: {
                inbox: [
                    {
                        id: 'message-1',
                        subject: 'Invoice',
                        from: 'billing@example.test',
                        attachment_name: 'invoice.pdf',
                    },
                ],
                selectedMessage: null,
                selectedMessageId: null,
            },
            browser: {
                defaultPageId: 'landing',
                pages: [
                    {
                        id: 'landing',
                        url: 'https://example.test',
                        title: 'Landing',
                        layout: 'login',
                        formFields: [{ name: 'email', type: 'email', label: 'Email' }],
                    },
                ],
            },
            phone: {
                content: {
                    transcript: 'Incoming call.',
                    choices: [],
                },
                chosenIndex: null,
                voicemailTranscript: 'Please call me back.',
            },
            directory: [{ id: 'helpdesk', label: 'Help Desk' }],
            home: {
                widgets: [],
                featuredApps: [{ id: 'store-app', name: 'Store App' }],
                settingsSections: [{ id: 'settings-general', title: 'General' }],
            },
        };

        expect(getSimulatorCapabilities(payload)).toEqual({
            phone: { dial: true, voicemail: true, directory: true },
            home: { store: true, settings: true },
            emailAttachments: true,
            browserForms: true,
        });
    });

    it('returns false capability flags for empty or malformed optional sections', () => {
        const payload: SimulatorTemplatePayload = {
            ...createPayload(),
            email: {
                inbox: null as never,
                selectedMessage: {
                    subject: 'Alert',
                    from: 'alerts@example.test',
                    body: 'Body',
                    attachment_name: '   ',
                },
                selectedMessageId: 'm1',
            },
            browser: {
                defaultPageId: 'landing',
                pages: [{ id: 'landing', url: 'https://example.test', title: 'Landing', layout: 'content', formFields: null as never }],
            },
            phone: {
                content: {
                    transcript: 'Incoming call.',
                    choices: [],
                },
                chosenIndex: null,
                voicemailTranscript: '   ',
            },
            directory: null,
            home: {
                widgets: [],
                featuredApps: [],
                settingsSections: [],
            },
        };

        expect(getSimulatorCapabilities(payload)).toEqual({
            phone: { dial: true, voicemail: false, directory: false },
            home: { store: false, settings: false },
            emailAttachments: false,
            browserForms: false,
        });
    });

    it('handles missing attachment keys, null phone payloads, and non-array browser pages', () => {
        const payload: SimulatorTemplatePayload = {
            ...createPayload(),
            email: {
                inbox: [{ id: 'message-1', subject: 'Alert', from: 'alerts@example.test' } as never],
                selectedMessage: {
                    subject: 'Alert',
                    from: 'alerts@example.test',
                    body: 'Body',
                } as never,
                selectedMessageId: 'm1',
            },
            browser: {
                defaultPageId: 'landing',
                pages: null as never,
            },
            phone: null,
            directory: [],
            home: null,
        };

        expect(getSimulatorCapabilities(payload)).toEqual({
            phone: { dial: false, voicemail: false, directory: false },
            home: { store: false, settings: false },
            emailAttachments: false,
            browserForms: false,
        });
    });
});

describe('handleSimulatorKeyboard', () => {
    it('switches apps with Alt+number shortcuts', () => {
        const onSwitchApp = vi.fn();
        const event = createKeyboardEvent({ key: '3', altKey: true });

        const result = handleSimulatorKeyboard(
            event,
            {
                onBack: vi.fn(),
                onSwitchApp,
                onFocusSearch: vi.fn(),
            },
            { activeApp: 'email', activeScreen: 'list' }
        );

        expect(result).toEqual({ handled: true });
        expect(onSwitchApp).toHaveBeenCalledWith('internet');
    });

    it('focuses contacts search on slash and ignores typing targets', () => {
        const onFocusSearch = vi.fn();
        class FakeHTMLElement {
            tagName = 'INPUT';
            isContentEditable = false;

            getAttribute(): string | null {
                return null;
            }
        }
        (globalThis as { HTMLElement?: unknown }).HTMLElement = FakeHTMLElement;
        const handledEvent = createKeyboardEvent({ key: '/' });
        const typingEvent = createKeyboardEvent({
            key: '/',
            target: new FakeHTMLElement() as unknown as EventTarget,
        });

        const handledResult = handleSimulatorKeyboard(
            handledEvent,
            {
                onBack: vi.fn(),
                onSwitchApp: vi.fn(),
                onFocusSearch,
            },
            { activeApp: 'phone', activeScreen: 'contacts' }
        );
        const ignoredResult = handleSimulatorKeyboard(
            typingEvent,
            {
                onBack: vi.fn(),
                onSwitchApp: vi.fn(),
                onFocusSearch,
            },
            { activeApp: 'phone', activeScreen: 'contacts' }
        );

        expect(handledResult).toEqual({ handled: true });
        expect(ignoredResult).toEqual({ handled: false });
        expect(onFocusSearch).toHaveBeenCalledTimes(1);
    });
});

describe('buildSimulatorPreviewReport', () => {
    it('keeps key actions deduplicated and alphabetically sorted', () => {
        const payload: SimulatorTemplatePayload = {
            ...createPayload(),
            email: {
                inbox: [{ id: 'message-1', subject: 'Subject', from: 'sender@example.test' }],
                selectedMessage: {
                    subject: 'Subject',
                    from: 'sender@example.test',
                    body: 'Hello',
                    links: [{ href: 'https://example.test/form', text: 'Open form' }],
                },
                selectedMessageId: 'message-1',
            },
            sms: {
                thread: {
                    messages: [{ from: 'them', text: 'Message body' }],
                    sender_display_name: 'Security Team',
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
                        layout: 'login',
                        formFields: [{ name: 'email', type: 'email', label: 'Email' }],
                        buttons: [{ label: 'Next', targetPageId: 'result' }],
                    },
                    {
                        id: 'result',
                        url: 'https://example.test/result',
                        title: 'Result',
                        layout: 'result',
                        buttons: [],
                    },
                ],
            },
            phone: {
                content: {
                    transcript: 'Incoming call.',
                    choices: [{ label: 'Trust', correct: false }],
                },
                chosenIndex: null,
            },
            contacts: [{ id: 'contact-1', displayName: 'Ada Lovelace' }],
            directory: [{ id: 'helpdesk', label: 'Help Desk' }],
            home: {
                widgets: [],
                featuredApps: [{ id: 'store-app', name: 'Store App' }],
                settingsSections: [{ id: 'settings-general', title: 'General' }],
            },
        };

        const report = buildSimulatorPreviewReport(payload);

        expect(report.keyActions).toEqual([
            'answer_call',
            'check_contact',
            'click_link',
            'dial_phone',
            'ignore_call',
            'open_contact',
            'open_email',
            'open_page',
            'open_settings',
            'open_store',
            'open_thread',
            'submit_form',
            'view_directory_entry',
        ]);
        expect(report.contactsCount).toBe(1);
        expect(report.browserPagesCount).toBe(2);
    });

    it('uses app defaults and marks invalid payloads when validation throws', () => {
        const messagesReport = buildSimulatorPreviewReport({
            ...createPayload(),
            channel: 'sms',
            entryPoint: null,
            sms: {
                thread: { messages: [{ from: 'them', text: 'Hello' }] },
                visibleMessageCount: 1,
            },
            browser: null,
            phone: null,
            home: null,
        } as never);
        expect(messagesReport.entryPoint).toEqual({ app: 'messages', screen: 'threads' });

        const phoneReport = buildSimulatorPreviewReport({
            ...createPayload(),
            channel: 'phone',
            entryPoint: null,
            phone: {
                content: { transcript: 'Incoming call.', choices: [] },
                chosenIndex: null,
            },
            browser: null,
            home: null,
        } as never);
        expect(phoneReport.entryPoint).toEqual({ app: 'phone', screen: 'history' });

        const homeReport = buildSimulatorPreviewReport({
            ...createPayload(),
            channel: 'home',
            entryPoint: null,
            device: {
                mainMenuItems: [{ id: 'home', label: 'Home' }],
                secondaryDefaults: { home: 'settings' },
            },
            browser: null,
            phone: null,
            home: {
                widgets: [{ id: 'widget-1', label: 'News' }],
                featuredApps: [],
                settingsSections: [],
            },
        } as never);
        expect(homeReport.entryPoint).toEqual({ app: 'home', screen: 'settings' });

        const invalidReport = buildSimulatorPreviewReport({
            ...createPayload(),
            channel: 'bogus',
        } as never);
        expect(invalidReport.validationOk).toBe(false);

        const browserReport = buildSimulatorPreviewReport({
            ...createPayload(),
            channel: 'browser',
            entryPoint: null,
            device: {
                mainMenuItems: [{ id: 'internet', label: 'Internet' }],
                secondaryDefaults: { internet: 'pricing' },
            },
            email: {
                inbox: [],
                selectedMessage: {
                    subject: 'Open this page',
                    from: 'sender@example.test',
                    body: 'Body',
                },
                selectedMessageId: null,
            },
            sms: null,
            browser: {
                defaultPageId: 'landing',
                pages: [
                    { id: 'landing', url: 'https://example.test', title: 'Landing', layout: 'content', buttons: [] },
                    { id: 'pricing', url: 'https://example.test/pricing', title: 'Pricing', layout: 'content', buttons: [] },
                ],
            },
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        } as never);
        expect(browserReport.entryPoint).toEqual({ app: 'internet', screen: 'pricing' });
        expect(browserReport.keyActions).toEqual(['open_page']);

        const emailOnlyReport = buildSimulatorPreviewReport({
            ...createPayload(),
            channel: 'email',
            entryPoint: null,
            device: {
                mainMenuItems: [{ id: 'email', label: 'Email' }],
                secondaryDefaults: {},
            },
            email: {
                inbox: [],
                selectedMessage: {
                    subject: 'Open this page',
                    from: 'sender@example.test',
                    body: 'Body',
                    links: [{ href: 'https://example.test' }],
                },
                selectedMessageId: null,
            },
            sms: null,
            browser: null,
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        } as never);
        expect(emailOnlyReport.keyActions).toEqual(['open_email']);

        const inboxLinksReport = buildSimulatorPreviewReport({
            ...createPayload(),
            channel: 'browser',
            entryPoint: null,
            device: {
                mainMenuItems: [{ id: 'internet', label: 'Internet' }],
                secondaryDefaults: {},
            },
            email: {
                inbox: [{ id: 'm1', subject: 'Alert', from: 'alerts@example.test', links: [{ href: 'https://example.test' }] as never }],
                selectedMessage: null,
                selectedMessageId: null,
            },
            sms: null,
            browser: {
                defaultPageId: 'landing',
                pages: [{ id: 'landing', url: 'https://example.test', title: 'Landing', layout: 'content' }],
            },
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        } as never);
        expect(inboxLinksReport.keyActions).toEqual(['click_link', 'open_page']);

        const sparseBrowserReport = buildSimulatorPreviewReport({
            ...createPayload(),
            channel: 'browser',
            entryPoint: null,
            device: {
                mainMenuItems: [{ id: 'internet', label: 'Internet' }],
                secondaryDefaults: {},
            },
            email: {
                inbox: [],
                selectedMessage: null,
                selectedMessageId: null,
            },
            sms: {
                thread: { messages: [] },
                visibleMessageCount: 0,
            },
            browser: {
                defaultPageId: undefined,
                pages: [{ id: 'landing', url: 'https://example.test', title: 'Landing', layout: 'content' }],
            },
            phone: null,
            contacts: null,
            directory: null,
            home: null,
        } as never);
        expect(sparseBrowserReport.entryPoint).toEqual({ app: 'internet', screen: 'landing' });
        expect(sparseBrowserReport.contactsCount).toBe(0);
        expect(sparseBrowserReport.directoryCount).toBe(0);
        expect(sparseBrowserReport.keyActions).toEqual(['open_page']);

        const browserSubmitOnlyReport = buildSimulatorPreviewReport({
            ...createPayload(),
            channel: 'browser',
            entryPoint: null,
            device: {
                mainMenuItems: [{ id: 'internet', label: 'Internet' }],
                secondaryDefaults: {},
            },
            email: null,
            sms: null,
            browser: {
                defaultPageId: 'landing',
                pages: [
                    {
                        id: 'landing',
                        url: 'https://example.test',
                        title: 'Landing',
                        layout: 'content',
                        submitTargetPageId: 'result',
                    },
                    {
                        id: 'result',
                        url: 'https://example.test/result',
                        title: 'Result',
                        layout: 'result',
                    },
                ],
            },
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        } as never);
        expect(browserSubmitOnlyReport.keyActions).toEqual(['open_page', 'submit_form']);

        const fallbackBrowserReport = buildSimulatorPreviewReport({
            ...createPayload(),
            channel: 'browser',
            entryPoint: null,
            device: {
                mainMenuItems: [{ id: 'internet', label: 'Internet' }],
                secondaryDefaults: {},
            },
            email: null,
            sms: null,
            browser: {
                defaultPageId: undefined,
                pages: [],
            },
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        } as never);
        expect(fallbackBrowserReport.entryPoint).toEqual({ app: 'internet', screen: 'landing' });
        expect(fallbackBrowserReport.browserHasCycle).toBe(false);

        const explicitEntryReport = buildSimulatorPreviewReport({
            ...createPayload(),
            channel: 'browser',
            entryPoint: { app: 'internet', screen: 'result' },
            device: {
                mainMenuItems: [{ id: 'internet', label: 'Internet' }],
                secondaryDefaults: { internet: 'pricing' },
            },
            email: null,
            sms: null,
            browser: {
                defaultPageId: 'landing',
                pages: [
                    { id: 'landing', url: 'https://example.test', title: 'Landing', layout: 'content' },
                    { id: 'result', url: 'https://example.test/result', title: 'Result', layout: 'result' },
                ],
            },
            phone: null,
            contacts: [{ id: 'c1', displayName: 'Contact' }],
            directory: [],
            home: null,
        } as never);
        expect(explicitEntryReport.entryPoint).toEqual({ app: 'internet', screen: 'result' });
        expect(explicitEntryReport.keyActions).toEqual(['open_page']);
    });

    it('falls back to email/list when reachability returns no entry app and keeps browser cycle false by default', () => {
        const report = buildSimulatorPreviewReport({
            ...createPayload(),
            channel: 'bogus' as never,
            entryPoint: null,
            device: {
                mainMenuItems: [],
                secondaryDefaults: {},
            },
            email: null,
            sms: null,
            browser: null,
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        } as never);

        expect(report.entryPoint).toEqual({ app: 'email', screen: 'list' });
        expect(report.browserHasCycle).toBe(false);
    });

    it('uses list defaults for unsupported entry apps without an explicit screen', () => {
        const report = buildSimulatorPreviewReport({
            ...createPayload(),
            channel: 'email',
            entryPoint: { app: 'bogus' as never, screen: null as never },
            email: { inbox: [], selectedMessage: null, selectedMessageId: null },
            sms: null,
            browser: null,
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        } as never);

        expect(report.entryPoint).toEqual({ app: 'bogus', screen: 'list' });
    });

});

describe('simulatorKeyPatterns', () => {
    it('covers slug validation and advisory key naming suggestions', () => {
        expect(isSlugLike('')).toBe(false);
        expect(isSlugLike('0')).toBe(true);
        expect(isSlugLike('safe-key')).toBe(true);
        expect(isSlugLike('Bad_Key')).toBe(false);

        expect(keyNamingSuggestion('', 'template')).toBe('Key should be non-empty.');
        expect(keyNamingSuggestion('x'.repeat(129), 'contact')).toContain('longer than 128');
        expect(keyNamingSuggestion('x'.repeat(65), 'template')).toContain('exceeds 64');
        expect(keyNamingSuggestion('bad key', 'page')).toContain('spaces');
        expect(keyNamingSuggestion('-bad-key-', 'message')).toContain('leading or trailing hyphen');
        expect(keyNamingSuggestion('12345', 'thread')).toBeNull();
        expect(keyNamingSuggestion('BadKey', 'directory')).toContain('uppercase');
        expect(keyNamingSuggestion('bad_key', 'contact')).toContain('underscores');
        expect(keyNamingSuggestion('good-key', 'template')).toBeNull();
    });
});

describe('logSimulatorTransition', () => {
    it('logs the formatted local view change details when enabled', () => {
        process.env.NODE_ENV = 'development';
        (globalThis as { window?: unknown }).window = {
            __SIMULATOR_LOG_TRANSITIONS__: true,
        };
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const payload: SimulatorTemplatePayload = {
            ...createPayload(),
            browser: {
                defaultPageId: 'landing',
                pages: [
                    {
                        id: 'landing',
                        url: 'https://example.test',
                        title: 'Landing',
                        layout: 'content',
                        buttons: [{ label: 'Pricing', targetPageId: 'pricing' }],
                    },
                    {
                        id: 'pricing',
                        url: 'https://example.test/pricing',
                        title: 'Pricing',
                        layout: 'content',
                        buttons: [],
                    },
                ],
            },
        };
        const prev = createState(payload);
        prev.view.activeApp = 'email';
        const next: SimulatorSessionState = {
            ...prev,
            view: {
                ...prev.view,
                activeApp: 'internet',
                internet: {
                    screen: 'pricing',
                    stack: ['landing'],
                },
            },
        };

        logSimulatorTransition(prev, { type: 'SWITCH_APP', app: 'internet' }, next);

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('SWITCH_APP(internet)'));
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('app email→internet'));
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('internet landing→pricing'));
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('stack=1'));
    });
});

describe('mapDirectory', () => {
    it('filters invalid entries and keeps optional directory fields', () => {
        expect(
            mapDirectory([
                null,
                { id: 'missing-label' },
                {
                    id: 'helpdesk',
                    label: 'Help Desk',
                    contact_id: 'contact-1',
                    number: '555-0100',
                    url: 'https://example.test/help',
                    description: 'Trusted support line',
                },
            ])
        ).toEqual([
            {
                id: 'helpdesk',
                label: 'Help Desk',
                contact_id: 'contact-1',
                number: '555-0100',
                url: 'https://example.test/help',
                description: 'Trusted support line',
            },
        ]);
    });
});
