import type { ReactTestRenderer } from 'react-test-renderer';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestRenderer, act } from './reactTestRenderer';
import SimulatorWithSession from '../src/SimulatorWithSession';
import { createState, flattenText } from './support/withSessionSupport';

const mockState = vi.hoisted(() => ({
    latestShellProps: null as null | Record<string, unknown>,
    latestDeveloperPanelProps: null as null | Record<string, unknown>,
    latestContactsProps: null as null | Record<string, unknown>,
    lastRenderApp: null as null | string,
    lastRenderContext: null as null | Record<string, unknown>,
    keydownHandler: null as null | ((event: KeyboardEvent) => void),
    writeText: vi.fn(() => Promise.resolve()),
    buildSimulatorNavGraph: vi.fn(() => ({
        entry: { app: 'email', screen: 'list' },
        nodes: [{ id: 'email:list', app: 'email', screen: 'list' }],
        edges: [{ from: 'email:list', to: 'internet:landing', action: 'click_link' }],
        browserHasCycle: true,
    })),
    simulatorNavGraphToJson: vi.fn(() => '{"graph":true}'),
    captureSimulatorSnapshot: vi.fn(() => ({ snapshot: true })),
    snapshotToJson: vi.fn(() => '{"snapshot":true}'),
    focusSimulatorSearch: vi.fn(),
    handleSimulatorKeyboard: vi.fn(
        (
            event: KeyboardEvent,
            handlers: {
                onBack: () => void;
                onSwitchApp: (app: 'email' | 'messages' | 'internet' | 'phone' | 'home') => void;
                onFocusSearch: () => void;
            },
        ) => {
            if (event.key === 'b') {
                handlers.onBack();
                return { handled: true, showHelp: false };
            }
            if (event.key === 'm') {
                handlers.onSwitchApp('messages');
                return { handled: true, showHelp: false };
            }
            if (event.key === 'f') {
                handlers.onFocusSearch();
                return { handled: true, showHelp: false };
            }
            if (event.key === '?') {
                return { handled: true, showHelp: true };
            }
            return { handled: false, showHelp: false };
        },
    ),
}));

vi.mock('../src/shell/PhoneSimulatorShell.js', () => ({
    default: (props: Record<string, unknown>) => {
        mockState.latestShellProps = props;
        return props.children ?? null;
    },
}));

vi.mock('../src/developer-tools/SimulatorDeveloperToolsPanel.js', () => ({
    default: (props: Record<string, unknown>) => {
        mockState.latestDeveloperPanelProps = props;
        return null;
    },
}));

vi.mock('../src/views/contacts/ContactsView.js', () => ({
    default: (props: Record<string, unknown>) => {
        mockState.latestContactsProps = props;
        return null;
    },
}));

vi.mock('../src/screenRegistry/registry.js', () => ({
    renderActiveScreen: (app: string, ctx: Record<string, unknown>) => {
        mockState.lastRenderApp = app;
        mockState.lastRenderContext = ctx;
        return null;
    },
}));

vi.mock('../src/SimulatorErrorBoundary.js', () => ({
    default: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('../src/UnsupportedScreenFallback.js', () => ({
    default: ({ app, screen }: { app: string; screen: string }) =>
        React.createElement('div', { 'data-testid': 'unsupported-screen' }, `${app}:${screen}`),
}));

vi.mock('../src/utils/navigation/screenMetadata.js', () => ({
    getScreenMetadata: () => ({ app: 'email', screen: 'list', label: 'Inbox' }),
}));

vi.mock('../src/utils/payload/simulatorCapabilities.js', () => ({
    getSimulatorCapabilities: () => ({
        phone: { dial: true, voicemail: true, directory: true },
        home: { store: true, settings: true },
    }),
}));

vi.mock('../src/utils/navigation/phoneLocalNavItems.js', () => ({
    getPhoneLocalNavItems: () => [
        { id: 'history', label: 'History', icon: 'H' },
        { id: 'contacts', label: 'Contacts', icon: 'C' },
        { id: 'dial', label: 'Dial', icon: 'D' },
        { id: 'back', label: 'Back', icon: 'B' },
    ],
}));

vi.mock('../src/utils/telemetry/simulatorSnapshot.js', () => ({
    captureSimulatorSnapshot: mockState.captureSimulatorSnapshot,
    snapshotToJson: mockState.snapshotToJson,
}));

vi.mock('../src/utils/navigation/simulatorNavGraph.js', () => ({
    buildSimulatorNavGraph: mockState.buildSimulatorNavGraph,
    simulatorNavGraphToJson: mockState.simulatorNavGraphToJson,
}));

vi.mock('../src/utils/navigation/simulatorKeyboardCommands.js', () => ({
    handleSimulatorKeyboard: mockState.handleSimulatorKeyboard,
    focusSimulatorSearch: () => mockState.focusSimulatorSearch(),
    SIMULATOR_KEYBOARD_COMMANDS: [{ keys: '?', description: 'Show shortcuts' }],
}));

describe('SimulatorWithSession verification contexts', () => {
    const originalDocument = globalThis.document;
    const originalNavigator = globalThis.navigator;

    beforeEach(() => {
        mockState.latestShellProps = null;
        mockState.latestDeveloperPanelProps = null;
        mockState.latestContactsProps = null;
        mockState.lastRenderApp = null;
        mockState.lastRenderContext = null;
        mockState.keydownHandler = null;
        mockState.writeText.mockClear();
        mockState.buildSimulatorNavGraph.mockClear();
        mockState.simulatorNavGraphToJson.mockClear();
        mockState.captureSimulatorSnapshot.mockClear();
        mockState.snapshotToJson.mockClear();
        mockState.focusSimulatorSearch.mockClear();
        mockState.handleSimulatorKeyboard.mockClear();
        vi.useFakeTimers();

        (globalThis as Record<string, unknown>).document = {
            addEventListener: (_type: string, handler: (event: KeyboardEvent) => void) => {
                mockState.keydownHandler = handler;
            },
            removeEventListener: vi.fn(),
        };
        Object.defineProperty(globalThis, 'navigator', {
            configurable: true,
            value: {
                clipboard: {
                    writeText: mockState.writeText,
                },
            },
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        (globalThis as Record<string, unknown>).document = originalDocument;
        Object.defineProperty(globalThis, 'navigator', {
            configurable: true,
            value: originalNavigator,
        });
    });

    it('uses app-specific verification context when the contacts modal is open', async () => {
        const dispatch = vi.fn();

        await act(async () => {
            TestRenderer.create(
                React.createElement(SimulatorWithSession, {
                    state: createState({
                        view: {
                            activeApp: 'messages',
                            contactsPanelOpen: true,
                            messages: { screen: 'thread_detail', stack: [], visibleCount: 0 },
                        },
                    }),
                    dispatch,
                }),
            );
        });
        expect(mockState.latestContactsProps?.verificationContext).toEqual({
            name: 'Security Team',
            number: '+15550000002',
        });

        await act(async () => {
            TestRenderer.create(
                React.createElement(SimulatorWithSession, {
                    state: createState({
                        view: { activeApp: 'phone', contactsPanelOpen: true },
                    }),
                    dispatch,
                }),
            );
        });
        expect(mockState.latestContactsProps?.verificationContext).toEqual({
            name: 'Caller',
            number: '+15550000003',
        });

        await act(async () => {
            TestRenderer.create(
                React.createElement(SimulatorWithSession, {
                    state: createState({
                        view: {
                            activeApp: 'email',
                            contactsPanelOpen: true,
                            email: { screen: 'detail', stack: ['list'], selectedMessageId: 'm1' },
                        },
                    }),
                    dispatch,
                }),
            );
        });
        expect(mockState.latestContactsProps?.verificationContext).toEqual({
            name: 'alerts@example.test',
        });

        await act(async () => {
            TestRenderer.create(
                React.createElement(SimulatorWithSession, {
                    state: createState({
                        view: {
                            activeApp: 'email',
                            showPrimaryMenu: false,
                            email: { screen: 'detail', stack: ['trash'], selectedMessageId: 'm1' },
                        },
                    }),
                    dispatch,
                }),
            );
        });
        const emailSecondaryMenu = mockState.latestShellProps!.secondaryMenu as Record<
            string,
            unknown
        >;
        expect(emailSecondaryMenu.activeId).toBe('trash');
        await act(async () => {
            (emailSecondaryMenu.onSelect as (id: string) => void)('outbox');
            (emailSecondaryMenu.onSecondaryBack as () => void)();
        });
        expect(dispatch).toHaveBeenCalledWith({
            type: 'NAV_LOCAL',
            app: 'email',
            screen: 'outbox',
        });
        expect(dispatch).toHaveBeenCalledWith({ type: 'BACK' });

        expect(mockState.latestDeveloperPanelProps?.payload).toBeTruthy();
        expect(mockState.latestDeveloperPanelProps?.timelineEntries).toBeUndefined();
    });

    it('covers null verification contexts, unsupported fallback, and shell prop passthrough', async () => {
        const dispatch = vi.fn();
        let renderer: ReactTestRenderer | null = null;
        const exitLink = React.createElement('a', { href: '/leave' }, 'Leave');

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorWithSession, {
                    state: createState({
                        payload: {
                            sms: {
                                thread: { messages: [{ from: 'them', text: 'Hello' }] },
                                visibleMessageCount: 0,
                            },
                            phone: { content: null },
                            email: {
                                inbox: [],
                                selectedMessageId: 'missing',
                                selectedMessage: { subject: 'Alert', from: '', body: 'Body' },
                            },
                        },
                        view: {
                            activeApp: 'home',
                            showPrimaryMenu: true,
                            home: { screen: 'home' },
                            contactsPanelOpen: true,
                        },
                    }),
                    dispatch,
                    exitLink,
                    compact: true,
                    developerTools: { enabled: false },
                }),
            );
        });

        expect(mockState.latestContactsProps?.verificationContext).toBeNull();
        expect(mockState.latestShellProps?.exitSlot).toBe(exitLink);
        expect(mockState.latestShellProps?.exitTo).toBeUndefined();
        expect(mockState.latestShellProps?.compact).toBe(true);
        expect(mockState.latestShellProps?.hideBottomNav).toBe(false);
        expect(mockState.latestShellProps?.secondaryMenu).toBeUndefined();
        expect(flattenText(renderer!.toJSON())).toContain('home:home');
    });
});
