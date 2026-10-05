import { getInitialSessionState } from '../../src/state/simulatorSessionInitialState.js';
import type { SimulatorSessionState, SimulatorTemplatePayload } from '../../src/types/session';

export function createPayload(): SimulatorTemplatePayload {
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

export function createState(
    payload: SimulatorTemplatePayload = createPayload(),
): SimulatorSessionState {
    return getInitialSessionState(payload);
}
