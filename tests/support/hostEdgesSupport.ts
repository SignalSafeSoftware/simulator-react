import { createPayload } from '../support/createPayload.js';
import type { SimulatorTemplatePayload } from '../../src/types/session';

export function payload(overrides: Partial<SimulatorTemplatePayload>): SimulatorTemplatePayload {
    return createPayload({
        templateId: null,
        templateKey: 'test',
        name: 'Test',
        channel: 'phone',
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
    });
}
