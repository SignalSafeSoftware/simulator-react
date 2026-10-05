import { describe, expect, it } from 'vitest';
import { templateDetailToPayload } from '../src/adapters/templateToSession';
import {
    buildSimulatorNavGraph,
    simulatorNavGraphToJson,
} from '../src/utils/navigation/simulatorNavGraph';

describe('nav graph fallbacks and template mapping', () => {
    it('covers nav graph email fallback links, unknown entry fallback, and pretty JSON output', () => {
        const graph = buildSimulatorNavGraph({
            templateId: null,
            templateKey: 'graph-email-fallback',
            name: 'Graph Email Fallback',
            channel: 'unknown' as never,
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: null,
            device: {
                mainMenuItems: [
                    { id: 'email', label: 'Email' },
                    { id: 'internet', label: 'Internet' },
                ],
                secondaryDefaults: {},
            },
            email: {
                inbox: [
                    {
                        id: 'e1',
                        subject: 'Inbox',
                        from: 'sender@example.test',
                        links: [{ href: 'site.example.test/login', text: 'Login' }],
                    } as never,
                ],
                selectedMessage: null,
                selectedMessageId: null,
            },
            sms: null,
            browser: {
                defaultPageId: undefined,
                pages: [
                    {
                        id: 'landing',
                        url: 'https://site.example.test/',
                        layout: 'content',
                        buttons: [{ label: 'Open login', targetPageId: 'login' }],
                    } as never,
                    {
                        id: 'login',
                        url: 'https://site.example.test/login',
                        layout: 'content',
                    } as never,
                ],
            },
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        } as never);

        expect(graph.entry).toEqual({ app: 'email', screen: 'list' });
        expect(graph.nodes).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: 'internet:landing', label: 'landing' }),
                expect.objectContaining({ id: 'internet:login', label: 'login' }),
            ]),
        );
        expect(graph.edges).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    from: 'email:detail',
                    to: 'internet:login',
                    action: 'click_link',
                    label: 'site.example.test/login',
                }),
            ]),
        );
        expect(simulatorNavGraphToJson(graph)).toContain('\n  "entry"');
    });

    it('covers nav graph browser defaults, blank href skips, and undefined click-link labels', () => {
        const graph = buildSimulatorNavGraph({
            templateId: null,
            templateKey: 'graph-browser-defaults',
            name: 'Graph Browser Defaults',
            channel: 'browser',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: null,
            device: {
                mainMenuItems: [
                    { id: 'internet', label: 'Internet' },
                    { id: 'email', label: 'Email' },
                ],
                secondaryDefaults: {},
            },
            email: {
                inbox: [{ id: 'e1', subject: 'Inbox', from: 'sender@example.test' }],
                selectedMessage: {
                    subject: 'Inbox',
                    from: 'sender@example.test',
                    body: 'Open it',
                    links: [
                        { href: undefined, text: 'No href' },
                        { href: '   ', text: 'Blank href' },
                    ] as never,
                },
                selectedMessageId: 'e1',
            },
            sms: null,
            browser: {
                defaultPageId: undefined,
                pages: [
                    { id: 'landing', url: '', title: 'Landing', layout: 'content', buttons: [] },
                    { id: 'target', url: '', title: 'Target', layout: 'content', buttons: [] },
                ],
            },
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        } as never);

        expect(graph.entry).toEqual({ app: 'internet', screen: 'landing' });
        expect(graph.edges).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    from: 'email:detail',
                    to: 'internet:landing',
                    action: 'click_link',
                    label: '   ',
                }),
            ]),
        );

        const smsGraph = buildSimulatorNavGraph({
            templateId: null,
            templateKey: 'graph-sms-undefined-label',
            name: 'Graph SMS Undefined Label',
            channel: 'sms',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'messages', screen: 'thread_detail' },
            device: {
                mainMenuItems: [
                    { id: 'messages', label: 'Messages' },
                    { id: 'internet', label: 'Internet' },
                ],
                secondaryDefaults: {},
            },
            email: null,
            sms: {
                thread: {
                    messages: [{ from: 'them', text: 'Open target' }],
                    links: [
                        { href: 'https://known.example.test/target' },
                        { href: undefined },
                    ] as never,
                },
                visibleMessageCount: 1,
            },
            browser: {
                defaultPageId: 'landing',
                pages: [
                    {
                        id: 'landing',
                        url: 'https://known.example.test',
                        title: 'Landing',
                        layout: 'content',
                    },
                    {
                        id: 'target',
                        url: 'https://known.example.test/target',
                        title: 'Target',
                        layout: 'content',
                    },
                ],
            },
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        } as never);

        expect(smsGraph.edges.some((edge) => edge.action === 'click_link')).toBe(false);
    });

    it('falls back to list defaults for unsupported entry apps in nav graphs', () => {
        const graph = buildSimulatorNavGraph({
            templateId: null,
            templateKey: 'graph-bogus-entry',
            name: 'Graph Bogus Entry',
            channel: 'email',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'bogus' as never, screen: null as never },
            device: {
                mainMenuItems: [{ id: 'email', label: 'Email' }],
                secondaryDefaults: {},
            },
            email: {
                inbox: [{ id: 'e1', subject: 'Inbox', from: 'sender@example.test' }],
                selectedMessage: null,
                selectedMessageId: null,
            },
            sms: null,
            browser: null,
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        } as never);

        expect(graph.entry).toEqual({ app: 'bogus', screen: 'list' });
    });

    it('requires a full-device entry point when mapping template details', () => {
        for (const simulator of [null, { entry_point: { app: 'not-real' } }]) {
            expect(() =>
                templateDetailToPayload({
                    id: 1,
                    key: 'invalid',
                    name: '',
                    channel: 'browser',
                    topics: [],
                    simulator,
                } as never),
            ).toThrow('entry_point');
        }

        const full = templateDetailToPayload(
            {
                id: 3,
                key: 'full-template',
                name: 'Full Template',
                channel: 'email',
                topics: [{ key: '', name: '' }],
                simulator: {
                    entry_point: { app: 'internet', screen: 'landing' },
                    device: {
                        main_menu_items: [{ id: 'internet', label: 'Internet' }],
                        secondary_defaults: { internet: 'landing' },
                    },
                    email: {
                        messages: [],
                        detail: null,
                    },
                    messages: {
                        thread_detail: { messages: [{ from: 'them', text: 'Hello' }] },
                    },
                    internet: {
                        pages: [
                            {
                                id: 'landing',
                                url: 'example.test',
                                title: 'Landing',
                                layout: 'content',
                            },
                        ],
                    },
                    phone: {
                        incoming_call: { transcript: 'Incoming call.' },
                    },
                    contacts: [{ display_name: 'Ada' }],
                    directory: [{ id: 'dir-1', label: 'Directory' }],
                    home: {
                        home: { widgets: [] },
                        store: { featured_apps: [] },
                        settings: { sections: [] },
                    },
                },
            } as never,
            { runId: 9, attemptId: 10 },
        );

        expect(full.channel).toBe('browser');
        expect(full.entryPoint).toEqual({ app: 'internet', screen: 'landing' });
        expect(full.runId).toBe(9);
        expect(full.attemptId).toBe(10);
        expect(full.topicTags).toEqual([{ key: '', name: '' }]);
        expect(full.contacts?.[0]?.displayName).toBe('Ada');
        expect(full.browser?.defaultPageId).toBe('landing');
    });
});
