import { describe, expect, it, vi } from 'vitest';
import { focusSimulatorSearch, handleSimulatorKeyboard, SIMULATOR_LIST_NAV_EVENT } from '../src/utils/simulatorKeyboardCommands';

describe('simulator keyboard extra coverage', () => {
    it('returns help for question-mark and ignores unknown app-switch keys', () => {
        const handlers = {
            onBack: vi.fn(),
            onSwitchApp: vi.fn(),
            onFocusSearch: vi.fn(),
        };

        const helpResult = handleSimulatorKeyboard(
            {
                key: '?',
                altKey: false,
                ctrlKey: false,
                metaKey: false,
                target: null,
                preventDefault: vi.fn(),
            } as never,
            handlers,
            { activeApp: 'email', activeScreen: 'list' }
        );
        expect(helpResult).toEqual({ handled: true, showHelp: true });

        const ignoredResult = handleSimulatorKeyboard(
            {
                key: '9',
                altKey: true,
                ctrlKey: false,
                metaKey: false,
                target: null,
                preventDefault: vi.fn(),
            } as never,
            handlers,
            { activeApp: 'email', activeScreen: 'list' }
        );
        expect(ignoredResult).toEqual({ handled: false });
    });

    it('safely focuses search and dispatches list-nav fallback events', () => {
        const focus = vi.fn();
        const dispatchEvent = vi.fn();
        const querySelector = vi.fn(() => ({ focus }));
        const originalDocument = globalThis.document;
        const originalCustomEvent = (globalThis as { CustomEvent?: unknown }).CustomEvent;

        (globalThis as { document?: unknown }).document = {
            querySelector,
            dispatchEvent,
        } as never;
        (globalThis as { CustomEvent?: unknown }).CustomEvent = class {
            type: string;
            detail: unknown;
            constructor(type: string, init?: { detail?: unknown }) {
                this.type = type;
                this.detail = init?.detail;
            }
        };

        try {
            focusSimulatorSearch();
            expect(focus).toHaveBeenCalledTimes(1);

            const result = handleSimulatorKeyboard(
                {
                    key: 'ArrowDown',
                    altKey: true,
                    ctrlKey: false,
                    metaKey: false,
                    target: null,
                    preventDefault: vi.fn(),
                } as never,
                {
                    onBack: vi.fn(),
                    onSwitchApp: vi.fn(),
                    onFocusSearch: vi.fn(),
                },
                { activeApp: 'email', activeScreen: 'list' }
            );

            expect(result).toEqual({ handled: true });
            expect(dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({ type: SIMULATOR_LIST_NAV_EVENT })
            );
        } finally {
            (globalThis as { document?: Document }).document = originalDocument;
            (globalThis as { CustomEvent?: unknown }).CustomEvent = originalCustomEvent;
        }
    });

    it('no-ops when focusing search and no matching element exists', () => {
        const querySelector = vi.fn(() => null);
        const originalDocument = globalThis.document;

        (globalThis as { document?: unknown }).document = { querySelector } as never;
        try {
            expect(() => focusSimulatorSearch()).not.toThrow();
            expect(querySelector).toHaveBeenCalledWith('[data-simulator-search]');
        } finally {
            (globalThis as { document?: Document }).document = originalDocument;
        }
    });

    it('ignores slash outside the phone contacts screen', () => {
        const onFocusSearch = vi.fn();

        const result = handleSimulatorKeyboard(
            {
                key: '/',
                altKey: false,
                ctrlKey: false,
                metaKey: false,
                target: null,
                preventDefault: vi.fn(),
            } as never,
            {
                onBack: vi.fn(),
                onSwitchApp: vi.fn(),
                onFocusSearch,
            },
            { activeApp: 'email', activeScreen: 'list' }
        );

        expect(result).toEqual({ handled: false });
        expect(onFocusSearch).not.toHaveBeenCalled();
    });

    it('routes ArrowUp list navigation through the explicit handler when provided', () => {
        const onListNav = vi.fn();

        const result = handleSimulatorKeyboard(
            {
                key: 'ArrowUp',
                altKey: true,
                ctrlKey: false,
                metaKey: false,
                target: null,
                preventDefault: vi.fn(),
            } as never,
            {
                onBack: vi.fn(),
                onSwitchApp: vi.fn(),
                onFocusSearch: vi.fn(),
                onListNav,
            },
            { activeApp: 'email', activeScreen: 'list' }
        );

        expect(result).toEqual({ handled: true });
        expect(onListNav).toHaveBeenCalledWith('prev');
    });

    it('ignores shortcuts when the meta key is pressed', () => {
        const onBack = vi.fn();

        const result = handleSimulatorKeyboard(
            {
                key: 'Escape',
                altKey: false,
                ctrlKey: false,
                metaKey: true,
                target: null,
                preventDefault: vi.fn(),
            } as never,
            {
                onBack,
                onSwitchApp: vi.fn(),
                onFocusSearch: vi.fn(),
            },
            { activeApp: 'email', activeScreen: 'list' }
        );

        expect(result).toEqual({ handled: false });
        expect(onBack).not.toHaveBeenCalled();
    });

    it('ignores out-of-range alt-number app shortcuts', () => {
        const onSwitchApp = vi.fn();

        const result = handleSimulatorKeyboard(
            {
                key: '6',
                altKey: true,
                ctrlKey: false,
                metaKey: false,
                target: null,
                preventDefault: vi.fn(),
            } as never,
            {
                onBack: vi.fn(),
                onSwitchApp,
                onFocusSearch: vi.fn(),
            },
            { activeApp: 'email', activeScreen: 'list' }
        );

        expect(result).toEqual({ handled: false });
        expect(onSwitchApp).not.toHaveBeenCalled();
    });

    it('silently ignores fallback list navigation when document is unavailable', () => {
        const originalDocument = globalThis.document;
        (globalThis as { document?: Document }).document = undefined;

        try {
            const result = handleSimulatorKeyboard(
                {
                    key: 'ArrowDown',
                    altKey: true,
                    ctrlKey: false,
                    metaKey: false,
                    target: null,
                    preventDefault: vi.fn(),
                } as never,
                {
                    onBack: vi.fn(),
                    onSwitchApp: vi.fn(),
                    onFocusSearch: vi.fn(),
                },
                { activeApp: 'email', activeScreen: 'list' }
            );

            expect(result).toEqual({ handled: true });
        } finally {
            (globalThis as { document?: Document }).document = originalDocument;
        }
    });
});
