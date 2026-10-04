import type { SimulatorTemplatePayload } from '../../src/types/session.js';
export function createPayload(
    overrides: Partial<SimulatorTemplatePayload> = {},
): SimulatorTemplatePayload {
    return {
        templateId: null,
        templateKey: 'test',
        name: 'Test',
        channel: 'email',
        topicTags: [],
        runId: null,
        attemptId: null,
        entryPoint: null,
        device: null,
        email: null,
        sms: null,
        browser: null,
        phone: null,
        contacts: null,
        directory: null,
        home: null,
        ...overrides,
    };
}
