import { describe, expect, it } from 'vitest';
import type { SimulatorTemplatePayload } from '../src/types/session';
import { lintSimulatorPayload } from '../src/utils/payload/lintSimulatorPayload';
import { runSimulatorRealismChecks } from '../src/utils/payload/simulatorRealismChecks';
import { applyPreviewFallback } from '../src/utils/preview/previewFallbackWorld';
import { buildSimulatorNavGraph } from '../src/utils/navigation/simulatorNavGraph';
import { simBtnToneClass } from '../src/ui/styles/simulatorClasses';
import { validateSimulatorAction } from '../src/utils/telemetry/simulatorActionTaxonomy';
import { mapInternet } from '../src/adapters/device/internetMapper';
import { mapEmail } from '../src/adapters/device/emailMapper';

const base: SimulatorTemplatePayload = {
    templateId: null,
    templateKey: '',
    name: 'Boundary',
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
};
describe('empty entry content diagnostics', () => {
    it.each([
        ['email', 'list'],
        ['email', 'detail'],
        ['messages', 'threads'],
        ['messages', 'thread_detail'],
        ['internet', 'landing'],
        ['home', 'home'],
        ['home', 'store'],
        ['phone', 'incoming_call'],
    ] as const)('diagnoses missing %s/%s content without changing the source', (app, screen) => {
        const payload: SimulatorTemplatePayload = { ...base, entryPoint: { app, screen } };
        const before = structuredClone(payload);
        const lint = lintSimulatorPayload(payload);
        expect(Array.isArray(lint.warnings)).toBe(true);
        const realism = runSimulatorRealismChecks(payload);
        expect(realism.pass).toBe(realism.blockers.length === 0);
        const fallback = applyPreviewFallback(payload);
        expect(fallback.payload).toBeTypeOf('object');
        expect(payload).toEqual(before);
        expect(buildSimulatorNavGraph(payload)).toHaveProperty('nodes');
    });
    it('accepts empty optional home arrays and reports an incomplete caller', () => {
        const home = lintSimulatorPayload({
            ...base,
            entryPoint: { app: 'home', screen: 'home' },
            home: { widgets: [], featuredApps: [], settingsSections: [] },
        });
        expect(home.warnings.length).toBeGreaterThan(0);
        const phone = runSimulatorRealismChecks({
            ...base,
            entryPoint: { app: 'phone', screen: 'incoming_call' },
            phone: { content: { transcript: '', choices: [] }, chosenIndex: null },
        });
        expect(phone.pass).toBe(false);
    });
});
it('leaves an empty internet definition unconfigured', () => {
    const result = mapInternet({});
    expect(result).toBeNull();
});
it('retains optional page content and builds forms without fields', () => {
    const browser = mapInternet({
        pages: [{ id: 'one', url: 'https://example.test', title: 'Form', content: '' }],
        forms: [{ id: 'f', page_id: 'one', fields: [] }],
    });
    expect(browser?.pages[0]?.content).toBeUndefined();
});
it('keeps detail snippets when supplied and accepts omitted ones', () => {
    const withSnippet = mapEmail({
        detail: { id: 'one', subject: 'Hello', from: 'ada', body: 'Body', snippet: 'Preview' },
    });
    expect(withSnippet?.selectedMessage).toMatchObject({ subject: 'Hello' });
    const withoutSnippet = mapEmail({
        detail: { id: 'one', subject: 'Hello', from: 'ada', body: 'Body' },
    });
    expect(withoutSnippet?.selectedMessage).toMatchObject({ subject: 'Hello' });
});
it('normalizes default and custom button tones and rejects unknown action names', () => {
    expect(simBtnToneClass()).toContain('neutral');
    expect(simBtnToneClass('primary-outline')).toContain('primary-outline');
    expect(validateSimulatorAction({ type: 'not-an-action' })).toBe(false);
});

it('keeps unsupported message deep links on the current screen and falls back for missing browser pages', async () => {
    const { applyDeepLinkToState } = await import('../src/utils/navigation/simulatorDeepLink.js');
    const { getInitialSessionState } = await import('../src/state/simulatorSessionInitialState.js');
    const state = getInitialSessionState(base);
    const message = applyDeepLinkToState(state, { app: 'messages', screen: 'unknown' });
    expect(message.view.messages.screen).toBe(state.view.messages.screen);
    const browser = applyDeepLinkToState(state, { app: 'internet', pageId: 'missing' });
    expect(browser.view.internet.screen).toBe('landing');
});
