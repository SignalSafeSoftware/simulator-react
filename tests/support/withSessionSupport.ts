import type { ReactTestRendererJSON } from 'react-test-renderer';

export function createState(overrides: Record<string, unknown> = {}) {
    return {
        payload: {
            templateId: 1,
            templateKey: 'sim-template',
            name: 'Simulator Template',
            channel: 'email',
            topicTags: [],
            runId: 2,
            attemptId: 3,
            entryPoint: { app: 'email', screen: 'list' },
            contacts: [{ id: 'c1', displayName: 'Helpdesk', number: '+15550000001' }],
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
            email: {
                inbox: [{ id: 'm1', subject: 'Alert', from: 'alerts@example.test' }],
                selectedMessageId: 'm1',
                selectedMessage: { subject: 'Alert', from: 'alerts@example.test', body: 'Body' },
            },
            sms: {
                thread: {
                    messages: [{ from: 'them', text: 'Hello' }],
                    sender_display_name: 'Security Team',
                    sender_number: '+15550000002',
                },
                visibleMessageCount: 0,
            },
            phone: {
                content: {
                    transcript: 'Incoming call',
                    choices: [],
                    caller_name: 'Caller',
                    phone_number: '+15550000003',
                },
                chosenIndex: null,
            },
            directory: [{ id: 'd1', label: 'Directory', number: '+15550000004' }],
            home: { widgets: [], featuredApps: [], settingsSections: [] },
            ...((overrides.payload as Record<string, unknown> | undefined) ?? {}),
        },
        view: {
            activeApp: 'phone',
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

export function flattenText(node: ReactTestRendererJSON | ReactTestRendererJSON[] | null): string {
    if (node == null) {
        return '';
    }
    if (Array.isArray(node)) {
        return node.map((child) => flattenText(child)).join('');
    }
    return (node.children ?? [])
        .map((child) => (typeof child === 'string' ? child : flattenText(child)))
        .join('');
}
