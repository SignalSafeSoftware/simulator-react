import { initialViewState } from '../../src/state/simulatorViewStateHelpers.js';
import type { SimulatorSessionState, SimulatorTemplatePayload } from '../../src/types/session';

export function createPayload(overrides: Record<string, unknown> = {}): SimulatorTemplatePayload {
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
                {
                    id: 'pricing',
                    url: 'https://example.test/pricing',
                    title: 'Pricing',
                    layout: 'content',
                },
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

export function createState(overrides: Record<string, unknown> = {}): SimulatorSessionState {
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
