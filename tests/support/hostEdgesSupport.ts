import { createPayload } from '../support/createPayload.js';
import {} from '../../src/contract/capabilities';
import {} from '../../src/views/phone/PhoneCallView.js';
import {} from '../../src/state/simulatorSessionInitialState.js';
import {} from '../../src/actions/simulatorActions.js';
import {} from '../../src/contract/navigation';
import type { SimulatorTemplatePayload } from '../../src/types/session';
import {} from '../../src/datasource/datasource';

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
