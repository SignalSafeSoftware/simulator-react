import { afterEach, describe, expect, it, vi } from 'vitest';
import {} from '../src/adapters/fullDeviceToSession';
import {} from '../src/state/simulatorSessionInitialState.js';
import type { SimulatorTemplatePayload } from '../src/types/session';
import {} from '../src/utils/payload/lintSimulatorPayload';
import {} from '../src/utils/payload/simulatorKeyPatterns';
import { getSimulatorCapabilities } from '../src/utils/payload/simulatorCapabilities';
import { handleSimulatorKeyboard } from '../src/utils/navigation/simulatorKeyboardCommands';
import {} from '../src/utils/preview/simulatorPreviewReport';
import {} from '../src/utils/telemetry/simulatorTransitionLogger';
import { createPayload } from './support/criticalPathsSupport';

const originalNodeEnv = process.env.NODE_ENV;

const originalWindow = (globalThis as { window?: unknown }).window;

const originalHTMLElement = (globalThis as { HTMLElement?: unknown }).HTMLElement;

function createKeyboardEvent(
    overrides: Partial<KeyboardEvent> & { key: string },
): KeyboardEvent & { preventDefault: ReturnType<typeof vi.fn> } {
    return {
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        target: null,
        preventDefault: vi.fn(),
        ...overrides,
    } as KeyboardEvent & { preventDefault: ReturnType<typeof vi.fn> };
}

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

describe('getSimulatorCapabilities', () => {
    it('detects attachments, browser forms, voicemail, and home affordances', () => {
        const payload: SimulatorTemplatePayload = {
            ...createPayload(),
            email: {
                inbox: [
                    {
                        id: 'message-1',
                        subject: 'Invoice',
                        from: 'billing@example.test',
                        attachment_name: 'invoice.pdf',
                    },
                ],
                selectedMessage: null,
                selectedMessageId: null,
            },
            browser: {
                defaultPageId: 'landing',
                pages: [
                    {
                        id: 'landing',
                        url: 'https://example.test',
                        title: 'Landing',
                        layout: 'login',
                        formFields: [{ name: 'email', type: 'email', label: 'Email' }],
                    },
                ],
            },
            phone: {
                content: {
                    transcript: 'Incoming call.',
                    choices: [],
                },
                chosenIndex: null,
                voicemailTranscript: 'Please call me back.',
            },
            directory: [{ id: 'helpdesk', label: 'Help Desk' }],
            home: {
                widgets: [],
                featuredApps: [{ id: 'store-app', name: 'Store App' }],
                settingsSections: [{ id: 'settings-general', title: 'General' }],
            },
        };

        expect(getSimulatorCapabilities(payload)).toEqual({
            phone: { dial: true, voicemail: true, directory: true },
            home: { store: true, settings: true },
            emailAttachments: true,
            browserForms: true,
        });
    });

    it('returns false capability flags for empty or malformed optional sections', () => {
        const payload: SimulatorTemplatePayload = {
            ...createPayload(),
            email: {
                inbox: null as never,
                selectedMessage: {
                    subject: 'Alert',
                    from: 'alerts@example.test',
                    body: 'Body',
                    attachment_name: '   ',
                },
                selectedMessageId: 'm1',
            },
            browser: {
                defaultPageId: 'landing',
                pages: [
                    {
                        id: 'landing',
                        url: 'https://example.test',
                        title: 'Landing',
                        layout: 'content',
                        formFields: null as never,
                    },
                ],
            },
            phone: {
                content: {
                    transcript: 'Incoming call.',
                    choices: [],
                },
                chosenIndex: null,
                voicemailTranscript: '   ',
            },
            directory: null,
            home: {
                widgets: [],
                featuredApps: [],
                settingsSections: [],
            },
        };

        expect(getSimulatorCapabilities(payload)).toEqual({
            phone: { dial: true, voicemail: false, directory: false },
            home: { store: false, settings: false },
            emailAttachments: false,
            browserForms: false,
        });
    });

    it('handles missing attachment keys, null phone payloads, and non-array browser pages', () => {
        const payload: SimulatorTemplatePayload = {
            ...createPayload(),
            email: {
                inbox: [
                    { id: 'message-1', subject: 'Alert', from: 'alerts@example.test' } as never,
                ],
                selectedMessage: {
                    subject: 'Alert',
                    from: 'alerts@example.test',
                    body: 'Body',
                } as never,
                selectedMessageId: 'm1',
            },
            browser: {
                defaultPageId: 'landing',
                pages: null as never,
            },
            phone: null,
            directory: [],
            home: null,
        };

        expect(getSimulatorCapabilities(payload)).toEqual({
            phone: { dial: false, voicemail: false, directory: false },
            home: { store: false, settings: false },
            emailAttachments: false,
            browserForms: false,
        });
    });
});

describe('handleSimulatorKeyboard', () => {
    it('switches apps with Alt+number shortcuts', () => {
        const onSwitchApp = vi.fn();
        const event = createKeyboardEvent({ key: '3', altKey: true });

        const result = handleSimulatorKeyboard(
            event,
            {
                onBack: vi.fn(),
                onSwitchApp,
                onFocusSearch: vi.fn(),
            },
            { activeApp: 'email', activeScreen: 'list' },
        );

        expect(result).toEqual({ handled: true });
        expect(onSwitchApp).toHaveBeenCalledWith('internet');
    });

    it('focuses contacts search on slash and ignores typing targets', () => {
        const onFocusSearch = vi.fn();
        class FakeHTMLElement {
            tagName = 'INPUT';
            isContentEditable = false;

            getAttribute(): string | null {
                return null;
            }
        }
        (globalThis as { HTMLElement?: unknown }).HTMLElement = FakeHTMLElement;
        const handledEvent = createKeyboardEvent({ key: '/' });
        const typingEvent = createKeyboardEvent({
            key: '/',
            target: new FakeHTMLElement() as unknown as EventTarget,
        });

        const handledResult = handleSimulatorKeyboard(
            handledEvent,
            {
                onBack: vi.fn(),
                onSwitchApp: vi.fn(),
                onFocusSearch,
            },
            { activeApp: 'phone', activeScreen: 'contacts' },
        );
        const ignoredResult = handleSimulatorKeyboard(
            typingEvent,
            {
                onBack: vi.fn(),
                onSwitchApp: vi.fn(),
                onFocusSearch,
            },
            { activeApp: 'phone', activeScreen: 'contacts' },
        );

        expect(handledResult).toEqual({ handled: true });
        expect(ignoredResult).toEqual({ handled: false });
        expect(onFocusSearch).toHaveBeenCalledTimes(1);
    });
});
