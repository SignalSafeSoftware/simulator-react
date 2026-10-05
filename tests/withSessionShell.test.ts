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

function flushPromises(): Promise<void> {
    return Promise.resolve();
}

describe('SimulatorWithSession shell interactions', () => {
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

    it('dispatches and emits events for shell channel changes and render-context callbacks', async () => {
        const dispatch = vi.fn();
        const onSimulatorEvent = vi.fn();
        let renderer: ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorWithSession, {
                    state: createState({
                        view: {
                            activeApp: 'phone',
                            phone: { screen: 'history', stack: [], chosenIndex: null },
                            messages: { screen: 'threads', stack: [], visibleCount: 0 },
                        },
                    }),
                    dispatch,
                    onSimulatorEvent,
                }),
            );
        });

        expect(renderer).not.toBeNull();
        expect(mockState.latestShellProps).not.toBeNull();
        expect(mockState.lastRenderApp).toBe('phone');
        expect(mockState.lastRenderContext).not.toBeNull();

        await act(async () => {
            (mockState.latestShellProps!.onChannelChange as (channel: string) => void)('sms');
            (mockState.lastRenderContext!.onSmsRevealNext as () => void)();
            (mockState.lastRenderContext!.onSelectThread as (threadId: string) => void)('thread-1');
            (mockState.lastRenderContext!.onOpenContactFromPhone as (contactId: string) => void)(
                'c1',
            );
            (mockState.lastRenderContext!.onSelectEmail as (messageId: string) => void)('missing');
            (mockState.lastRenderContext!.onSelectEmail as (messageId: string) => void)('m1');
        });

        expect(dispatch).toHaveBeenCalledWith({ type: 'SWITCH_APP', app: 'messages' });
        expect(dispatch).toHaveBeenCalledWith({ type: 'SMS_REVEAL_NEXT' });
        expect(dispatch).toHaveBeenCalledWith({
            type: 'NAV_LOCAL',
            app: 'messages',
            screen: 'thread_detail',
        });
        expect(dispatch).toHaveBeenCalledWith({ type: 'SELECT_EMAIL', messageId: 'm1' });
        expect(onSimulatorEvent.mock.calls.map(([event]) => event.kind)).toEqual(
            expect.arrayContaining([
                'app_opened',
                'thread_opened',
                'contact_opened',
                'email_opened',
            ]),
        );
    });

    it('handles submit-form navigation, secondary menus, developer controls, and keyboard shortcuts', async () => {
        const dispatch = vi.fn();
        const onSimulatorEvent = vi.fn();
        let renderer: ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorWithSession, {
                    state: createState({
                        view: {
                            activeApp: 'phone',
                            showPrimaryMenu: false,
                            phone: { screen: 'dial', stack: [], chosenIndex: null },
                            internet: { screen: 'landing', stack: [] },
                        },
                    }),
                    dispatch,
                    onSimulatorEvent,
                    developerTools: {
                        enabled: true,
                        defaultExpanded: true,
                        sections: {
                            summary: true,
                            reachability: true,
                            timeline: true,
                            navGraph: true,
                            snapshotExport: true,
                            shortcuts: true,
                            runtimeIssues: true,
                        },
                    },
                    developerToolsTimelineEntries: [
                        {
                            kind: 'session_started',
                            timestamp: '2026-01-01T10:00:00Z',
                            app: 'phone',
                            screen: 'dial',
                        },
                    ] as never,
                    developerToolsRuntimeIssues: [
                        { severity: 'warning', message: 'Issue', node_id: 'start' },
                    ] as never,
                }),
            );
        });

        await act(async () => {
            (mockState.lastRenderContext!.onAction as (action: Record<string, unknown>) => void)({
                type: 'submit_form',
                submitMetadata: { clicked: true },
            });
        });
        expect(dispatch).toHaveBeenCalledWith({
            type: 'SIMULATOR_ACTION',
            action: { type: 'submit_form', submitMetadata: { clicked: true } },
        });
        expect(dispatch).toHaveBeenCalledWith({ type: 'BROWSER_SCREEN', screen: 'result' });
        expect(onSimulatorEvent.mock.calls.map(([event]) => event.kind)).toEqual(
            expect.arrayContaining(['form_submitted', 'screen_viewed']),
        );

        const secondaryMenu = mockState.latestShellProps!.secondaryMenu as Record<string, unknown>;
        await act(async () => {
            (secondaryMenu.onSelect as (id: string) => void)('contacts');
            (secondaryMenu.onSecondaryBack as () => void)();
        });
        expect(dispatch).toHaveBeenCalledWith({
            type: 'NAV_LOCAL',
            app: 'phone',
            screen: 'contacts',
        });
        expect(dispatch).toHaveBeenCalledWith({ type: 'BACK' });

        const root = renderer!.root;
        await act(async () => {
            root.findByProps({ 'aria-label': 'Copy simulator snapshot for debug' }).props.onClick();
            root.findByProps({ 'aria-label': 'Copy nav graph for debug' }).props.onClick();
            root.findByProps({ 'aria-label': 'Keyboard shortcuts' }).props.onClick();
            await flushPromises();
        });
        await act(async () => {
            vi.runAllTimers();
        });

        expect(mockState.captureSimulatorSnapshot).toHaveBeenCalled();
        expect(mockState.snapshotToJson).toHaveBeenCalled();
        expect(mockState.buildSimulatorNavGraph).toHaveBeenCalled();
        expect(mockState.simulatorNavGraphToJson).toHaveBeenCalled();
        expect(mockState.writeText).toHaveBeenCalledWith('{"snapshot":true}');
        expect(mockState.writeText).toHaveBeenCalledWith('{"graph":true}');
        expect(flattenText(renderer!.toJSON())).toContain(
            'Nav graph: 1 nodes, 1 edges, entry email:list, browser has cycle',
        );
        expect(root.findByType('dialog').props.open).toBe(true);

        const keyboardEvent = {
            key: '?',
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
        } as unknown as KeyboardEvent;
        await act(async () => {
            mockState.keydownHandler?.(keyboardEvent);
        });
        expect(mockState.handleSimulatorKeyboard).toHaveBeenCalled();
        expect(keyboardEvent.preventDefault).toHaveBeenCalled();
        expect(keyboardEvent.stopPropagation).toHaveBeenCalled();

        const switchEvent = {
            key: 'm',
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
        } as unknown as KeyboardEvent;
        await act(async () => {
            mockState.keydownHandler?.(switchEvent);
        });
        expect(dispatch).toHaveBeenCalledWith({ type: 'SWITCH_APP', app: 'messages' });

        const searchEvent = {
            key: 'f',
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
        } as unknown as KeyboardEvent;
        await act(async () => {
            mockState.keydownHandler?.(searchEvent);
        });
        expect(mockState.focusSimulatorSearch).toHaveBeenCalled();

        const backEvent = {
            key: 'b',
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
        } as unknown as KeyboardEvent;
        await act(async () => {
            mockState.keydownHandler?.(backEvent);
        });
        expect(dispatch).toHaveBeenCalledWith({ type: 'BACK' });

        const escapeEvent = {
            key: 'Escape',
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;
        await act(async () => {
            mockState.keydownHandler?.(escapeEvent);
        });
        expect(escapeEvent.preventDefault).toHaveBeenCalled();
    });
});
