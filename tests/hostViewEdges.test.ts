import React from 'react';
import { act, create } from 'react-test-renderer';
import { expect, it, vi } from 'vitest';
import { SimulatorCapabilitiesContext } from '../src/contract/capabilities';
import { getInitialSessionState } from '../src/state/simulatorSessionInitialState.js';
import {
    useSimulatorSessionHandlers,
    type UseSimulatorSessionHandlersResult,
} from '../src/hooks/useSimulatorSessionHandlers';
import { SimulatorActions } from '../src/actions/simulatorActions.js';
import { payload } from './support/hostEdgesSupport';

it('hides disabled developer controls and returns from contact detail to the list', async () => {
    const { default: Controls } =
        await import('../src/developer-tools/SimulatorDeveloperControlsBar.js');
    const controls = create(
        React.createElement(Controls, {
            showSnapshotExport: false,
            showNavGraph: false,
            enableKeyboardShortcuts: false,
            snapshotCopied: false,
            graphCopied: false,
            shortcutsHelpOpen: false,
            navGraph: null,
            onCopySnapshot: vi.fn(),
            onCopyNavGraph: vi.fn(),
            onToggleShortcutsHelp: vi.fn(),
        }),
    );
    expect(controls.toJSON()).toBeNull();
    controls.unmount();
    const { default: Contacts } = await import('../src/views/contacts/ContactsView.js');
    const contacts = create(
        React.createElement(Contacts, {
            contacts: [{ id: 'one', displayName: 'Ada' }],
            onBack: vi.fn(),
            initialSelectedContactId: 'one',
        }),
    );
    act(() =>
        contacts.root
            .findAllByType('button')
            .find((button) => button.props['aria-label'] === 'Back to list')
            ?.props.onClick(),
    );
    expect(contacts.root.findAllByType('input').length).toBeGreaterThan(0);
    contacts.unmount();
});
it('renders custom URL highlighting without losing surrounding address text', async () => {
    const { default: Chrome } = await import('../src/apps/browser/SimulatorBrowserChrome.js');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
        React.createElement(Chrome, {
            title: 'Example',
            url: 'prefix-domain-suffix',
            urlHighlightSegments: [
                { start: 7, end: 13 },
                { start: 0, end: 0 },
            ],
        }),
    );
    expect(html).toContain('prefix-');
    expect(html).toContain('domain');
    expect(html).toContain('-suffix');
    const full = renderToStaticMarkup(
        React.createElement(Chrome, {
            title: 'Example',
            url: 'domain',
            urlHighlightSegments: [{ start: 0, end: 6 }],
        }),
    );
    expect(full).toContain('domain');
});
it('labels a selected trash message with its folder', async () => {
    const { default: Email } = await import('../src/views/email/EmailSimulatorView.js');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
        React.createElement(Email, {
            payload: {
                inbox: [],
                outbox: [],
                trash: [{ id: 'one', subject: 'Deleted', from: 'ada' }],
                selectedMessage: null,
                selectedMessageId: 'one',
            },
            screen: 'detail',
            selectedMessageId: 'one',
            onAction: vi.fn(),
            onSelectMessage: vi.fn(),
            onBack: vi.fn(),
        }),
    );
    expect(html).toContain('Trash');
    expect(html).toContain('Deleted');
});
it('falls back from a failed conversation avatar and exposes loading status', async () => {
    const { default: Sms } = await import('../src/views/messages/SmsSimulatorView.js');
    const view = create(
        React.createElement(Sms, {
            payload: {
                thread: { messages: [] },
                visibleMessageCount: 0,
                avatarUrl: '/broken.png',
                loadingMessage: 'Fetching messages',
            },
            visibleCount: 0,
            onAction: vi.fn(),
            onRevealNext: vi.fn(),
        }),
    );
    act(() => view.root.findByType('img').props.onError());
    expect(view.root.findAllByType('img')).toHaveLength(0);
    expect(
        view.root
            .findAllByType('output')
            .some((output) => output.children.includes('Fetching messages')),
    ).toBe(true);
    view.unmount();
});
it.each(['phone', 'email'] as const)(
    'secondary %s menus do not treat the back item as a screen',
    async (app) => {
        const { useSimulatorSecondaryMenu } =
            await import('../src/hooks/useSimulatorSecondaryMenu.js');
        const { getSimulatorCapabilities } =
            await import('../src/utils/payload/simulatorCapabilities.js');
        const state = getInitialSessionState(
            payload({
                channel: app,
                entryPoint: { app, screen: app === 'phone' ? 'history' : 'list' },
            }),
        );
        state.view.showPrimaryMenu = false;
        const dispatch = vi.fn();
        let menu: ReturnType<typeof useSimulatorSecondaryMenu>;
        function Harness() {
            menu = useSimulatorSecondaryMenu(
                state.view,
                dispatch,
                getSimulatorCapabilities(state.payload).phone,
            );
            return null;
        }
        const view = create(React.createElement(Harness));
        act(() => menu?.onSelect('back'));
        expect(dispatch).not.toHaveBeenCalled();
        act(() => menu?.onSecondaryBack());
        expect(dispatch).toHaveBeenCalledWith({ type: 'BACK' });
        view.unmount();
    },
);
it('ignores selection in an unconfigured email app', () => {
    const state = getInitialSessionState(payload({ channel: 'email' }));
    const dispatch = vi.fn();
    let handlers: UseSimulatorSessionHandlersResult | undefined;
    function Harness() {
        handlers = useSimulatorSessionHandlers({ state, stateRef: { current: state }, dispatch });
        return null;
    }
    const view = create(React.createElement(Harness));
    act(() => handlers?.handleSelectEmail('missing'));
    expect(dispatch).not.toHaveBeenCalled();
    view.unmount();
});
it('navigates to a configured form target without an event observer', () => {
    const state = getInitialSessionState(
        payload({
            channel: 'browser',
            browser: {
                defaultPageId: 'form',
                pages: [
                    {
                        id: 'form',
                        url: 'https://example.test',
                        title: 'Form',
                        layout: 'form',
                        submitTargetPageId: 'done',
                    },
                    {
                        id: 'done',
                        url: 'https://example.test/done',
                        title: 'Done',
                        layout: 'content',
                    },
                ],
            },
        }),
    );
    state.view.internet.screen = 'form';
    const dispatch = vi.fn();
    let handlers: UseSimulatorSessionHandlersResult | undefined;
    function Harness() {
        handlers = useSimulatorSessionHandlers({ state, stateRef: { current: state }, dispatch });
        return null;
    }
    const view = create(React.createElement(Harness));
    act(() => handlers?.handleAction(SimulatorActions.submitForm()));
    expect(dispatch).toHaveBeenCalledWith({ type: 'BROWSER_SCREEN', screen: 'done' });
    view.unmount();
});
it('blocks SMS replies while showing a host-provided reason', async () => {
    const { default: Sms } = await import('../src/views/messages/SmsSimulatorView.js');
    const onAction = vi.fn();
    const view = create(
        React.createElement(
            SimulatorCapabilitiesContext.Provider,
            { value: { sendMessage: { state: 'unavailable', reason: 'Offline' } } },
            React.createElement(Sms, {
                payload: { thread: { messages: [] }, visibleMessageCount: 0 },
                visibleCount: 0,
                onAction,
                onRevealNext: vi.fn(),
                showReplyBox: true,
            }),
        ),
    );
    expect(
        view.root.findAllByType('output').some((output) => output.children.includes('Offline')),
    ).toBe(true);
    const form = view.root.findByType('form');
    act(() => form.props.onSubmit({ preventDefault() {} }));
    expect(onAction).not.toHaveBeenCalled();
    view.unmount();
});
it('does not report copied state when clipboard support is absent or writing is rejected', async () => {
    const { useSimulatorDeveloperControls } =
        await import('../src/developer-tools/useSimulatorDeveloperControls.js');
    const state = getInitialSessionState(payload({}));
    for (const navigator of [
        {},
        { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } },
    ]) {
        vi.stubGlobal('navigator', navigator);
        let controls: ReturnType<typeof useSimulatorDeveloperControls> | undefined;
        function Harness() {
            controls = useSimulatorDeveloperControls({
                state,
                stateRef: { current: state },
                dispatch: vi.fn(),
            });
            return null;
        }
        const view = create(React.createElement(Harness));
        try {
            await act(async () => {
                controls?.handleCopySnapshot();
                controls?.handleCopyNavGraph();
            });
            expect(controls?.snapshotCopied).toBe(false);
            expect(controls?.graphCopied).toBe(false);
        } finally {
            view.unmount();
            vi.unstubAllGlobals();
        }
    }
});
it('removes the keyboard listener on unmount and ignores unrelated keys', async () => {
    const { useSimulatorDeveloperControls } =
        await import('../src/developer-tools/useSimulatorDeveloperControls.js');
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    vi.stubGlobal('document', { addEventListener, removeEventListener });
    const state = getInitialSessionState(payload({}));
    const dispatch = vi.fn();
    const developerTools = { preset: 'preview' } as const;
    const stateRef = { current: state };
    function Harness() {
        useSimulatorDeveloperControls({ state, stateRef, dispatch, developerTools });
        return null;
    }
    let view: ReturnType<typeof create> | undefined;
    try {
        act(() => {
            view = create(React.createElement(Harness));
        });
        const callback: unknown = addEventListener.mock.calls[0]?.[1];
        if (typeof callback !== 'function') throw new Error('Keyboard listener not installed');
        const preventDefault = vi.fn();
        const stopPropagation = vi.fn();
        act(() => callback({ key: 'z', target: null, preventDefault, stopPropagation }));
        expect(dispatch).not.toHaveBeenCalled();
        expect(stopPropagation).not.toHaveBeenCalled();
        act(() => view?.unmount());
        expect(removeEventListener).toHaveBeenCalledWith('keydown', callback, true);
    } finally {
        view?.unmount();
        vi.unstubAllGlobals();
    }
});
it('keeps stable history rows on prepend without scenario reveal timers', async () => {
    const { default: Sms } = await import('../src/views/messages/SmsSimulatorView.js');
    vi.useFakeTimers();
    try {
        const onRevealNext = vi.fn();
        const message = {
            id: 'saved',
            from: 'them' as const,
            text: 'Saved message',
            delay_seconds: 1,
        };
        const props = {
            payload: {
                mode: 'history' as const,
                visibleMessageCount: 0,
                thread: { messages: [message] },
            },
            visibleCount: 0,
            onRevealNext,
            onAction: vi.fn(),
            showReplyBox: false,
        };
        const view = create(React.createElement(Sms, props));
        const row = view.root.findAllByType('li')[0];
        act(() =>
            view.update(
                React.createElement(Sms, {
                    ...props,
                    payload: {
                        ...props.payload,
                        thread: {
                            messages: [{ ...message, id: 'older', text: 'Older message' }, message],
                        },
                    },
                }),
            ),
        );
        expect(view.root.findAllByType('li')[1]).toBe(row);
        act(() => {
            vi.runAllTimers();
        });
        expect(onRevealNext).not.toHaveBeenCalled();
        view.unmount();
    } finally {
        vi.useRealTimers();
    }
});
it('keeps existing list rows mounted while announcing continuation', async () => {
    const { SimulatorListGroup } = await import('../src/ui/lists/SimulatorListGroup.js');
    const view = create(
        React.createElement(
            SimulatorListGroup,
            { search: null },
            React.createElement('button', null, 'Retained row'),
        ),
    );
    const row = view.root.findByType('button');
    act(() =>
        view.update(
            React.createElement(
                SimulatorListGroup,
                { search: null, loadingMore: true },
                React.createElement('button', null, 'Retained row'),
            ),
        ),
    );
    expect(view.root.findByType('button')).toBe(row);
    expect(view.root.findByType('section').props['aria-busy']).toBe(true);
    expect(view.root.findByType('output')).toBeTruthy();
    view.unmount();
});
