import { describe, expect, it } from 'vitest';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import { getInitialSessionState } from '../src/state/simulatorSessionInitialState.js';
import { templateDetailToPayload } from '../src/adapters/templateToSession.js';
import {
    parseSimulatorSearchParams,
    applyDeepLinkToState,
} from '../src/utils/navigation/simulatorDeepLink.js';
import { analyzeReachability } from '../src/utils/navigation/simulatorReachability.js';

describe('shared app IDs through the runtime', () => {
    it.each(Object.values(SimulatorApp))(
        'round-trips %s through payloads, links and navigation',
        (app) => {
            const payload = templateDetailToPayload({
                id: 1,
                key: 'app-ids',
                name: 'App IDs',
                channel: 'email',
                is_master: true,
                is_active: true,
                company: null,
                created_on: '',
                updated_on: '',
                description: '',
                content_json: {},
                thread_id: null,
                reply_to_message: null,
                attachment_name: '',
                attachment_type: '',
                attachment_behavior: '',
                messages: [],
                simulator: {
                    entry_point: { app, screen: 'list' },
                    device: {
                        main_menu_items: Object.values(SimulatorApp).map((id) => ({
                            id,
                            label: id,
                        })),
                    },
                },
            });
            const state = getInitialSessionState(payload);
            expect(state.view.activeApp).toBe(app);
            const link = parseSimulatorSearchParams(
                new URLSearchParams({ app: app.toUpperCase() }),
            );
            expect(link?.app).toBe(app);
            if (link === null) throw new Error('Expected a valid deep link');
            expect(applyDeepLinkToState(state, link).view.activeApp).toBe(app);
            expect(analyzeReachability(payload).reachableApps).toContain(app);
        },
    );

    it.each(['sms', 'browser', 'PhoneApp', '__proto__'])('rejects %s as a deep-link app', (app) => {
        expect(parseSimulatorSearchParams(new URLSearchParams({ app }))).toBeNull();
    });
});
