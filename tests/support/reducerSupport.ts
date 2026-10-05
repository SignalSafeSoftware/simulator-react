import { initialViewState } from '../../src/state/simulatorViewStateHelpers.js';
import type { SimulatorSessionState } from '../../src/types/session';

export function createPayload(
    overrides: Record<string, unknown> = {},
): SimulatorSessionState['payload'] {
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
                {
                    id: 'pricing',
                    url: 'https://example.test/pricing',
                    title: 'Pricing',
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

export function createState(overrides: Record<string, unknown> = {}): SimulatorSessionState {
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
