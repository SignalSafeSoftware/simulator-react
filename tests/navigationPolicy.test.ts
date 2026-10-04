import { expect, it } from 'vitest';
import { shouldHideSimulatorNavigation } from '../src/utils/simulatorNavigationPolicy.js';
import { getInitialSessionState } from '../src/state/simulatorSessionInitialState.js';
import type { SimulatorTemplatePayload } from '../src/types/session.js';

const payload: SimulatorTemplatePayload = {
    templateKey: 'policy',
    templateId: null,
    name: 'Policy fixture',
    channel: 'email',
    runId: null,
    attemptId: null,
    topicTags: [],
    entryPoint: { app: 'email', screen: 'detail' },
    device: null,
    email: null,
    sms: null,
    browser: null,
    phone: null,
    contacts: [],
    directory: null,
    home: null,
};
it('makes host detail controls and scenario inline controls explicit policies', () => {
    const { view } = getInitialSessionState(payload);
    expect(shouldHideSimulatorNavigation(view, 'host')).toBe(false);
    expect(shouldHideSimulatorNavigation(view, 'scenario')).toBe(true);
    view.email.screen = 'list';
    expect(shouldHideSimulatorNavigation(view, 'host')).toBe(false);
    expect(shouldHideSimulatorNavigation(view, 'scenario')).toBe(false);
    expect(shouldHideSimulatorNavigation(null, 'host')).toBe(true);
});
