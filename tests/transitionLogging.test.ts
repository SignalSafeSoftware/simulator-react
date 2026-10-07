import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    isSimulatorTransitionLoggingEnabled,
    logSimulatorTransition,
} from '../src/utils/telemetry/simulatorTransitionLogger';
import { createState } from './support/utilityTailSupport';

const originalNodeEnv = process.env.NODE_ENV;

const originalWindow = (globalThis as { window?: unknown }).window;

const originalLocalStorage = (globalThis as { localStorage?: unknown }).localStorage;

afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalWindow === undefined) {
        delete (globalThis as { window?: unknown }).window;
    } else {
        (globalThis as { window?: unknown }).window = originalWindow;
    }
    if (originalLocalStorage === undefined) {
        delete (globalThis as { localStorage?: unknown }).localStorage;
    } else {
        (globalThis as { localStorage?: unknown }).localStorage = originalLocalStorage;
    }
    vi.restoreAllMocks();
});

describe('transition logging', () => {
    it('covers transition logging enablement and formatted change output', () => {
        process.env.NODE_ENV = 'production';
        (globalThis as { window?: unknown }).window = { __SIMULATOR_LOG_TRANSITIONS__: true };
        expect(isSimulatorTransitionLoggingEnabled()).toBe(false);

        process.env.NODE_ENV = 'development';
        (globalThis as { window?: unknown }).window = {};
        (globalThis as { localStorage?: unknown }).localStorage = {
            getItem: () => '1',
        };
        expect(isSimulatorTransitionLoggingEnabled()).toBe(true);

        (globalThis as { localStorage?: unknown }).localStorage = {
            getItem: () => {
                throw new Error('blocked');
            },
        };
        expect(isSimulatorTransitionLoggingEnabled()).toBe(false);

        (globalThis as { window?: unknown }).window = { __SIMULATOR_LOG_TRANSITIONS__: true };
        (globalThis as { localStorage?: unknown }).localStorage = {
            getItem: () => null,
        };
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const prev = createState({
            view: {
                activeApp: 'email',
                email: { screen: 'list', stack: [], selectedMessageId: null },
                messages: { screen: 'threads', stack: [], visibleCount: 0 },
                internet: { screen: 'landing', stack: [] },
                phone: { screen: 'history', stack: [], chosenIndex: null },
                home: { screen: 'home' },
                contactsPanelOpen: false,
            },
        });
        const next = createState({
            view: {
                activeApp: 'phone',
                email: { screen: 'detail', stack: ['list'], selectedMessageId: 'm1' },
                messages: { screen: 'thread_detail', stack: ['threads'], visibleCount: 2 },
                internet: { screen: 'pricing', stack: ['landing'] },
                phone: { screen: 'directory', stack: ['history'], chosenIndex: 1 },
                home: { screen: 'settings' },
                contactsPanelOpen: true,
            },
        });

        logSimulatorTransition(
            prev,
            {
                type: 'SIMULATOR_ACTION',
                action: { type: 'navigate_screen', app: 'internet', screen: 'pricing' },
            },
            next,
        );
        logSimulatorTransition(prev, { type: 'NAV_LOCAL', app: 'phone', screen: 'contacts' }, next);
        logSimulatorTransition(prev, { type: 'BROWSER_SCREEN', screen: 'pricing' }, next);
        logSimulatorTransition(prev, { type: 'SELECT_EMAIL', messageId: 'm1' }, next);
        logSimulatorTransition(prev, { type: 'SWITCH_APP', app: 'phone' }, next);
        logSimulatorTransition(prev, { type: 'PHONE_CHOOSE', index: 1 }, next);
        logSimulatorTransition(
            prev,
            { type: 'SIMULATOR_ACTION', action: { type: 'open_email', messageId: 'm1' } },
            next,
        );
        logSimulatorTransition(
            prev,
            { type: 'SIMULATOR_ACTION', action: { type: 'open_thread', threadId: 't1' } },
            next,
        );
        logSimulatorTransition(
            prev,
            { type: 'SIMULATOR_ACTION', action: { type: 'open_page', pageId: 'pricing' } },
            next,
        );
        logSimulatorTransition(prev, { type: 'BACK' }, prev);

        const logged = consoleSpy.mock.calls.map(([line]) => String(line)).join('\n');
        expect(logged).toContain('SIMULATOR_ACTION(navigate_screen internet/pricing)');
        expect(logged).toContain('NAV_LOCAL(phone/contacts)');
        expect(logged).toContain('BROWSER_SCREEN(pricing)');
        expect(logged).toContain('SELECT_EMAIL(m1)');
        expect(logged).toContain('SWITCH_APP(phone)');
        expect(logged).toContain('PHONE_CHOOSE(1)');
        expect(logged).toContain('SIMULATOR_ACTION(open_email m1)');
        expect(logged).toContain('SIMULATOR_ACTION(open_thread t1)');
        expect(logged).toContain('SIMULATOR_ACTION(open_page pricing)');
        expect(logged).toContain('contactsPanel=true');
        expect(logged).toContain('visibleCount=2');
        expect(logged).toContain('chosenIndex=1');
        expect(logged).toContain('[Phone → Directory]');
    });

    it('covers transition logger fallback action formatting and no-op transitions', () => {
        process.env.NODE_ENV = 'development';
        (globalThis as { window?: unknown }).window = { __SIMULATOR_LOG_TRANSITIONS__: true };
        (globalThis as { localStorage?: unknown }).localStorage = {
            getItem: () => null,
        };

        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const prev = createState({
            view: {
                activeApp: 'bogus' as never,
                email: { screen: 'list', stack: [], selectedMessageId: null },
                messages: { screen: 'threads', stack: [], visibleCount: 0 },
                internet: { screen: 'landing', stack: [] },
                phone: { screen: 'history', stack: [], chosenIndex: null },
                home: { screen: 'home' },
                contactsPanelOpen: false,
            },
        });
        const emailNext = createState({
            view: {
                activeApp: 'email',
                email: { screen: 'detail', stack: ['list'], selectedMessageId: 'm1' },
                messages: { screen: 'thread_detail', stack: ['threads'], visibleCount: 3 },
                internet: { screen: 'landing', stack: [] },
                phone: { screen: 'history', stack: [], chosenIndex: null },
                home: { screen: 'settings' },
                contactsPanelOpen: true,
            },
        });

        logSimulatorTransition(
            prev,
            { type: 'SIMULATOR_ACTION', action: { type: 'report' } },
            emailNext,
        );
        logSimulatorTransition(emailNext, { type: 'SELECT_EMAIL', messageId: null }, emailNext);
        logSimulatorTransition(
            emailNext,
            { type: 'SELECT_CALL_HISTORY', entryId: 'call-1' },
            emailNext,
        );
        logSimulatorTransition(
            emailNext,
            { type: 'SELECT_CALL_HISTORY', entryId: null },
            emailNext,
        );
        logSimulatorTransition(emailNext, { type: 'UNKNOWN_ACTION' }, emailNext as never);

        const logged = consoleSpy.mock.calls.map(([line]) => String(line)).join('\n');
        expect(logged).toContain('SIMULATOR_ACTION(report)');
        expect(logged).toContain('SELECT_EMAIL(null)');
        expect(logged).toContain('SELECT_CALL_HISTORY(call-1)');
        expect(logged).toContain('SELECT_CALL_HISTORY(null)');
        expect(logged).toContain('bogus/?');
        expect(logged).toContain('app bogus→email');
        expect(logged).toContain('email list→detail');
        expect(logged).toContain('msg=m1');
        expect(logged).toContain('contactsPanel=true');
        expect(logged).toContain('visibleCount=3');
        expect(logged).toContain('UNKNOWN_ACTION');
        expect(logged).toContain('[Email → Message]');
    });

    it('covers remaining transition logger branches for disabled flags and messages/home transitions', () => {
        process.env.NODE_ENV = 'development';
        delete (globalThis as { window?: unknown }).window;
        expect(isSimulatorTransitionLoggingEnabled()).toBe(false);

        (globalThis as { window?: unknown }).window = {};
        (globalThis as { localStorage?: unknown }).localStorage = {
            getItem: () => null,
        };
        expect(isSimulatorTransitionLoggingEnabled()).toBe(false);

        (globalThis as { window?: unknown }).window = { __SIMULATOR_LOG_TRANSITIONS__: true };
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        const messagesPrev = createState({
            view: {
                activeApp: 'messages',
                messages: { screen: 'threads', stack: [], visibleCount: 0 },
                home: { screen: 'home' },
            },
        });
        const messagesNext = createState({
            view: {
                activeApp: 'messages',
                messages: { screen: 'thread_detail', stack: ['threads'], visibleCount: 4 },
                home: { screen: 'home' },
            },
        });
        const homeNext = createState({
            view: {
                activeApp: 'home',
                messages: { screen: 'thread_detail', stack: ['threads'], visibleCount: 4 },
                home: { screen: 'settings' },
            },
        });

        logSimulatorTransition(
            messagesPrev,
            { type: 'SIMULATOR_ACTION', action: { type: 'open_thread', threadId: 't2' } },
            messagesNext,
        );
        logSimulatorTransition(messagesNext, { type: 'SWITCH_APP', app: 'home' }, homeNext);

        const logged = consoleSpy.mock.calls.map(([line]) => String(line)).join('\n');
        expect(logged).toContain('messages/threads → messages/thread_detail');
        expect(logged).toContain('messages threads→thread_detail');
        expect(logged).toContain('visibleCount=4');
        expect(logged).toContain('home/settings');
        expect(logged).toContain('app messages→home');
        expect(logged).toContain('home home→settings');
    });

    it('covers logger no-op when console.log is unavailable', () => {
        process.env.NODE_ENV = 'development';
        (globalThis as { window?: unknown }).window = { __SIMULATOR_LOG_TRANSITIONS__: true };

        const originalLog = console.log;
        Object.defineProperty(console, 'log', {
            configurable: true,
            value: undefined,
        });

        try {
            const state = createState();
            expect(() =>
                logSimulatorTransition(state, { type: 'SWITCH_APP', app: 'email' }, state),
            ).not.toThrow();
        } finally {
            Object.defineProperty(console, 'log', {
                configurable: true,
                value: originalLog,
            });
        }
    });
});
