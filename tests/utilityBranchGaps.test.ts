import { afterEach, describe, expect, it, vi } from 'vitest';
import { getInitialSessionState } from '../src/state/simulatorSessionInitialState';
import { parseEntryScreen } from '../src/state/simulatorViewStateHelpers';
import { resolveSimulatorDeveloperTools } from '../src/developer-tools/configuration';
import { getScreenMetadata } from '../src/utils/navigation/screenMetadata';
import { buildSimulatorNavGraph } from '../src/utils/navigation/simulatorNavGraph';
import { analyzeReachability } from '../src/utils/navigation/simulatorReachability';
import { diffSimulatorPayloads } from '../src/utils/payload/simulatorPayloadDiff';
import { lintSimulatorPayload } from '../src/utils/payload/lintSimulatorPayload';
import { runSimulatorRealismChecks } from '../src/utils/payload/simulatorRealismChecks';
import { applyPreviewFallback } from '../src/utils/preview/previewFallbackWorld';
import { buildSimulatorPreviewReport } from '../src/utils/preview/simulatorPreviewReport';
import { logSimulatorTransition } from '../src/utils/telemetry/simulatorTransitionLogger';
import {
    mapDirectory,
    mapEmail,
    mapInternet,
    mapMessages,
} from '../src/adapters/fullDeviceToSession';
import { createPayload } from './support/createPayload';

const payloadOf = (overrides: Record<string, unknown>) => createPayload(overrides as never);

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
});

describe('adapter fallbacks', () => {
    it('returns null for directories without valid entries', () => {
        expect(mapDirectory([{ id: 'only-id' }, null])).toBeNull();
    });

    it('files unlabelled email rows into the inbox', () => {
        const email = mapEmail({
            messages: [{ id: 'm1', subject: 'Hello', from: 'a@example.test' }],
        } as never);
        expect(email?.inbox).toHaveLength(1);
    });

    it('preserves message ids when present', () => {
        const sms = mapMessages({
            thread_detail: { messages: [{ id: 'x1', from: 'me', text: 'hi' }] },
        } as never);
        expect(sms?.thread.messages[0]).toMatchObject({ id: 'x1', from: 'me' });
    });

    it('keeps page content and rejects the removed button field', () => {
        const browser = mapInternet({
            pages: [{ id: 'p', url: 'https://example.test', title: 'T', content: 'Hello' }],
        } as never);
        expect(browser?.pages[0]?.content).toBe('Hello');
        expect(() =>
            mapInternet({
                pages: [{ id: 'p', buttons: [{ label: 'Go', targetPageId: 'q' }] }],
            } as never),
        ).toThrow('target_page_id');
    });
});

describe('navigation fallbacks', () => {
    it('falls back to the default internet screen when no browser exists', () => {
        const graph = buildSimulatorNavGraph(
            payloadOf({
                entryPoint: { app: 'internet', screen: null },
                device: { mainMenuItems: [{ id: 'email' }, { id: 'internet' }] },
            }),
        );
        expect(graph.entry.app).toBe('internet');
    });

    it('ignores links to pages without ids and edges to unreachable pages', () => {
        const graph = buildSimulatorNavGraph(
            payloadOf({
                entryPoint: { app: 'email', screen: 'detail' },
                device: { mainMenuItems: [{ id: 'email' }, { id: 'internet' }] },
                email: {
                    inbox: [{ id: 'm1', links: [{ href: 'https://nowhere.test' }] }],
                    selectedMessage: null,
                    selectedMessageId: null,
                },
                browser: {
                    defaultPageId: 'a',
                    pages: [{ buttons: [] }, { id: 'a', buttons: [{ targetPageId: 'missing' }] }],
                },
            }),
        );
        expect(graph.edges.some((edge) => edge.action === 'click_link')).toBe(false);
    });

    it('tolerates sparse email, messaging, browser and contact payloads', () => {
        const base = {
            entryPoint: { app: 'email', screen: 'list' },
            device: {
                mainMenuItems: [
                    { id: 'email' },
                    { id: 'messages' },
                    { id: 'internet' },
                    { id: 'phone' },
                ],
            },
        };
        const sparse = analyzeReachability(
            payloadOf({ ...base, email: {}, sms: {}, browser: {}, contacts: [{}] }),
        );
        expect(sparse.reachableScreens.email).toEqual(['list']);
        expect(sparse.reachableEntities.contacts).toEqual([]);

        const rows = analyzeReachability(
            payloadOf({ ...base, email: { inbox: [{}, { id: 'a' }] } }),
        );
        expect(rows.reachableEntities.inboxMessageIds).toEqual(['a']);

        const unnamed = analyzeReachability(
            payloadOf({ ...base, browser: { pages: [{ url: 'x' }, { id: 'b' }] } }),
        );
        expect(unnamed.reachableScreens.internet).toEqual([]);
    });

    it('describes unknown home screens by their id', () => {
        const state = getInitialSessionState(
            createPayload({ entryPoint: { app: 'home', screen: 'home' } } as never),
        );
        const view = { ...state.view, activeApp: 'home', home: { screen: 'mystery' } };
        expect(getScreenMetadata(view as never, state.payload).label).toBe('Home → mystery');
    });
});

describe('payload analysis fallbacks', () => {
    it('lints entry points that have content and sparse records', () => {
        const messaging = lintSimulatorPayload(
            payloadOf({
                entryPoint: { app: 'messages', screen: 'threads' },
                sms: { thread: { messages: [{ from: 'them', text: 'hi' }] } },
            }),
        );
        expect(messaging.warnings.map((warning) => warning.code)).not.toContain('entry_app_empty');

        const home = lintSimulatorPayload(
            payloadOf({
                entryPoint: { app: 'home', screen: 'home' },
                home: { widgets: [{ type: 'clock' }], featuredApps: [] },
            }),
        );
        expect(home.warnings.map((warning) => warning.code)).not.toContain('entry_app_empty');

        const sparse = lintSimulatorPayload(
            payloadOf({
                browser: { pages: [{ id: 'p', content: '' }] },
                contacts: [{ display_name: 'No id' }],
                directory: [{ label: 'No id' }],
                email: { inbox: [{ subject: 'No id' }] },
            }),
        );
        expect(sparse.warnings.length).toBeGreaterThan(0);
    });

    it('checks realism for sparse pages and incoming calls', () => {
        const pages = runSimulatorRealismChecks(
            payloadOf({ browser: { pages: [{ id: 'p', content: 'x' }] } }),
        );
        expect(pages).toBeDefined();
        const call = runSimulatorRealismChecks(
            payloadOf({
                entryPoint: { app: 'phone', screen: 'incoming_call' },
                phone: { content: { phone_number: '555-0100' } },
            }),
        );
        expect(call).toBeDefined();
    });

    it('ignores unchanged defaults and removals-only when diffing', () => {
        const same = {
            device: {
                secondary_defaults: { email: 'list', phone: 'history' },
                main_menu_items: [],
            },
        };
        const changed = {
            device: {
                secondary_defaults: { email: 'list', phone: 'contacts' },
                main_menu_items: [],
            },
        };
        const defaults = diffSimulatorPayloads(same, changed);
        expect(JSON.stringify(defaults)).toContain('phone: ');
        expect(JSON.stringify(defaults)).not.toContain('email: ');

        const removal = diffSimulatorPayloads(
            { contacts: [{ id: 'a' }, { id: 'b' }] },
            { contacts: [{ id: 'a' }] },
        );
        expect(removal.find((item) => item.section === 'contacts')?.detail).toContain('-');
    });
});

describe('preview fallbacks', () => {
    it('adds placeholder content for entry points whose content is sparse', () => {
        const detail = applyPreviewFallback(
            payloadOf({
                entryPoint: { app: 'email', screen: 'detail' },
                email: { selectedMessage: null },
            }),
        );
        expect(detail.fallbackApplied).toBe(true);
        const list = applyPreviewFallback(
            payloadOf({ entryPoint: { app: 'email', screen: 'list' }, email: {} }),
        );
        expect(list.fallbackApplied).toBe(true);
        const browser = applyPreviewFallback(
            payloadOf({ entryPoint: { app: 'internet', screen: 'landing' }, browser: {} }),
        );
        expect(browser.fallbackApplied).toBe(true);
    });

    it('builds a report for payloads without browser pages', () => {
        const report = buildSimulatorPreviewReport(createPayload());
        expect(report.browserPagesCount).toBe(0);
        expect(report.browserHasCycle).toBe(false);
    });
});

describe('transition logging gaps', () => {
    const enable = () => {
        vi.stubEnv('NODE_ENV', 'development');
        vi.stubGlobal('window', { __SIMULATOR_LOG_TRANSITIONS__: true });
        return vi.spyOn(console, 'log').mockImplementation(() => {});
    };

    it('omits message and stack details when they did not change', () => {
        const log = enable();
        const state = getInitialSessionState(createPayload());
        const prev = { ...state, view: { ...state.view, activeApp: 'email' } };
        const email = {
            ...state,
            view: {
                ...state.view,
                activeApp: 'email',
                email: { ...state.view.email, screen: 'detail', selectedMessageId: null },
            },
        };
        logSimulatorTransition(prev as never, { type: 'BACK' }, email as never);
        const internet = {
            ...state,
            view: {
                ...state.view,
                activeApp: 'internet',
                internet: { ...state.view.internet, screen: 'other' },
            },
        };
        logSimulatorTransition(
            { ...state, view: { ...state.view, activeApp: 'internet' } } as never,
            { type: 'BACK' },
            internet as never,
        );
        const lines = log.mock.calls.map(([line]) => String(line)).join('\n');
        expect(lines).toContain('email list→detail');
        expect(lines).not.toContain('msg=');
        expect(lines).not.toContain('stack=');
    });
});

describe('simplified helpers', () => {
    it('parses entry screens case-insensitively and falls back to defaults', () => {
        expect(parseEntryScreen('email' as never, 'DETAIL')).toBe('detail');
        expect(parseEntryScreen('phone' as never, 'nope')).toBeTruthy();
    });

    it('enables developer tools from presets and explicit sections', () => {
        expect(resolveSimulatorDeveloperTools().enabled).toBe(false);
        expect(resolveSimulatorDeveloperTools({ sections: { summary: true } }).enabled).toBe(true);
    });
});
