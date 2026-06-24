import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TestRenderer, act } from './reactTestRenderer';

const mockState = vi.hoisted(() => ({
    latestShellProps: null as null | Record<string, unknown>,
    latestRenderContext: null as null | Record<string, unknown>,
}));

vi.mock('../src/shell/PhoneSimulatorShell', () => ({
    default: (props: Record<string, unknown>) => {
        mockState.latestShellProps = props;
        return null;
    },
}));

vi.mock('../src/SimulatorDeveloperToolsPanel', () => ({
    default: () => null,
}));

vi.mock('../src/views/ContactsView', () => ({
    default: () => null,
}));

vi.mock('../src/screenRegistry', () => ({
    renderActiveScreen: (_app: string, ctx: Record<string, unknown>) => {
        mockState.latestRenderContext = ctx;
        return null;
    },
}));

vi.mock('../src/SimulatorErrorBoundary', () => ({
    default: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('../src/UnsupportedScreenFallback', () => ({
    default: () => null,
}));

vi.mock('../src/utils/screenMetadata', () => ({
    getScreenMetadata: () => ({ app: 'phone', screen: 'history', label: 'History' }),
}));

vi.mock('../src/utils/simulatorCapabilities', () => ({
    getSimulatorCapabilities: () => ({ phone: {} }),
}));

vi.mock('../src/utils/phoneLocalNavItems', () => ({
    getPhoneLocalNavItems: () => [
        { id: 'history', label: 'History', icon: 'H' },
        { id: 'contacts', label: 'Contacts', icon: 'C' },
        { id: 'back', label: 'Back', icon: 'B' },
    ],
}));

import SimulatorWithSession from '../src/SimulatorWithSession';

function createState(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        payload: {
            channel: 'email',
            contacts: [],
            browser: { pages: [], defaultPageId: 'landing' },
            email: { inbox: [], selectedMessageId: null, selectedMessage: null },
            ...((overrides.payload as Record<string, unknown> | undefined) ?? {}),
        },
        view: {
            activeApp: 'phone',
            showPrimaryMenu: false,
            phone: { screen: 'history', stack: [], chosenIndex: null },
            email: { screen: 'list', stack: [], selectedMessageId: null },
            messages: { screen: 'threads', stack: [], visibleCount: 0 },
            internet: { screen: 'landing', stack: [] },
            home: { screen: 'home' },
            contactsPanelOpen: false,
            contactsSearchQuery: '',
            actionHistory: [],
            ...((overrides.view as Record<string, unknown> | undefined) ?? {}),
        },
    };
}

describe('SimulatorWithSession', () => {
    it('maps phone detail screens to the expected secondary menu tab', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;
        mockState.latestShellProps = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorWithSession, {
                    state: createState({
                        view: {
                            activeApp: 'phone',
                            showPrimaryMenu: false,
                            phone: { screen: 'add_contact', stack: [], chosenIndex: null },
                        },
                    }) as never,
                    dispatch: vi.fn(),
                })
            );
        });

        expect(renderer).not.toBeNull();
        const secondaryMenu = mockState.latestShellProps?.secondaryMenu as Record<string, unknown>;
        expect(secondaryMenu.activeId).toBe('contacts');
    });

    it('uses the prior email stack entry as the secondary menu active item', async () => {
        mockState.latestShellProps = null;

        await act(async () => {
            TestRenderer.create(
                React.createElement(SimulatorWithSession, {
                    state: createState({
                        view: {
                            activeApp: 'email',
                            showPrimaryMenu: false,
                            email: { screen: 'detail', stack: ['outbox'], selectedMessageId: 'm1' },
                        },
                    }) as never,
                    dispatch: vi.fn(),
                })
            );
        });

        const secondaryMenu = mockState.latestShellProps?.secondaryMenu as Record<string, unknown>;
        expect(secondaryMenu.activeId).toBe('outbox');
    });

    it('renders keyboard shortcuts in a native dialog when enabled and opened', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;
        const originalDocument = globalThis.document;
        (globalThis as Record<string, unknown>).document = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        };

        try {
            await act(async () => {
                renderer = TestRenderer.create(
                    React.createElement(SimulatorWithSession, {
                        state: createState() as never,
                        dispatch: vi.fn(),
                        developerTools: {
                            enabled: true,
                            sections: { shortcuts: true },
                        },
                    })
                );
            });

            const root = renderer!.root;
            await act(async () => {
                root.findByProps({ 'aria-label': 'Keyboard shortcuts' }).props.onClick();
            });

            expect(root.findByType('dialog').props.open).toBe(true);
            expect(root.findByType('dialog').props['aria-label']).toBe('Simulator keyboard shortcuts');
        } finally {
            (globalThis as Record<string, unknown>).document = originalDocument;
        }
    });

    it('ignores submit-form navigation when the current page target is missing and ignores invalid email selections', async () => {
        const dispatch = vi.fn();
        const onSimulatorEvent = vi.fn();
        mockState.latestRenderContext = null;

        await act(async () => {
            TestRenderer.create(
                React.createElement(SimulatorWithSession, {
                    state: createState({
                        payload: {
                            browser: {
                                pages: [
                                    { id: 'landing', submitTargetPageId: 'missing-target' },
                                ],
                                defaultPageId: 'landing',
                            },
                            email: {
                                inbox: [{ id: 'm1', subject: 'Inbox', from: 'sender@example.test' }],
                                selectedMessageId: null,
                                selectedMessage: null,
                            },
                        },
                        view: {
                            activeApp: 'internet',
                            internet: { screen: 'landing', stack: [] },
                        },
                    }) as never,
                    dispatch,
                    onSimulatorEvent,
                })
            );
        });

        const renderContext = mockState.latestRenderContext as {
            onAction: (action: unknown) => void;
            onSelectEmail: (messageId: string) => void;
        };

        await act(async () => {
            renderContext.onAction({ type: 'submit_form' });
            renderContext.onSelectEmail('missing-message');
        });

        expect(dispatch).toHaveBeenCalledWith({ type: 'SIMULATOR_ACTION', action: { type: 'submit_form' } });
        expect(dispatch).not.toHaveBeenCalledWith({ type: 'BROWSER_SCREEN', screen: 'missing-target' });
        expect(dispatch).not.toHaveBeenCalledWith({ type: 'SELECT_EMAIL', messageId: 'missing-message' });
        expect(onSimulatorEvent).toHaveBeenCalledWith(expect.objectContaining({ kind: 'form_submitted' }));
        expect(onSimulatorEvent).not.toHaveBeenCalledWith(
            expect.objectContaining({ kind: 'screen_viewed', app: 'internet', screen: 'missing-target' })
        );
    });
});
