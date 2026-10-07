import { createPayload as completePayload } from './support/createPayload.js';
import { describe, expect, it } from 'vitest';
import { getInitialSessionState } from '../src/state/simulatorSessionInitialState.js';
import { simulatorSessionReducer } from '../src/state/simulatorSessionReducer.js';
import type { SimulatorSessionState } from '../src/types/session';
function createPayload(): SimulatorSessionState['payload'] {
    return {
        ...completePayload(),
        channel: 'browser',
        entryPoint: { app: 'internet', screen: 'pricing' },
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
    };
}
describe('simulatorSessionReducer', () => {
    it('uses the entry screen when it exists in browser pages', () => {
        const state = getInitialSessionState(createPayload());
        expect(state.view.activeApp).toBe('internet');
        expect(state.view.internet.screen).toBe('pricing');
    });
    it('falls back to the browser default page when the entry screen is missing', () => {
        const payload: SimulatorSessionState['payload'] = {
            ...createPayload(),
            entryPoint: { app: 'internet', screen: 'missing-page' },
        };
        const state = getInitialSessionState(payload);
        expect(state.view.internet.screen).toBe('landing');
    });
    it('navigates back through browser history using the latest stack entry', () => {
        const initial = getInitialSessionState(createPayload());
        const state: SimulatorSessionState = {
            ...initial,
            view: {
                ...initial.view,
                internet: {
                    screen: 'pricing',
                    stack: ['landing'],
                },
            },
        };
        const next = simulatorSessionReducer(state, { type: 'BACK' });
        expect(next.view.internet.screen).toBe('landing');
        expect(next.view.internet.stack).toEqual([]);
    });
    it('opens internet pages from click_link simulator actions and records prior history', () => {
        const initial = getInitialSessionState(createPayload());
        const state: SimulatorSessionState = {
            ...initial,
            view: {
                ...initial.view,
                activeApp: 'email',
                email: {
                    ...initial.view.email,
                    screen: 'detail',
                },
                internet: {
                    screen: 'landing',
                    stack: [],
                },
            },
        };
        const next = simulatorSessionReducer(state, {
            type: 'SIMULATOR_ACTION',
            action: { type: 'click_link', pageId: 'pricing' },
        });
        expect(next.view.activeApp).toBe('internet');
        expect(next.view.internet.screen).toBe('pricing');
        expect(next.view.internet.stack).toEqual([]);
    });
    it('ignores local navigation requests for inactive apps', () => {
        const initial = getInitialSessionState(createPayload());
        const next = simulatorSessionReducer(initial, {
            type: 'NAV_LOCAL',
            app: 'email',
            screen: 'detail',
        });
        expect(next.view).toEqual(initial.view);
    });
    it('ignores call history selection outside the phone history screen', () => {
        const initial = getInitialSessionState(createPayload());
        const next = simulatorSessionReducer(initial, {
            type: 'SELECT_CALL_HISTORY',
            entryId: 'call-1',
        });
        expect(next.view).toEqual(initial.view);
    });
});
