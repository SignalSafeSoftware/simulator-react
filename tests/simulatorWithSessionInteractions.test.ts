import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestRenderer, act } from './reactTestRenderer';

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
            handlers: { onBack: () => void; onSwitchApp: (app: 'email' | 'messages' | 'internet' | 'phone' | 'home') => void; onFocusSearch: () => void }
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
        }
    ),
}));

vi.mock('../src/shell/PhoneSimulatorShell', () => ({
    default: (props: Record<string, unknown>) => {
        mockState.latestShellProps = props;
        return props.children ?? null;
    },
}));

vi.mock('../src/SimulatorDeveloperToolsPanel', () => ({
    default: (props: Record<string, unknown>) => {
        mockState.latestDeveloperPanelProps = props;
        return null;
    },
}));

vi.mock('../src/views/ContactsView', () => ({
    default: (props: Record<string, unknown>) => {
        mockState.latestContactsProps = props;
        return null;
    },
}));

vi.mock('../src/screenRegistry', () => ({
    renderActiveScreen: (app: string, ctx: Record<string, unknown>) => {
        mockState.lastRenderApp = app;
        mockState.lastRenderContext = ctx;
        return null;
    },
}));

vi.mock('../src/SimulatorErrorBoundary', () => ({
    default: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('../src/UnsupportedScreenFallback', () => ({
    default: ({ app, screen }: { app: string; screen: string }) =>
        React.createElement('div', { 'data-testid': 'unsupported-screen' }, `${app}:${screen}`),
}));

vi.mock('../src/utils/screenMetadata', () => ({
    getScreenMetadata: () => ({ app: 'email', screen: 'list', label: 'Inbox' }),
}));

vi.mock('../src/utils/simulatorCapabilities', () => ({
    getSimulatorCapabilities: () => ({
        phone: { dial: true, voicemail: true, directory: true },
        home: { store: true, settings: true },
    }),
}));

vi.mock('../src/utils/phoneLocalNavItems', () => ({
    getPhoneLocalNavItems: () => [
        { id: 'history', label: 'History', icon: 'H' },
        { id: 'contacts', label: 'Contacts', icon: 'C' },
        { id: 'dial', label: 'Dial', icon: 'D' },
        { id: 'back', label: 'Back', icon: 'B' },
    ],
}));

vi.mock('../src/utils/simulatorSnapshot', () => ({
    captureSimulatorSnapshot: (...args: unknown[]) => mockState.captureSimulatorSnapshot(...args),
    snapshotToJson: (...args: unknown[]) => mockState.snapshotToJson(...args),
}));

vi.mock('../src/utils/simulatorNavGraph', () => ({
    buildSimulatorNavGraph: (...args: unknown[]) => mockState.buildSimulatorNavGraph(...args),
    simulatorNavGraphToJson: (...args: unknown[]) => mockState.simulatorNavGraphToJson(...args),
}));

vi.mock('../src/utils/simulatorKeyboardCommands', () => ({
    handleSimulatorKeyboard: (...args: unknown[]) => mockState.handleSimulatorKeyboard(...args),
    focusSimulatorSearch: () => mockState.focusSimulatorSearch(),
    SIMULATOR_KEYBOARD_COMMANDS: [{ keys: '?', description: 'Show shortcuts' }],
}));

import SimulatorWithSession from '../src/SimulatorWithSession';

function createState(overrides: Record<string, unknown> = {}) {
    return {
        payload: {
            templateId: 1,
            templateKey: 'sim-template',
            name: 'Simulator Template',
            channel: 'email',
            topicTags: [],
            runId: 2,
            attemptId: 3,
            entryPoint: { app: 'email', screen: 'list' },
            contacts: [{ id: 'c1', displayName: 'Helpdesk', number: '+15550000001' }],
            browser: {
                defaultPageId: 'landing',
                pages: [
                    { id: 'landing', url: 'https://example.test', title: 'Landing', layout: 'content', submitTargetPageId: 'result' },
                    { id: 'result', url: 'https://example.test/result', title: 'Result', layout: 'result' },
                ],
            },
            email: {
                inbox: [{ id: 'm1', subject: 'Alert', from: 'alerts@example.test' }],
                selectedMessageId: 'm1',
                selectedMessage: { subject: 'Alert', from: 'alerts@example.test', body: 'Body' },
            },
            sms: {
                thread: {
                    messages: [{ from: 'them', text: 'Hello' }],
                    sender_display_name: 'Security Team',
                    sender_number: '+15550000002',
                },
                visibleMessageCount: 0,
            },
            phone: {
                content: { transcript: 'Incoming call', choices: [], caller_name: 'Caller', phone_number: '+15550000003' },
                chosenIndex: null,
            },
            directory: [{ id: 'd1', label: 'Directory', number: '+15550000004' }],
            home: { widgets: [], featuredApps: [], settingsSections: [] },
            ...((overrides.payload as Record<string, unknown> | undefined) ?? {}),
        },
        view: {
            activeApp: 'phone',
            showPrimaryMenu: false,
            phone: { screen: 'history', stack: [], chosenIndex: null },
            email: { screen: 'list', stack: [], selectedMessageId: 'm1' },
            messages: { screen: 'threads', stack: [], visibleCount: 0 },
            internet: { screen: 'landing', stack: [] },
            home: { screen: 'home' },
            contactsPanelOpen: false,
            contactsSearchQuery: '',
            actionHistory: [],
            ...((overrides.view as Record<string, unknown> | undefined) ?? {}),
        },
    } as never;
}

function flushPromises(): Promise<void> {
    return Promise.resolve();
}

function flattenText(node: TestRenderer.ReactTestRendererJSON | TestRenderer.ReactTestRendererJSON[] | null): string {
    if (node == null) {
        return '';
    }
    if (Array.isArray(node)) {
        return node.map((child) => flattenText(child)).join('');
    }
    return (node.children ?? [])
        .map((child) => (typeof child === 'string' ? child : flattenText(child)))
        .join('');
}

describe('SimulatorWithSession interactions', () => {
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
        let renderer: TestRenderer.ReactTestRenderer | null = null;

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
                })
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
            (mockState.lastRenderContext!.onOpenContactFromPhone as (contactId: string) => void)('c1');
            (mockState.lastRenderContext!.onSelectEmail as (messageId: string) => void)('missing');
            (mockState.lastRenderContext!.onSelectEmail as (messageId: string) => void)('m1');
        });

        expect(dispatch).toHaveBeenCalledWith({ type: 'SWITCH_APP', app: 'messages' });
        expect(dispatch).toHaveBeenCalledWith({ type: 'SMS_REVEAL_NEXT' });
        expect(dispatch).toHaveBeenCalledWith({ type: 'NAV_LOCAL', app: 'messages', screen: 'thread_detail' });
        expect(dispatch).toHaveBeenCalledWith({ type: 'SELECT_EMAIL', messageId: 'm1' });
        expect(onSimulatorEvent.mock.calls.map(([event]) => event.kind)).toEqual(
            expect.arrayContaining(['app_opened', 'thread_opened', 'contact_opened', 'email_opened'])
        );
    });

    it('handles submit-form navigation, secondary menus, developer controls, and keyboard shortcuts', async () => {
        const dispatch = vi.fn();
        const onSimulatorEvent = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

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
                        { kind: 'session_started', timestamp: '2026-01-01T10:00:00Z', app: 'phone', screen: 'dial' },
                    ] as never,
                    developerToolsRuntimeIssues: [{ severity: 'warning', message: 'Issue', node_id: 'start' }] as never,
                })
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
            expect.arrayContaining(['form_submitted', 'screen_viewed'])
        );

        const secondaryMenu = mockState.latestShellProps!.secondaryMenu as Record<string, unknown>;
        await act(async () => {
            (secondaryMenu.onSelect as (id: string) => void)('contacts');
            (secondaryMenu.onSecondaryBack as () => void)();
        });
        expect(dispatch).toHaveBeenCalledWith({ type: 'NAV_LOCAL', app: 'phone', screen: 'contacts' });
        expect(dispatch).toHaveBeenCalledWith({ type: 'BACK_TO_PRIMARY' });

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
        expect(flattenText(renderer!.toJSON())).toContain('Nav graph: 1 nodes, 1 edges, entry email:list, browser has cycle');
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

    it('uses app-specific verification context when the contacts modal is open', async () => {
        const dispatch = vi.fn();

        await act(async () => {
            TestRenderer.create(
                React.createElement(SimulatorWithSession, {
                    state: createState({
                        view: { activeApp: 'messages', contactsPanelOpen: true, messages: { screen: 'thread_detail', stack: [], visibleCount: 0 } },
                    }),
                    dispatch,
                })
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
                })
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
                })
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
                })
            );
        });
        const emailSecondaryMenu = mockState.latestShellProps!.secondaryMenu as Record<string, unknown>;
        expect(emailSecondaryMenu.activeId).toBe('trash');
        await act(async () => {
            (emailSecondaryMenu.onSelect as (id: string) => void)('outbox');
            (emailSecondaryMenu.onSecondaryBack as () => void)();
        });
        expect(dispatch).toHaveBeenCalledWith({ type: 'NAV_LOCAL', app: 'email', screen: 'outbox' });
        expect(dispatch).toHaveBeenCalledWith({ type: 'BACK_TO_PRIMARY' });

        expect(mockState.latestDeveloperPanelProps?.payload).toBeTruthy();
        expect(mockState.latestDeveloperPanelProps?.timelineEntries).toBeUndefined();
    });

    it('covers null verification contexts, unsupported fallback, and shell prop passthrough', async () => {
        const dispatch = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;
        const exitLink = React.createElement('a', { href: '/leave' }, 'Leave');

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorWithSession, {
                    state: createState({
                        payload: {
                            sms: { thread: { messages: [{ from: 'them', text: 'Hello' }] }, visibleMessageCount: 0 },
                            phone: { content: null },
                            email: { inbox: [], selectedMessageId: 'missing', selectedMessage: { subject: 'Alert', from: '', body: 'Body' } },
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
                })
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

    it('covers app-specific null verification contexts, secondary menu ids, and toolbar toggles', async () => {
        const dispatch = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorWithSession, {
                    state: createState({
                        payload: {
                            sms: { thread: { messages: [{ text: 'Hello' }] }, visibleMessageCount: 0 },
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
                })
            );
        });
        expect(mockState.latestContactsProps?.verificationContext).toBeNull();
        expect(mockState.latestShellProps?.hideBottomNav).toBe(true);

        const toolbarButton = renderer!.root.findByProps({ 'aria-label': 'Summary' });
        expect(toolbarButton.props['aria-pressed']).toBe(true);
        await act(async () => {
            toolbarButton.props.onClick();
        });
        expect(renderer!.root.findByProps({ 'aria-label': 'Summary' }).props['aria-pressed']).toBe(false);

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
                })
            );
        });
        expect(mockState.latestContactsProps?.verificationContext).toBeNull();
        expect((mockState.latestShellProps?.secondaryMenu as Record<string, unknown>).activeId).toBe('contacts');

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
                })
            );
        });
        expect(mockState.latestContactsProps?.verificationContext).toBeNull();
        expect(mockState.latestShellProps?.hideBottomNav).toBe(true);
        expect((mockState.latestShellProps?.secondaryMenu as Record<string, unknown>).activeId).toBe('list');

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
                })
            );
        });
        expect((mockState.latestShellProps?.secondaryMenu as Record<string, unknown>).activeId).toBe('outbox');
        expect(mockState.latestShellProps?.hideBottomNav).toBe(false);
    });

    it('covers fallback verification contexts, navigate-screen events, and non-cycle nav graph summaries', async () => {
        const dispatch = vi.fn();
        const onSimulatorEvent = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

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
                                selectedMessage: { subject: 'Alert', from: 'sender@example.test', body: 'Body' },
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
                })
            );
        });

        expect(mockState.latestContactsProps?.verificationContext).toEqual({
            name: 'sender@example.test',
        });
        expect(flattenText(renderer!.toJSON())).toContain('Nav graph: 1 nodes, 0 edges, entry internet:landing');
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
                })
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
                })
            );
        });
        expect((mockState.latestShellProps?.secondaryMenu as Record<string, unknown>).activeId).toBe('history');
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
                                pages: [{ id: 'landing', url: 'https://example.test', title: 'Landing', layout: 'content' }],
                            },
                        },
                        view: {
                            activeApp: 'internet',
                            internet: { screen: 'landing', stack: [] },
                        },
                    }),
                    dispatch,
                    onSimulatorEvent,
                })
            );
        });

        await act(async () => {
            (mockState.lastRenderContext!.onAction as (action: Record<string, unknown>) => void)({
                type: 'submit_form',
                submitMetadata: { clicked: true },
            });
        });

        expect(dispatch).not.toHaveBeenCalledWith({ type: 'BROWSER_SCREEN', screen: 'result' });
        expect(onSimulatorEvent.mock.calls.map(([event]) => event.kind)).toContain('form_submitted');
    });
});
