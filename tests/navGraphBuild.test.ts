import type { SimulatorTemplatePayload } from '../src/types/session.js';
import { describe, expect, it } from 'vitest';
import {
    appToChannel,
    mapContacts,
    mapDevice,
    mapDirectory,
} from '../src/adapters/fullDeviceToSession';
import { mapEmail } from '../src/adapters/device/emailMapper';
import { mapHome } from '../src/adapters/device/homeMapper';
import { mapInternet } from '../src/adapters/device/internetMapper';
import { mapMessages } from '../src/adapters/device/messagesMapper';
import { mapPhone } from '../src/adapters/device/phoneMapper';
import {} from '../src/adapters/templateToSession';
import { DEFAULT_BROWSER_SUBMIT_TARGET } from '../src/constants';
import {} from '../src/utils/payload/simulatorRealismChecks';
import {
    buildSimulatorNavGraph,
    simulatorNavGraphToJson,
} from '../src/utils/navigation/simulatorNavGraph';

describe('nav graph building', () => {
    it('builds nav graphs and maps full-device payload sections', () => {
        const payload: SimulatorTemplatePayload = {
            templateId: 1,
            templateKey: 'graph-world',
            name: 'Graph World',
            channel: 'email',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'email', screen: 'list' },
            device: {
                mainMenuItems: [
                    { id: 'email', label: 'Email' },
                    { id: 'messages', label: 'Messages' },
                    { id: 'internet', label: 'Internet' },
                    { id: 'phone', label: 'Phone' },
                    { id: 'home', label: 'Home' },
                ],
                secondaryDefaults: { phone: 'directory' },
            },
            email: {
                inbox: [{ id: 'e1', subject: 'Inbox', from: 'sender@example.test' }],
                selectedMessage: {
                    subject: 'Inbox',
                    from: 'sender@example.test',
                    body: 'Open the site',
                    links: [{ href: 'https://site.example.test/login', text: 'Login' }],
                },
                selectedMessageId: 'e1',
            },
            sms: {
                thread: {
                    messages: [{ from: 'them', text: 'Message body' }],
                    links: [{ href: 'https://site.example.test/result' }] as never,
                },
                visibleMessageCount: 1,
            },
            browser: {
                defaultPageId: 'landing',
                pages: [
                    {
                        id: 'landing',
                        url: 'https://site.example.test',
                        title: 'Landing',
                        layout: 'landing',
                        buttons: [{ label: 'Go', targetPageId: 'login' }],
                    },
                    {
                        id: 'login',
                        url: 'https://site.example.test/login',
                        title: 'Login',
                        layout: 'login',
                        formFields: [{ name: 'email', label: 'Email', type: 'email' }],
                        submitTargetPageId: 'result',
                    },
                    {
                        id: 'result',
                        url: 'https://site.example.test/result',
                        title: 'Result',
                        layout: 'result',
                    },
                ],
            },
            phone: {
                content: { transcript: 'Incoming call', choices: [] },
                chosenIndex: null,
            },
            contacts: [{ id: 'c1', displayName: 'Helpdesk', number: '+15550001111' }],
            directory: [{ id: 'd1', label: 'Helpdesk', number: '+15550001111' }],
            home: {
                widgets: [{ id: 'w1', label: 'Widget' }],
                featuredApps: [],
                settingsSections: [],
            },
        };

        const graph = buildSimulatorNavGraph(payload);
        expect(graph.entry).toEqual({ app: 'email', screen: 'list' });
        expect(graph.nodes.some((node) => node.id === 'internet:landing')).toBe(true);
        expect(graph.edges.some((edge) => edge.action === 'main_menu')).toBe(true);
        expect(graph.edges.some((edge) => edge.action === 'button_click')).toBe(true);
        expect(graph.edges.some((edge) => edge.action === 'click_link')).toBe(true);
        expect(simulatorNavGraphToJson(graph, false)).toContain('"entry"');

        expect(appToChannel('messages')).toBe('sms');
        expect(appToChannel('internet')).toBe('browser');
        expect(appToChannel('home')).toBe('home');

        expect(mapDevice(null as never)).toBeNull();
        expect(
            mapDevice({
                main_menu_items: [{ id: 'email', label: 'Email' }, { id: 'phone' }, null],
                secondary_defaults: { phone: 'history' },
            } as never),
        ).toEqual({
            mainMenuItems: [
                { id: 'email', label: 'Email', app: undefined },
                { id: 'phone', label: 'phone', app: undefined },
            ],
            secondaryDefaults: { phone: 'history' },
        });

        expect(
            mapDirectory([{ id: 'd1', label: 'Directory', number: '1' }, { id: 'bad' }]),
        ).toHaveLength(1);
        expect(
            mapContacts([
                { display_name: 'Ada', id: 'c1', number: '123', email: 'ada@example.test' },
                null,
            ] as never),
        ).toEqual([{ id: 'c1', displayName: 'Ada', number: '123', email: 'ada@example.test' }]);

        const email = mapEmail({
            messages: [],
            detail: {
                id: 'm1',
                subject: 'Hello',
                from_addr: 'sender@example.test',
                body: 'Body',
                from_display_name: 'Sender',
                attachment_name: 'invoice.pdf',
                attachment_behavior: 'download',
                links: [{ href: 'https://detail.example.test', text: 'Open' }],
            },
        } as never);
        expect(email?.selectedMessage?.attachment_behavior).toBe('download');
        expect(email?.inbox?.[0]?.id).toBe('m1');

        const emailWithoutArrayLinks = mapEmail({
            messages: [],
            detail: {
                id: 'm2',
                subject: 'Hello',
                from_addr: 'sender@example.test',
                body: 'Body',
                links: { href: 'https://detail.example.test' },
            },
        } as never);
        expect(emailWithoutArrayLinks?.selectedMessage?.links).toBeUndefined();

        const messages = mapMessages({
            thread_detail: {
                messages: [
                    { from: 'me', text: 'Sent', attachment: { label: 'File', url: '/file' } },
                ],
                sender_display_name: 'Security Team',
                sender_number: '+1555',
                unread: true,
            },
            threads: [
                {
                    id: 't1',
                    snippet: 'Preview',
                    contact_name: 'Security Team',
                    contact_number: '+1555',
                    unread: true,
                },
            ],
        } as never);
        expect(messages?.thread.messages[0]).toEqual(
            expect.objectContaining({ from: 'me', text: 'Sent' }),
        );
        expect(messages?.threads?.[0]?.preview).toBe('Preview');

        const phone = mapPhone({
            incoming_call: { transcript: '', phone_number: '+1555', caller_name: 'Caller' },
            history: [
                {
                    id: 'call-1',
                    number: '+1555',
                    name: 'Caller',
                    direction: 'out',
                    timestamp: 'Now',
                },
            ],
            voicemail: { transcript: 'Leave a message', caller_name: 'Caller', timestamp: 'Later' },
        } as never);
        expect(phone?.content?.transcript).toBe('Incoming call.');
        expect(phone?.callHistory?.[0]?.kind).toBe('outgoing');
        expect(phone?.voicemailTranscript).toBe('Leave a message');

        const internet = mapInternet({
            pages: [{ id: 'landing', url: 'portal.example.test', title: '', layout: 'login' }],
            forms: [
                { page_id: 'landing', fields: [{ name: 'email', type: 'email', label: 'Email' }] },
            ],
        } as never);
        expect(internet?.pages.some((page) => page.id === DEFAULT_BROWSER_SUBMIT_TARGET)).toBe(
            true,
        );
        expect(internet?.pages[0]?.url).toBe('https://portal.example.test/');

        const home = mapHome({
            home: { widgets: [{ id: 'w1', type: 'news', label: 'News' }] },
            store: { featured_apps: [{ id: 'app-1', name: 'App' }] },
            settings: { sections: [{ id: 's1', title: 'General' }] },
        } as never);
        expect(home).toEqual({
            widgets: [{ id: 'w1', type: 'news', label: 'News' }],
            featuredApps: [{ id: 'app-1', name: 'App' }],
            settingsSections: [{ id: 's1', title: 'General' }],
        });

        const sparseHome = mapHome({
            home: { widgets: {} },
            store: { featured_apps: {} },
            settings: { sections: {} },
        } as never);
        expect(sparseHome).toEqual({
            widgets: [],
            featuredApps: [],
            settingsSections: [],
        });
    });

    it('covers nav graph fallback entry points and unresolved link skips', () => {
        const fallbackGraph = buildSimulatorNavGraph({
            templateId: null,
            templateKey: 'graph-fallback',
            name: 'Graph Fallback',
            channel: 'contacts',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: null,
            device: {
                mainMenuItems: [
                    { id: 'phone', label: 'Phone' },
                    { id: 'internet', label: 'Internet' },
                ],
                secondaryDefaults: { phone: 'directory' },
            },
            email: null,
            sms: {
                thread: {
                    messages: [{ from: 'them', text: 'Open this link' }],
                    links: [{ href: 'https://missing.example.test' }] as never,
                },
                visibleMessageCount: 1,
            },
            browser: {
                defaultPageId: 'landing',
                pages: [
                    {
                        id: 'landing',
                        url: 'https://site.example.test',
                        title: '',
                        layout: 'content',
                        submitTargetPageId: 'landing',
                        buttons: [],
                    },
                    {
                        id: 'pricing',
                        url: 'https://site.example.test/pricing',
                        title: 'Pricing',
                        layout: 'content',
                        buttons: [],
                    },
                ],
            },
            phone: {
                content: { transcript: 'Incoming call', choices: [] },
                chosenIndex: null,
            },
            contacts: [],
            directory: [],
            home: null,
        } as never);

        expect(fallbackGraph.entry).toEqual({ app: 'phone', screen: 'directory' });
        expect(fallbackGraph.nodes).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: 'internet:landing', label: '' }),
                expect.objectContaining({ id: 'phone:directory', label: 'directory' }),
            ]),
        );
        expect(fallbackGraph.edges.some((edge) => edge.action === 'form_submit')).toBe(false);
        expect(fallbackGraph.edges.some((edge) => edge.action === 'click_link')).toBe(false);
    });

    it('covers nav graph default screens for messages and home apps', () => {
        const graph = buildSimulatorNavGraph({
            templateId: null,
            templateKey: 'graph-messages-home',
            name: 'Graph Messages Home',
            channel: 'sms',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: null,
            device: {
                mainMenuItems: [
                    { id: 'messages', label: 'Messages' },
                    { id: 'home', label: 'Home' },
                ],
                secondaryDefaults: { home: 'settings' },
            },
            email: null,
            sms: {
                thread: { messages: [{ from: 'them', text: 'Hello' }] },
                visibleMessageCount: 1,
            },
            browser: null,
            phone: null,
            contacts: [],
            directory: [],
            home: {
                widgets: [{ id: 'w1', label: 'Widget' }],
                featuredApps: [],
                settingsSections: [],
            },
        } as never);

        expect(graph.entry).toEqual({ app: 'messages', screen: 'threads' });
        expect(graph.nodes).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: 'messages:threads', label: 'threads' }),
                expect.objectContaining({ id: 'home:settings', label: 'settings' }),
            ]),
        );
        expect(graph.edges).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    from: 'messages:threads',
                    to: 'home:settings',
                    action: 'main_menu',
                }),
                expect.objectContaining({
                    from: 'messages:threads',
                    to: 'messages:thread_detail',
                    action: 'open_thread',
                }),
                expect.objectContaining({
                    from: 'messages:threads',
                    to: 'messages:new_thread',
                    action: 'new_thread',
                }),
            ]),
        );
    });

    it('adds browser form-submit edges and falls back to phone history defaults', () => {
        const phoneGraph = buildSimulatorNavGraph({
            templateId: null,
            templateKey: 'graph-phone-browser',
            name: 'Graph Phone Browser',
            channel: 'phone',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: null,
            device: {
                mainMenuItems: [
                    { id: 'phone', label: 'Phone' },
                    { id: 'internet', label: 'Internet' },
                ],
                secondaryDefaults: {},
            },
            email: {
                inbox: [{ id: 'e1', subject: 'Inbox', from: 'sender@example.test' }],
                selectedMessage: {
                    subject: 'Inbox',
                    from: 'sender@example.test',
                    body: 'Open the real site',
                    links: [
                        { href: 'https://known.example.test/login', text: 'Known' },
                        { href: 'https://unknown.example.test', text: 'Unknown' },
                    ],
                },
                selectedMessageId: 'e1',
            },
            sms: null,
            browser: {
                defaultPageId: 'landing',
                pages: [
                    {
                        id: 'landing',
                        url: 'https://known.example.test',
                        title: 'Landing',
                        layout: 'content',
                        buttons: [],
                    },
                    {
                        id: 'login',
                        url: 'https://known.example.test/login',
                        title: 'Login',
                        layout: 'login',
                        formFields: [{ name: 'email', label: 'Email', type: 'email' }],
                        submitTargetPageId: 'result',
                    },
                    {
                        id: 'result',
                        url: 'https://known.example.test/result',
                        title: 'Result',
                        layout: 'result',
                    },
                ],
            },
            phone: {
                content: { transcript: 'Incoming call', choices: [] },
                chosenIndex: null,
            },
            contacts: [],
            directory: [],
            home: null,
        } as never);

        expect(phoneGraph.entry).toEqual({ app: 'phone', screen: 'history' });

        const browserGraph = buildSimulatorNavGraph({
            templateId: null,
            templateKey: 'graph-browser-submit',
            name: 'Graph Browser Submit',
            channel: 'email',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'internet', screen: 'login' },
            device: {
                mainMenuItems: [
                    { id: 'email', label: 'Email' },
                    { id: 'internet', label: 'Internet' },
                ],
                secondaryDefaults: {},
            },
            email: {
                inbox: [{ id: 'e1', subject: 'Inbox', from: 'sender@example.test' }],
                selectedMessage: {
                    subject: 'Inbox',
                    from: 'sender@example.test',
                    body: 'Open the real site',
                    links: [
                        { href: 'https://known.example.test/login', text: 'Known' },
                        { href: 'https://unknown.example.test', text: 'Unknown' },
                    ],
                },
                selectedMessageId: 'e1',
            },
            sms: null,
            browser: {
                defaultPageId: 'login',
                pages: [
                    {
                        id: 'landing',
                        url: 'https://known.example.test',
                        title: 'Landing',
                        layout: 'content',
                    },
                    {
                        id: 'login',
                        url: 'https://known.example.test/login',
                        title: 'Login',
                        layout: 'login',
                        formFields: [{ name: 'email', label: 'Email', type: 'email' }],
                        submitTargetPageId: 'result',
                        buttons: [{ label: 'Continue', targetPageId: 'result' }],
                    },
                    {
                        id: 'result',
                        url: 'https://known.example.test/result',
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

        expect(browserGraph.edges).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    from: 'internet:login',
                    to: 'internet:result',
                    action: 'form_submit',
                }),
                expect.objectContaining({
                    from: 'email:detail',
                    to: 'internet:login',
                    action: 'click_link',
                    label: 'https://known.example.test/login',
                }),
            ]),
        );
        expect(
            browserGraph.edges.some(
                (edge) =>
                    edge.action === 'click_link' && edge.label === 'https://unknown.example.test',
            ),
        ).toBe(false);
    });
});
