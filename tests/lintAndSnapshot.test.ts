import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SimulatorSessionState, SimulatorTemplatePayload } from '../src/types/session';
import { lintSimulatorPayload } from '../src/utils/payload/lintSimulatorPayload';
import { captureSimulatorSnapshot, snapshotToJson } from '../src/utils/telemetry/simulatorSnapshot';
import { createPayload, createState } from './support/criticalPathsSupport';

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
            ]),
        );
        expect(warnings).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ code: 'duplicate_keys', path: 'contacts' }),
                expect.objectContaining({ code: 'duplicate_keys', path: 'email.inbox' }),
                expect.objectContaining({ code: 'browser_page_bare', path: 'browser.pages[0]' }),
            ]),
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
                actionHistory: [{ type: 'search_contacts', query: { nested: 'value' } as never }],
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
                        // @ts-expect-error Snapshot serialization deliberately receives an extra wire field on a dial action.
                        channel: 'sms',
                    },
                    {
                        type: 'open_attachment',
                        // @ts-expect-error Snapshot serialization deliberately receives an extra wire field on an attachment action.
                        messageId: 'm1',
                        attachmentIndex: 0,
                    },
                    {
                        type: 'answer_call',
                        choiceIndex: 2,
                        // @ts-expect-error Snapshot serialization deliberately receives extra wire fields on an answer action.
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
        expect(snapshot.view.phone).toEqual({
            screen: 'voicemail',
            stackLength: 2,
            chosenIndex: 1,
        });
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
