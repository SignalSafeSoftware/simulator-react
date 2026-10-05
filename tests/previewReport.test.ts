import { afterEach, describe, expect, it, vi } from 'vitest';
import {} from '../src/adapters/fullDeviceToSession';
import {} from '../src/state/simulatorSessionInitialState.js';
import type { SimulatorTemplatePayload } from '../src/types/session';
import {} from '../src/utils/payload/lintSimulatorPayload';
import {} from '../src/utils/payload/simulatorKeyPatterns';
import {} from '../src/utils/payload/simulatorCapabilities';
import {} from '../src/utils/navigation/simulatorKeyboardCommands';
import { buildSimulatorPreviewReport } from '../src/utils/preview/simulatorPreviewReport';
import {} from '../src/utils/telemetry/simulatorTransitionLogger';
import { createPayload } from './support/criticalPathsSupport';

const originalNodeEnv = process.env.NODE_ENV;

const originalWindow = (globalThis as { window?: unknown }).window;

const originalHTMLElement = (globalThis as { HTMLElement?: unknown }).HTMLElement;

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
                    {
                        id: 'landing',
                        url: 'https://example.test',
                        title: 'Landing',
                        layout: 'content',
                        buttons: [],
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
                inbox: [
                    {
                        id: 'm1',
                        subject: 'Alert',
                        from: 'alerts@example.test',
                        links: [{ href: 'https://example.test' }] as never,
                    },
                ],
                selectedMessage: null,
                selectedMessageId: null,
            },
            sms: null,
            browser: {
                defaultPageId: 'landing',
                pages: [
                    {
                        id: 'landing',
                        url: 'https://example.test',
                        title: 'Landing',
                        layout: 'content',
                    },
                ],
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
                pages: [
                    {
                        id: 'landing',
                        url: 'https://example.test',
                        title: 'Landing',
                        layout: 'content',
                    },
                ],
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
                    {
                        id: 'landing',
                        url: 'https://example.test',
                        title: 'Landing',
                        layout: 'content',
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
