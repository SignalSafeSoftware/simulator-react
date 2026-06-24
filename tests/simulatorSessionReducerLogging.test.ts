import { describe, expect, it, vi } from 'vitest';

const mockLogging = vi.hoisted(() => ({
    enabled: false,
    logSimulatorTransition: vi.fn(),
}));

vi.mock('../src/utils/simulatorTransitionLogger', () => ({
    isSimulatorTransitionLoggingEnabled: () => mockLogging.enabled,
    logSimulatorTransition: mockLogging.logSimulatorTransition,
}));

describe('simulatorSessionReducerWithLogging', () => {
    it('logs transitions only when transition logging is enabled', async () => {
        const { getInitialSessionState, simulatorSessionReducerWithLogging } = await import('../src/state/simulatorSessionReducer');

        const state = getInitialSessionState({
            templateId: null,
            templateKey: 'logging-template',
            name: 'Logging Template',
            channel: 'email',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'email', screen: 'list' },
            browser: { defaultPageId: 'landing', pages: [] },
            email: {
                inbox: [{ id: 'm1', subject: 'Alert', from: 'alerts@example.test' }],
                selectedMessage: null,
                selectedMessageId: null,
            },
        } as never);

        mockLogging.enabled = false;
        mockLogging.logSimulatorTransition.mockClear();
        simulatorSessionReducerWithLogging(state, { type: 'SELECT_EMAIL', messageId: 'm1' });
        expect(mockLogging.logSimulatorTransition).not.toHaveBeenCalled();

        mockLogging.enabled = true;
        const next = simulatorSessionReducerWithLogging(state, { type: 'SELECT_EMAIL', messageId: 'm1' });
        expect(mockLogging.logSimulatorTransition).toHaveBeenCalledWith(
            state,
            { type: 'SELECT_EMAIL', messageId: 'm1' },
            next
        );
    });
});
