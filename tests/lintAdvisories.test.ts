import { afterEach, describe, expect, it, vi } from 'vitest';
import {} from '../src/utils/payload/simulatorPayloadDiff';
import { lintSimulatorPayload } from '../src/utils/payload/lintSimulatorPayload';
import {} from '../src/state/simulatorSessionInitialState.js';
import {} from '../src/state/simulatorViewStateHelpers.js';
import { createPayload } from './support/utilityTailSupport';

const originalNodeEnv = process.env.NODE_ENV;

const originalWindow = (globalThis as { window?: unknown }).window;

const originalLocalStorage = (globalThis as { localStorage?: unknown }).localStorage;

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

describe('lint advisories', () => {
    it('covers advisory lint branches for entry content, verification, and naming', () => {
        const warnings = lintSimulatorPayload(
            createPayload({
                templateKey: 'Bad_Template',
                entryPoint: { app: 'home', screen: 'home' },
                home: { widgets: [], featuredApps: [], settingsSections: [] },
                contacts: [],
                phone: {
                    content: {
                        transcript: 'Incoming',
                        choices: [{ label: 'Answer', correct: true }],
                    },
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
                        {
                            id: 'Bad Page',
                            url: '',
                            title: '',
                            content: '',
                            layout: 'content',
                            buttons: [],
                        },
                    ],
                },
            }),
        ).warnings;

        expect(warnings.map((warning) => warning.code)).toEqual(
            expect.arrayContaining(['entry_app_empty', 'key_naming', 'browser_page_bare']),
        );

        const emailWarnings = lintSimulatorPayload(
            createPayload({
                entryPoint: { app: 'email', screen: 'detail' },
                email: { inbox: [], selectedMessage: null, selectedMessageId: null },
            }),
        ).warnings;
        expect(emailWarnings.map((warning) => warning.code)).toContain('entry_app_empty');

        const messagesWarnings = lintSimulatorPayload(
            createPayload({
                entryPoint: { app: 'messages', screen: 'thread_detail' },
                sms: { thread: { messages: [] }, visibleMessageCount: 0 },
            }),
        ).warnings;
        expect(messagesWarnings.map((warning) => warning.code)).toContain('entry_app_empty');

        const phoneWarnings = lintSimulatorPayload(
            createPayload({
                entryPoint: { app: 'phone', screen: 'contacts' },
                contacts: [],
                phone: {
                    content: {
                        transcript: 'Incoming',
                        choices: [{ label: 'Answer', correct: true }],
                    },
                    chosenIndex: null,
                },
            }),
        ).warnings;
        expect(phoneWarnings.map((warning) => warning.code)).toContain(
            'phone_verification_without_contacts',
        );

        const phoneEntryWarnings = lintSimulatorPayload(
            createPayload({
                entryPoint: { app: 'phone', screen: 'dial' },
                phone: null,
            }),
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
            }),
        ).warnings;
        expect(nullEntryWarnings).toEqual([]);

        const emailListWarnings = lintSimulatorPayload(
            createPayload({
                entryPoint: { app: 'email', screen: 'list' },
                email: {
                    inbox: [],
                    outbox: [],
                    trash: [],
                    selectedMessage: null,
                    selectedMessageId: null,
                },
            }),
        ).warnings;
        expect(emailListWarnings).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'entry_app_empty',
                    message: 'Entry point is email but inbox and selected message are empty.',
                }),
            ]),
        );

        const messagesListWarnings = lintSimulatorPayload(
            createPayload({
                entryPoint: { app: 'messages', screen: 'threads' },
                sms: { thread: { messages: [] }, visibleMessageCount: 0 },
            }),
        ).warnings;
        expect(messagesListWarnings).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'entry_app_empty',
                    message: 'Entry point is messages but the SMS thread is empty.',
                }),
            ]),
        );

        const internetWarnings = lintSimulatorPayload(
            createPayload({
                entryPoint: { app: 'internet', screen: 'landing' },
                browser: { defaultPageId: 'landing', pages: [] },
            }),
        ).warnings;
        expect(internetWarnings).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'entry_app_empty',
                    message: 'Entry point is internet but there are no browser pages.',
                }),
            ]),
        );
    });

    it('covers remaining lint warnings for unreachable internet targets, sender identity, and directory naming', () => {
        const warnings = lintSimulatorPayload(
            createPayload({
                templateKey: 'clean-template',
                entryPoint: { app: 'internet', screen: 'missing-page' },
                sms: {
                    thread: {
                        messages: [{ from: 'them', text: 'Hello' }],
                        sender_display_name: '',
                        sender_number: '',
                    },
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
            }),
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
            ]),
        );
    });

    it('keeps lint quiet for populated entry states and supported browser targets', () => {
        const warnings = lintSimulatorPayload(
            createPayload({
                templateKey: 'clean-template',
                entryPoint: { app: 'internet', screen: 'landing' },
                home: {
                    widgets: [{ id: 'widget-1', label: 'News' }],
                    featuredApps: [],
                    settingsSections: [],
                },
                phone: {
                    content: {
                        transcript: 'Incoming',
                        choices: [{ label: 'Answer', correct: true }],
                    },
                    chosenIndex: null,
                },
                contacts: [{ id: 'contact-1', displayName: 'Ada Lovelace' }],
                directory: [{ id: 'helpdesk', label: 'Help Desk', number: '+1555' }],
                email: {
                    inbox: [{ id: 'message-1', subject: 'Alert', from: 'alerts@example.test' }],
                    selectedMessage: {
                        subject: 'Alert',
                        from: 'alerts@example.test',
                        body: 'Body',
                    },
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
            }),
        ).warnings;

        expect(warnings.map((warning) => warning.code)).not.toEqual(
            expect.arrayContaining([
                'entry_app_empty',
                'entry_point_unreachable',
                'unreachable_action_target',
                'browser_page_bare',
                'messages_no_sender_identity',
                'phone_verification_without_contacts',
            ]),
        );
    });
});
