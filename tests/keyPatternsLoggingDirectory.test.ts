import { afterEach, describe, expect, it, vi } from 'vitest';
import { mapDirectory } from '../src/adapters/fullDeviceToSession';
import {} from '../src/state/simulatorSessionInitialState.js';
import type { SimulatorSessionState, SimulatorTemplatePayload } from '../src/types/session';
import {} from '../src/utils/payload/lintSimulatorPayload';
import { keyNamingSuggestion } from '../src/utils/payload/simulatorKeyPatterns';
import {} from '../src/utils/payload/simulatorCapabilities';
import {} from '../src/utils/navigation/simulatorKeyboardCommands';
import {} from '../src/utils/preview/simulatorPreviewReport';
import { logSimulatorTransition } from '../src/utils/telemetry/simulatorTransitionLogger';
import { createPayload, createState } from './support/criticalPathsSupport';

const originalNodeEnv = process.env.NODE_ENV;

const originalWindow = (globalThis as { window?: unknown }).window;

const originalHTMLElement = (globalThis as { HTMLElement?: unknown }).HTMLElement;

afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalWindow === undefined) {
        delete (globalThis as { window?: unknown }).window;
    } else {
        (globalThis as { window?: unknown }).window = originalWindow;
    }
    if (originalHTMLElement === undefined) {
        delete (globalThis as { HTMLElement?: unknown }).HTMLElement;
    } else {
        (globalThis as { HTMLElement?: unknown }).HTMLElement = originalHTMLElement;
    }
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('simulatorKeyPatterns', () => {
    it('covers slug validation and advisory key naming suggestions', () => {
        expect(keyNamingSuggestion('', 'template')).toBe('Key should be non-empty.');
        expect(keyNamingSuggestion('x'.repeat(129), 'contact')).toContain('longer than 128');
        expect(keyNamingSuggestion('x'.repeat(65), 'template')).toContain('exceeds 64');
        expect(keyNamingSuggestion('bad key', 'page')).toContain('spaces');
        expect(keyNamingSuggestion('-bad-key-', 'message')).toContain('leading or trailing hyphen');
        expect(keyNamingSuggestion('12345', 'thread')).toBeNull();
        expect(keyNamingSuggestion('BadKey', 'directory')).toContain('uppercase');
        expect(keyNamingSuggestion('bad_key', 'contact')).toContain('underscores');
        expect(keyNamingSuggestion('good-key', 'template')).toBeNull();
    });
});

describe('logSimulatorTransition', () => {
    it('logs the formatted local view change details when enabled', () => {
        process.env.NODE_ENV = 'development';
        (globalThis as { window?: unknown }).window = {
            __SIMULATOR_LOG_TRANSITIONS__: true,
        };
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const payload: SimulatorTemplatePayload = {
            ...createPayload(),
            browser: {
                defaultPageId: 'landing',
                pages: [
                    {
                        id: 'landing',
                        url: 'https://example.test',
                        title: 'Landing',
                        layout: 'content',
                        buttons: [{ label: 'Pricing', targetPageId: 'pricing' }],
                    },
                    {
                        id: 'pricing',
                        url: 'https://example.test/pricing',
                        title: 'Pricing',
                        layout: 'content',
                        buttons: [],
                    },
                ],
            },
        };
        const prev = createState(payload);
        prev.view.activeApp = 'email';
        const next: SimulatorSessionState = {
            ...prev,
            view: {
                ...prev.view,
                activeApp: 'internet',
                internet: {
                    screen: 'pricing',
                    stack: ['landing'],
                },
            },
        };

        logSimulatorTransition(prev, { type: 'SWITCH_APP', app: 'internet' }, next);

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('SWITCH_APP(internet)'));
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('app email→internet'));
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('internet landing→pricing'),
        );
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('stack=1'));
    });
});

describe('mapDirectory', () => {
    it('filters invalid entries and keeps optional directory fields', () => {
        expect(
            mapDirectory([
                null,
                { id: 'missing-label' },
                {
                    id: 'helpdesk',
                    label: 'Help Desk',
                    contact_id: 'contact-1',
                    number: '555-0100',
                    url: 'https://example.test/help',
                    description: 'Trusted support line',
                },
            ]),
        ).toEqual([
            {
                id: 'helpdesk',
                label: 'Help Desk',
                contact_id: 'contact-1',
                number: '555-0100',
                url: 'https://example.test/help',
                description: 'Trusted support line',
            },
        ]);
    });
});
