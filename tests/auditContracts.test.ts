import { describe, expect, it } from 'vitest';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import {
    SimulatorEmailScreenId,
    SimulatorMessagesScreenId,
    SimulatorPhoneScreenId,
    type SimulatorDevicePayload,
} from '@signalsafe/simulator-core/devicePayload';
import { fullDeviceToPayload } from '../src/adapters/deviceToSession.js';
import { getInitialSessionState } from '../src/state/simulatorSessionInitialState.js';
import {
    applyDeepLinkToState,
    parseSimulatorSearchParams,
} from '../src/utils/navigation/simulatorDeepLink.js';
import { analyzeReachability } from '../src/utils/navigation/simulatorReachability.js';
import { buildSimulatorNavGraph } from '../src/utils/navigation/simulatorNavGraph.js';
import type { SimulatorBrowserPage } from '../src/types/session.js';

const entry = (app: SimulatorApp, screen: string): SimulatorDevicePayload => ({
    entry_point: { app, screen },
});

describe('audited conversion and navigation contracts', () => {
    for (const [app, screens] of [
        [SimulatorApp.Email, Object.values(SimulatorEmailScreenId)],
        [SimulatorApp.Messages, Object.values(SimulatorMessagesScreenId)],
        [SimulatorApp.Phone, Object.values(SimulatorPhoneScreenId)],
    ] as const) {
        it.each(screens)(`${app}/%s survives startup and deep linking`, (screen) => {
            const initial = getInitialSessionState(fullDeviceToPayload(entry(app, screen)));
            expect(initial.view[app].screen).toBe(screen);
            const link = parseSimulatorSearchParams(new URLSearchParams({ app, screen }));
            expect(link).not.toBeNull();
            if (!link) throw new Error('Expected supported deep link');
            const base = getInitialSessionState(
                fullDeviceToPayload(entry(SimulatorApp.Home, 'home')),
            );
            expect(applyDeepLinkToState(base, link).view[app].screen).toBe(screen);
        });
    }
    it('preserves secondary defaults without a main menu', () => {
        expect(
            fullDeviceToPayload({
                ...entry(SimulatorApp.Home, 'home'),
                device: { secondary_defaults: { phone: 'contacts' } },
            }).device,
        ).toEqual({ mainMenuItems: [], secondaryDefaults: { phone: 'contacts' } });
    });
    it('preserves browser navigation and presentation fields', () => {
        const payload = fullDeviceToPayload({
            ...entry(SimulatorApp.Internet, 'Landing'),
            internet: {
                pages: [
                    {
                        id: 'Landing',
                        title: 'Welcome',
                        url: 'https://example.test',
                        buttons: [
                            { label: 'Continue', target_page_id: 'Next' },
                            { label: 'Other', target_page_id: 'Other' },
                        ],
                        logo_url: '/logo.png',
                        warning_banner: 'Check this page',
                        show_media_placeholder: true,
                    },
                ],
            },
        });
        expect(payload.browser?.pages[0]).toMatchObject({
            buttons: [
                { label: 'Continue', targetPageId: 'Next' },
                { label: 'Other', targetPageId: 'Other' },
            ],
            logoUrl: '/logo.png',
            warningBanner: 'Check this page',
            showMediaPlaceholder: true,
        });
    });
    it.each([
        { history: [{ id: 'old', number: '123' }] },
        { voicemail: { transcript: 'Retain me', caller_name: 'Caller' } },
    ])('preserves phone data without an incoming call', (phone) => {
        const payload = fullDeviceToPayload({ ...entry(SimulatorApp.Phone, 'history'), phone });
        expect(payload.phone).not.toBeNull();
        expect(payload.phone?.content).toBeNull();
        if ('history' in phone) expect(payload.phone?.callHistory?.[0]?.id).toBe('old');
        if ('voicemail' in phone) expect(payload.phone?.voicemailTranscript).toBe('Retain me');
    });
    it('preserves case-sensitive page identifiers', () => {
        const payload = fullDeviceToPayload({
            ...entry(SimulatorApp.Internet, 'CaseSensitive'),
            internet: {
                pages: [
                    { id: 'first', title: 'First', url: 'https://example.test/first' },
                    { id: 'CaseSensitive', title: 'Target', url: 'https://example.test/target' },
                ],
            },
        });
        expect(getInitialSessionState(payload).view.internet.screen).toBe('CaseSensitive');
        expect(analyzeReachability(payload).reachableScreens.internet).toContain('CaseSensitive');
    });
    function graph(pages: SimulatorBrowserPage[]) {
        const payload = fullDeviceToPayload(entry(SimulatorApp.Internet, 'a'));
        payload.browser = { defaultPageId: 'a', pages };
        return payload;
    }
    const page = (id: string, targets: string[] = []): SimulatorBrowserPage => ({
        id,
        title: id,
        url: `https://example.test/${id}`,
        layout: 'content',
        buttons: targets.map((targetPageId) => ({ label: targetPageId, targetPageId })),
    });
    it('distinguishes converging paths from cycles and ignores nonexistent targets', () => {
        const pages = [
            page('a', ['b', 'c', 'missing']),
            page('b', ['d']),
            page('c', ['d']),
            page('d'),
        ];
        const report = analyzeReachability(graph(pages));
        expect(report.browserHasCycle).toBe(false);
        expect(new Set(report.reachableScreens.internet)).toEqual(new Set(['a', 'b', 'c', 'd']));
        pages[3] = page('d', ['a']);
        expect(analyzeReachability(graph(pages)).browserHasCycle).toBe(true);
    });
    it.each(['login', 'landing', 'centered', 'split'])(
        'follows rendered %s form submissions in both reports',
        (layout) => {
            const payload = graph([
                {
                    ...page('a'),
                    layout,
                    formFields: [{ name: 'email', label: 'Email', type: 'email' }],
                    submitTargetPageId: 'b',
                },
                page('b'),
            ]);
            expect(analyzeReachability(payload).reachableScreens.internet).toEqual(['a', 'b']);
            expect(buildSimulatorNavGraph(payload).edges).toContainEqual(
                expect.objectContaining({
                    from: 'internet:a',
                    to: 'internet:b',
                    action: 'form_submit',
                }),
            );
        },
    );
});
