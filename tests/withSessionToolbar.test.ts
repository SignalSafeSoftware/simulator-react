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

describe('SimulatorWithSession toolbar and nav graph', () => {
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

    it('covers app-specific null verification contexts, secondary menu ids, and toolbar toggles', async () => {
        const dispatch = vi.fn();
        let renderer: ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorWithSession, {
                    state: createState({
                        payload: {
                            sms: {
                                thread: { messages: [{ text: 'Hello' }] },
                                visibleMessageCount: 0,
                            },
                            phone: { content: null },
                            email: {
                                inbox: [{ id: 'm1', subject: 'Alert', from: '' }],
                                selectedMessageId: 'missing',
                                selectedMessage: { subject: 'Alert', from: '', body: 'Body' },
                            },
                        },
                        view: {
                            activeApp: 'messages',
                            showPrimaryMenu: false,
                            contactsPanelOpen: true,
                            messages: { screen: 'new_thread', stack: [], visibleCount: 0 },
                        },
                    }),
                    dispatch,
                    developerTools: {
                        enabled: true,
                        defaultExpanded: false,
                        sections: {
                            summary: true,
                            reachability: false,
                            timeline: false,
                            navGraph: false,
                            snapshotExport: false,
                            shortcuts: false,
                            runtimeIssues: false,
                        },
                    },
                }),
            );
        });
        expect(mockState.latestContactsProps?.verificationContext).toBeNull();
        expect(mockState.latestShellProps?.hideBottomNav).toBe(true);

        const toolbarButton = renderer!.root.findByProps({ 'aria-label': 'Summary' });
        expect(toolbarButton.props['aria-pressed']).toBe(true);
        await act(async () => {
            toolbarButton.props.onClick();
        });
        expect(renderer!.root.findByProps({ 'aria-label': 'Summary' }).props['aria-pressed']).toBe(
            false,
        );

        await act(async () => {
            renderer!.update(
                React.createElement(SimulatorWithSession, {
                    state: createState({
                        payload: {
                            phone: { content: null },
                        },
                        view: {
                            activeApp: 'phone',
                            showPrimaryMenu: false,
                            contactsPanelOpen: true,
                            phone: { screen: 'directory', stack: [], chosenIndex: null },
                        },
                    }),
                    dispatch,
                }),
            );
        });
        expect(mockState.latestContactsProps?.verificationContext).toBeNull();
        expect(
            (mockState.latestShellProps?.secondaryMenu as Record<string, unknown> | undefined)
                ?.activeId,
        ).toBe('contacts');

        await act(async () => {
            renderer!.update(
                React.createElement(SimulatorWithSession, {
                    state: createState({
                        payload: {
                            email: {
                                inbox: [{ id: 'm1', subject: 'Alert', from: '' }],
                                selectedMessageId: 'missing',
                                selectedMessage: { subject: 'Alert', from: '', body: 'Body' },
                            },
                        },
                        view: {
                            activeApp: 'email',
                            showPrimaryMenu: false,
                            contactsPanelOpen: true,
                            email: { screen: 'detail', stack: [], selectedMessageId: 'missing' },
                        },
                    }),
                    dispatch,
                }),
            );
        });
        expect(mockState.latestContactsProps?.verificationContext).toBeNull();
        expect(mockState.latestShellProps?.hideBottomNav).toBe(true);
        expect(
            (mockState.latestShellProps?.secondaryMenu as Record<string, unknown> | undefined)
                ?.activeId,
        ).toBe('list');

        await act(async () => {
            renderer!.update(
                React.createElement(SimulatorWithSession, {
                    state: createState({
                        view: {
                            activeApp: 'email',
                            showPrimaryMenu: false,
                            email: { screen: 'outbox', stack: ['list'], selectedMessageId: null },
                        },
                    }),
                    dispatch,
                }),
            );
        });
        expect(
            (mockState.latestShellProps?.secondaryMenu as Record<string, unknown> | undefined)
                ?.activeId,
        ).toBe('outbox');
        expect(mockState.latestShellProps?.hideBottomNav).toBe(false);
    });

    it('covers fallback verification contexts, navigate-screen events, and non-cycle nav graph summaries', async () => {
        const dispatch = vi.fn();
        const onSimulatorEvent = vi.fn();
        let renderer: ReactTestRenderer | null = null;

        mockState.buildSimulatorNavGraph.mockReturnValueOnce({
            entry: { app: 'internet', screen: 'landing' },
            nodes: [{ id: 'internet:landing', app: 'internet', screen: 'landing' }],
            edges: [],
            browserHasCycle: false,
        });

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorWithSession, {
                    state: createState({
                        payload: {
                            email: {
                                inbox: [],
                                selectedMessageId: 'missing',
                                selectedMessage: {
                                    subject: 'Alert',
                                    from: 'sender@example.test',
                                    body: 'Body',
                                },
                            },
                        },
                        view: {
                            activeApp: 'email',
                            showPrimaryMenu: false,
                            contactsPanelOpen: true,
                            email: { screen: 'detail', stack: [], selectedMessageId: 'missing' },
                        },
                    }),
                    dispatch,
                    onSimulatorEvent,
                    developerTools: {
                        enabled: true,
                        defaultExpanded: true,
                        sections: {
                            summary: false,
                            reachability: false,
                            timeline: false,
                            navGraph: true,
                            snapshotExport: false,
                            shortcuts: false,
                            runtimeIssues: false,
                        },
                    },
                }),
            );
        });

        expect(mockState.latestContactsProps?.verificationContext).toEqual({
            name: 'sender@example.test',
        });
        expect(flattenText(renderer!.toJSON())).toContain(
            'Nav graph: 1 nodes, 0 edges, entry internet:landing',
        );
        expect(flattenText(renderer!.toJSON())).not.toContain('browser has cycle');

        await act(async () => {
            (mockState.lastRenderContext!.onAction as (action: Record<string, unknown>) => void)({
                type: 'navigate_screen',
                app: 'internet',
                screen: 'pricing',
            });
        });
        expect(onSimulatorEvent.mock.calls.map(([event]) => event.kind)).toContain('screen_viewed');

        await act(async () => {
            renderer!.update(
                React.createElement(SimulatorWithSession, {
                    state: createState({
                        payload: {
                            sms: null,
                        },
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
        expect(mockState.latestContactsProps?.verificationContext).toBeNull();

        await act(async () => {
            renderer!.update(
                React.createElement(SimulatorWithSession, {
                    state: createState({
                        view: {
                            activeApp: 'phone',
                            showPrimaryMenu: false,
                            phone: { screen: 'voicemail', stack: ['history'], chosenIndex: null },
                        },
                    }),
                    dispatch,
                }),
            );
        });
        expect(
            (mockState.latestShellProps?.secondaryMenu as Record<string, unknown> | undefined)
                ?.activeId,
        ).toBe('history');
    });

    it('skips browser screen dispatch when submit targets are unresolved', async () => {
        const dispatch = vi.fn();
        const onSimulatorEvent = vi.fn();

        await act(async () => {
            TestRenderer.create(
                React.createElement(SimulatorWithSession, {
                    state: createState({
                        payload: {
                            browser: {
                                defaultPageId: 'landing',
                                pages: [
                                    {
                                        id: 'landing',
                                        url: 'https://example.test',
                                        title: 'Landing',
                                        layout: 'content',
                                    },
                                ],
                            },
                        },
                        view: {
                            activeApp: 'internet',
                            internet: { screen: 'landing', stack: [] },
                        },
                    }),
                    dispatch,
                    onSimulatorEvent,
                }),
            );
        });

        await act(async () => {
            (mockState.lastRenderContext!.onAction as (action: Record<string, unknown>) => void)({
                type: 'submit_form',
                submitMetadata: { clicked: true },
            });
        });

        expect(dispatch).not.toHaveBeenCalledWith({ type: 'BROWSER_SCREEN', screen: 'result' });
        expect(onSimulatorEvent.mock.calls.map(([event]) => event.kind)).toContain(
            'form_submitted',
        );
    });
});
