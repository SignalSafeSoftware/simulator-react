import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    focusSimulatorSearch,
    handleSimulatorKeyboard,
    isTypingTarget,
    LIST_NAV_EVENT,
} from '../src/utils/navigation/simulatorKeyboardCommands';

const originalArgv = [...process.argv];

const originalCwd = process.cwd();

const originalDocument = globalThis.document;

const originalCustomEvent = (
    globalThis as {
        CustomEvent?: unknown;
    }
).CustomEvent;

const originalHTMLElement = (
    globalThis as {
        HTMLElement?: unknown;
    }
).HTMLElement;

afterEach(() => {
    process.argv = [...originalArgv];
    process.chdir(originalCwd);
    (
        globalThis as {
            document?: Document;
        }
    ).document = originalDocument;
    (
        globalThis as {
            CustomEvent?: unknown;
        }
    ).CustomEvent = originalCustomEvent;
    (
        globalThis as {
            HTMLElement?: unknown;
        }
    ).HTMLElement = originalHTMLElement;
    vi.restoreAllMocks();
});

describe('keyboard helpers', () => {
    it('covers keyboard helpers, typing guards, and search focus', () => {
        class FakeHTMLElement {
            tagName = 'DIV';
            isContentEditable = false;
            roleValue: string | null = null;
            focus = vi.fn();
            getAttribute(name: string): string | null {
                return name === 'role' ? this.roleValue : null;
            }
        }
        (
            globalThis as {
                HTMLElement?: unknown;
            }
        ).HTMLElement = FakeHTMLElement;
        const dispatchEvent = vi.fn();
        const querySelector = vi.fn(() => new FakeHTMLElement());
        (
            globalThis as {
                document?: unknown;
            }
        ).document = {
            dispatchEvent,
            querySelector,
        } as never;
        (
            globalThis as {
                CustomEvent?: unknown;
            }
        ).CustomEvent = class {
            type: string;
            detail: unknown;
            constructor(
                type: string,
                init?: {
                    detail?: unknown;
                },
            ) {
                this.type = type;
                this.detail = init?.detail;
            }
        };
        const input = new FakeHTMLElement();
        input.tagName = 'INPUT';
        const textarea = new FakeHTMLElement();
        textarea.tagName = 'TEXTAREA';
        const textbox = new FakeHTMLElement();
        textbox.roleValue = 'textbox';
        const searchbox = new FakeHTMLElement();
        searchbox.roleValue = 'searchbox';
        const contentEditable = new FakeHTMLElement();
        contentEditable.isContentEditable = true;
        expect(isTypingTarget(input as never)).toBe(true);
        expect(isTypingTarget(textarea as never)).toBe(true);
        expect(isTypingTarget(textbox as never)).toBe(true);
        expect(isTypingTarget(searchbox as never)).toBe(true);
        expect(isTypingTarget(contentEditable as never)).toBe(true);
        expect(isTypingTarget(new FakeHTMLElement() as never)).toBe(false);
        const onBack = vi.fn();
        const onSwitchApp = vi.fn();
        const onFocusSearch = vi.fn();
        const onListNav = vi.fn();
        const altDown = {
            key: 'ArrowDown',
            altKey: true,
            ctrlKey: false,
            metaKey: false,
            target: null,
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;
        const altUp = {
            key: 'ArrowUp',
            altKey: true,
            ctrlKey: false,
            metaKey: false,
            target: null,
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;
        const blocked = {
            key: '1',
            altKey: true,
            ctrlKey: true,
            metaKey: false,
            target: null,
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;
        expect(
            handleSimulatorKeyboard(
                altDown,
                { onBack, onSwitchApp, onFocusSearch, onListNav },
                { activeApp: 'email', activeScreen: 'list' },
            ),
        ).toEqual({ handled: true });
        expect(onListNav).toHaveBeenCalledWith('next');
        expect(
            handleSimulatorKeyboard(
                altUp,
                { onBack, onSwitchApp, onFocusSearch },
                { activeApp: 'email', activeScreen: 'list' },
            ),
        ).toEqual({ handled: true });
        expect(dispatchEvent).toHaveBeenCalledWith(
            expect.objectContaining({ type: LIST_NAV_EVENT }),
        );
        expect(
            handleSimulatorKeyboard(
                blocked,
                { onBack, onSwitchApp, onFocusSearch },
                { activeApp: 'email', activeScreen: 'list' },
            ),
        ).toEqual({ handled: false });
        const escapeEvent = {
            key: 'Escape',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            target: null,
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;
        expect(
            handleSimulatorKeyboard(
                escapeEvent,
                { onBack, onSwitchApp, onFocusSearch },
                { activeApp: 'email', activeScreen: 'list' },
            ),
        ).toEqual({ handled: true });
        expect(onBack).toHaveBeenCalledTimes(1);
        const switchEvent = {
            key: '4',
            altKey: true,
            ctrlKey: false,
            metaKey: false,
            target: null,
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;
        expect(
            handleSimulatorKeyboard(
                switchEvent,
                { onBack, onSwitchApp, onFocusSearch },
                { activeApp: 'email', activeScreen: 'list' },
            ),
        ).toEqual({ handled: true });
        expect(onSwitchApp).toHaveBeenCalledWith('messages');
        const searchEvent = {
            key: '/',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            target: null,
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;
        expect(
            handleSimulatorKeyboard(
                searchEvent,
                { onBack, onSwitchApp, onFocusSearch },
                { activeApp: 'phone', activeScreen: 'contacts' },
            ),
        ).toEqual({ handled: true });
        expect(onFocusSearch).toHaveBeenCalledTimes(1);
        const helpEvent = {
            key: '?',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            target: null,
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;
        expect(
            handleSimulatorKeyboard(
                helpEvent,
                { onBack, onSwitchApp, onFocusSearch },
                { activeApp: 'email', activeScreen: 'list' },
            ),
        ).toEqual({ handled: true, showHelp: true });
        focusSimulatorSearch();
        expect(querySelector).toHaveBeenCalledWith('[data-simulator-search]');
    });
});
