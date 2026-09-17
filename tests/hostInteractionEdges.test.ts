import React from 'react';
import { act, create } from 'react-test-renderer';
import { expect, it, vi } from 'vitest';
import { SimulatorCapabilitiesContext } from '../src/contract/capabilities';
import EmailComposeView from '../src/views/EmailComposeView';
import MessagesNewThreadView from '../src/views/MessagesNewThreadView';
import PhoneCallView, { formatPhoneCallDuration } from '../src/views/PhoneCallView';
import MessagesThreadListView from '../src/views/MessagesThreadListView';
import SimulatorWithSession from '../src/SimulatorWithSession';
import { getInitialSessionState } from '../src/state/simulatorSessionReducer';
import { useSimulatorSessionHandlers, type UseSimulatorSessionHandlersResult } from '../src/hooks/useSimulatorSessionHandlers';
import { SimulatorActions } from '../src/actions';
import { createSimulatorNavigationDispatch } from '../src/contract/navigation';
import type { SimulatorTemplatePayload } from '../src/types/session';
import { updateSimulatorPayload } from '../src/datasource/datasource';

function payload(overrides: Partial<SimulatorTemplatePayload>): SimulatorTemplatePayload {
    return {
        templateId: null, templateKey: 'test', name: 'Test', channel: 'phone', topicTags: [],
        runId: null, attemptId: null, entryPoint: null, device: null, email: null, sms: null,
        browser: null, phone: null, contacts: null, directory: null, home: null, ...overrides,
    };
}

it('exposes blocked compose capabilities without attempting delivery', async () => {
    const send = vi.fn();
    for (const element of [React.createElement(EmailComposeView, { onSend: send, onCancel: vi.fn() }), React.createElement(MessagesNewThreadView, { onSend: send, onBack: vi.fn() })]) {
        const view = create(React.createElement(SimulatorCapabilitiesContext.Provider, { value: { sendEmail: { state: 'unavailable', reason: 'Offline' }, sendMessage: { state: 'unavailable', reason: 'Offline' } } }, element));
        expect(view.root.findByType('output').children).toEqual(['Offline']);
        await act(async () => view.root.findByType('form').props.onSubmit({ preventDefault() {} }));
        expect(send).not.toHaveBeenCalled(); view.unmount();
    }
});
it('shows a safe generic error for a non-Error email rejection', async () => {
    const onCancel = vi.fn();
    const view = create(React.createElement(EmailComposeView, { onSend: vi.fn().mockRejectedValue('internal'), onCancel, draft: { to: 'ada@example.test', bcc: '', subject: '', body: '' } }));
    await act(async () => view.root.findByType('form').props.onSubmit({ preventDefault() {} }));
    expect(view.root.findByProps({ role: 'alert' }).children.join('')).not.toContain('internal');
    expect(onCancel).not.toHaveBeenCalled(); view.unmount();
});
it('shows a safe generic error for a non-Error message rejection', async () => {
    const view = create(React.createElement(MessagesNewThreadView, { onSend: vi.fn().mockRejectedValue('internal'), onBack: vi.fn() }));
    act(() => view.root.findByType('input').props.onChange({ target: { value: '123' } }));
    act(() => view.root.findByType('textarea').props.onChange({ target: { value: 'hello' } }));
    await act(async () => view.root.findByType('form').props.onSubmit({ preventDefault() {} }));
    expect(view.root.findByProps({ role: 'alert' }).children.join('')).not.toContain('internal'); view.unmount();
});
it('renders connected, muted and reconnecting call states with safe durations', () => {
    expect(formatPhoneCallDuration(Infinity)).toBe('00:00');
    const props = { incoming: false, callerName: 'Ada', connectedAt: Date.now(), muted: true, digits: '', onAnswer: vi.fn(), onHangup: vi.fn(), onMute: vi.fn(), onDigit: vi.fn() };
    for (const phase of ['connected', 'reconnecting'] as const) {
        const view = create(React.createElement(PhoneCallView, { ...props, phase }));
        expect(view.root.findByType('output').children.join('')).not.toBe('');
        act(() => view.unmount());
    }
});
it('falls back to the profile icon when a thread avatar fails', () => {
    const view = create(React.createElement(MessagesThreadListView, { threads: [{ id: 'one', preview: 'Hi', avatarUrl: '/broken.png' }], onSelectThread: vi.fn() }));
    act(() => view.root.findByType('img').props.onError());
    expect(view.root.findAllByType('img')).toHaveLength(0); view.unmount();
});
it('routes a host screen override through the navigation observer', () => {
    const state = getInitialSessionState(payload({ channel: 'phone', entryPoint: { app: 'phone', screen: 'history' } }));
    const dispatch = vi.fn(); const onNavigationEvent = vi.fn();
    const view = create(React.createElement(SimulatorWithSession, { state, dispatch, onNavigationEvent, screenOverrides: { phone: { history: ({ onBack }) => React.createElement('button', { onClick: onBack }, 'Host back') } } }));
    act(() => view.root.findAllByType('button').find(button => button.children.includes('Host back'))?.props.onClick());
    expect(onNavigationEvent).toHaveBeenCalled(); expect(dispatch).toHaveBeenCalledWith({ type: 'BACK' }); view.unmount();
});
it('reconciles selection in existing folders and clears removed messages without changing the folder', () => {
    const state = getInitialSessionState(payload({ channel: 'email', email: { inbox: [{ id: 'one', subject: 'Hi', from: 'ada' }], selectedMessage: null, selectedMessageId: 'one' } }));
    state.view.email.selectedMessageId = 'one'; state.view.email.screen = 'outbox';
    expect(updateSimulatorPayload(state, state.payload).view).toBe(state.view);
    const next = updateSimulatorPayload(state, { ...state.payload, email: null });
    expect(next.view.email.selectedMessageId).toBeNull(); expect(next.view.email.screen).toBe('outbox');
});
it('delegates non-navigation actions and classifies open-app actions', () => {
    const state = getInitialSessionState(payload({ channel: 'phone' })); const dispatch = vi.fn(); const onNavigation = vi.fn();
    const send = createSimulatorNavigationDispatch({ getState: () => state, dispatch, onNavigation });
    send({ type: 'SIMULATOR_ACTION', action: SimulatorActions.openApp('email') });
    expect(onNavigation).toHaveBeenCalledWith(expect.objectContaining({ kind: 'app' }));
    send({ type: 'SIMULATOR_ACTION', action: SimulatorActions.openContact('one') });
    expect(dispatch).toHaveBeenCalledTimes(2);
});
it.each([false, true])('session handlers work with event reporting enabled=%s', report => {
    const state = getInitialSessionState(payload({ channel: 'email', email: { inbox: [{ id: 'one', subject: 'Hi', from: 'ada' }], selectedMessage: null, selectedMessageId: null } }));
    const dispatch = vi.fn(); const onSimulatorEvent = report ? vi.fn() : undefined;
    let handlers: UseSimulatorSessionHandlersResult | undefined;
    function Harness() {
        handlers = useSimulatorSessionHandlers({ state, stateRef: { current: state }, dispatch, onSimulatorEvent });
        return null;
    }
    const view = create(React.createElement(Harness));
    if (!handlers) throw new Error('Handler harness did not mount');
    act(() => {
        handlers?.onToggleContactsPanel();
        handlers?.handleChannelChange('phone');
        handlers?.handleSelectEmail('one');
        handlers?.handleSelectThread('thread');
        handlers?.handleOpenContactFromPhone('contact');
        handlers?.handleSmsRevealNext();
        handlers?.handleAction(SimulatorActions.submitForm({}));
    });
    expect(dispatch).toHaveBeenCalledWith({ type: 'SELECT_EMAIL', messageId: 'one' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'SMS_REVEAL_NEXT' });
    if (onSimulatorEvent) expect(onSimulatorEvent).toHaveBeenCalled(); view.unmount();
});

it('keeps compose drafts controlled by the host', async () => {
    const { MessageComposeContext } = await import('../src/views/messageComposeContract');
    const onChange = vi.fn();
    const view = create(React.createElement(MessageComposeContext.Provider, { value: { draft: { phoneNumber: '123', messageBody: 'hello' }, onChange, onSend: vi.fn() } }, React.createElement(MessagesNewThreadView, { onBack: vi.fn() })));
    act(() => view.root.findByType('input').props.onChange({ target: { value: '456' } }));
    expect(onChange).toHaveBeenLastCalledWith({ phoneNumber: '456', messageBody: 'hello' });
    act(() => view.root.findByType('textarea').props.onChange({ target: { value: 'updated' } }));
    expect(onChange).toHaveBeenLastCalledWith({ phoneNumber: '123', messageBody: 'updated' });
    view.unmount();
});
it('updates a dial draft from typed input and rejects submission when calling is unavailable', async () => {
    const { default: PhoneDialView } = await import('../src/views/PhoneDialView');
    const onDial = vi.fn();
    const view = create(React.createElement(SimulatorCapabilitiesContext.Provider, { value: { call: { state: 'unavailable', reason: 'Offline' } } }, React.createElement(PhoneDialView, { onDial })));
    act(() => view.root.findByType('input').props.onChange({ target: { value: '123' } }));
    expect(view.root.findByType('input').props.value).toBe('123');
    act(() => view.root.findByType('form').props.onSubmit({ preventDefault() {} }));
    expect(onDial).not.toHaveBeenCalled(); view.unmount();
});

it('hides disabled developer controls and returns from contact detail to the list', async () => {
    const { default: Controls } = await import('../src/components/SimulatorDeveloperControlsBar');
    const controls = create(React.createElement(Controls, { showSnapshotExport: false, showNavGraph: false, enableKeyboardShortcuts: false, snapshotCopied: false, graphCopied: false, shortcutsHelpOpen: false, navGraph: null, onCopySnapshot: vi.fn(), onCopyNavGraph: vi.fn(), onToggleShortcutsHelp: vi.fn() }));
    expect(controls.toJSON()).toBeNull(); controls.unmount();
    const { default: Contacts } = await import('../src/views/ContactsView');
    const contacts = create(React.createElement(Contacts, { contacts: [{ id: 'one', displayName: 'Ada' }], onBack: vi.fn(), initialSelectedContactId: 'one' }));
    act(() => contacts.root.findAllByType('button').find(button => button.props['aria-label'] === 'Back to list')?.props.onClick());
    expect(contacts.root.findAllByType('input').length).toBeGreaterThan(0); contacts.unmount();
});
it('renders custom URL highlighting without losing surrounding address text', async () => {
    const { default: Chrome } = await import('../src/components/SimulatorBrowserChrome');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(React.createElement(Chrome, { title: 'Example', url: 'prefix-domain-suffix', urlHighlightSegments: [{ start: 7, end: 13 }, { start: 0, end: 0 }] }));
    expect(html).toContain('prefix-'); expect(html).toContain('domain'); expect(html).toContain('-suffix');
    const full = renderToStaticMarkup(React.createElement(Chrome, { title: 'Example', url: 'domain', urlHighlightSegments: [{ start: 0, end: 6 }] }));
    expect(full).toContain('domain');
});

it('labels a selected trash message with its folder', async () => {
    const { default: Email } = await import('../src/views/EmailSimulatorView');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(React.createElement(Email, { payload: { inbox: [], outbox: [], trash: [{ id: 'one', subject: 'Deleted', from: 'ada' }], selectedMessage: null, selectedMessageId: 'one' }, screen: 'detail', selectedMessageId: 'one', onAction: vi.fn(), onSelectMessage: vi.fn(), onBack: vi.fn() }));
    expect(html).toContain('Trash'); expect(html).toContain('Deleted');
});
it('falls back from a failed conversation avatar and exposes loading status', async () => {
    const { default: Sms } = await import('../src/views/SmsSimulatorView');
    const view = create(React.createElement(Sms, { payload: { thread: { messages: [] }, visibleMessageCount: 0, avatarUrl: '/broken.png', loadingMessage: 'Fetching messages' }, visibleCount: 0, onAction: vi.fn(), onRevealNext: vi.fn() }));
    act(() => view.root.findByType('img').props.onError());
    expect(view.root.findAllByType('img')).toHaveLength(0);
    expect(view.root.findAllByType('output').some(output => output.children.includes('Fetching messages'))).toBe(true);
    view.unmount();
});

it.each(['phone', 'email'] as const)('secondary %s menus do not treat the back item as a screen', async app => {
    const { useSimulatorSecondaryMenu } = await import('../src/hooks/useSimulatorSecondaryMenu');
    const { getSimulatorCapabilities } = await import('../src/utils/simulatorCapabilities');
    const state = getInitialSessionState(payload({ channel: app, entryPoint: { app, screen: app === 'phone' ? 'history' : 'list' } }));
    state.view.showPrimaryMenu = false;
    const dispatch = vi.fn();
    let menu: ReturnType<typeof useSimulatorSecondaryMenu>;
    function Harness() { menu = useSimulatorSecondaryMenu(state.view, dispatch, getSimulatorCapabilities(state.payload).phone); return null; }
    const view = create(React.createElement(Harness));
    act(() => menu?.onSelect('back'));
    expect(dispatch).not.toHaveBeenCalled();
    act(() => menu?.onSecondaryBack());
    expect(dispatch).toHaveBeenCalledWith({ type: 'BACK' }); view.unmount();
});
it('ignores selection in an unconfigured email app', () => {
    const state = getInitialSessionState(payload({ channel: 'email' })); const dispatch = vi.fn();
    let handlers: UseSimulatorSessionHandlersResult | undefined;
    function Harness() { handlers = useSimulatorSessionHandlers({ state, stateRef: { current: state }, dispatch }); return null; }
    const view = create(React.createElement(Harness));
    act(() => handlers?.handleSelectEmail('missing'));
    expect(dispatch).not.toHaveBeenCalled(); view.unmount();
});
it('navigates to a configured form target without an event observer', () => {
    const state = getInitialSessionState(payload({ channel: 'browser', browser: { defaultPageId: 'form', pages: [{ id: 'form', url: 'https://example.test', title: 'Form', layout: 'form', submitTargetPageId: 'done' }, { id: 'done', url: 'https://example.test/done', title: 'Done', layout: 'content' }] } }));
    state.view.internet.screen = 'form';
    const dispatch = vi.fn(); let handlers: UseSimulatorSessionHandlersResult | undefined;
    function Harness() { handlers = useSimulatorSessionHandlers({ state, stateRef: { current: state }, dispatch }); return null; }
    const view = create(React.createElement(Harness));
    act(() => handlers?.handleAction(SimulatorActions.submitForm()));
    expect(dispatch).toHaveBeenCalledWith({ type: 'BROWSER_SCREEN', screen: 'done' }); view.unmount();
});
it('blocks SMS replies while showing a host-provided reason', async () => {
    const { default: Sms } = await import('../src/views/SmsSimulatorView');
    const onAction = vi.fn();
    const view = create(React.createElement(SimulatorCapabilitiesContext.Provider, { value: { sendMessage: { state: 'unavailable', reason: 'Offline' } } }, React.createElement(Sms, { payload: { thread: { messages: [] }, visibleMessageCount: 0 }, visibleCount: 0, onAction, onRevealNext: vi.fn(), showReplyBox: true })));
    expect(view.root.findAllByType('output').some(output => output.children.includes('Offline'))).toBe(true);
    const form = view.root.findByType('form');
    act(() => form.props.onSubmit({ preventDefault() {} }));
    expect(onAction).not.toHaveBeenCalled(); view.unmount();
});

it('does not report copied state when clipboard support is absent or writing is rejected', async () => {
    const { useSimulatorDeveloperControls } = await import('../src/hooks/useSimulatorDeveloperControls');
    const state = getInitialSessionState(payload({}));
    for (const navigator of [{}, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } }]) {
        vi.stubGlobal('navigator', navigator);
        let controls: ReturnType<typeof useSimulatorDeveloperControls> | undefined;
        function Harness() { controls = useSimulatorDeveloperControls({ state, stateRef: { current: state }, dispatch: vi.fn() }); return null; }
        const view = create(React.createElement(Harness));
        try {
            await act(async () => { controls?.handleCopySnapshot(); controls?.handleCopyNavGraph(); });
            expect(controls?.snapshotCopied).toBe(false); expect(controls?.graphCopied).toBe(false);
        } finally { view.unmount(); vi.unstubAllGlobals(); }
    }
});

it('removes the keyboard listener on unmount and ignores unrelated keys', async () => {
    const { useSimulatorDeveloperControls } = await import('../src/hooks/useSimulatorDeveloperControls');
    const addEventListener = vi.fn(); const removeEventListener = vi.fn();
    vi.stubGlobal('document', { addEventListener, removeEventListener });
    const state = getInitialSessionState(payload({})); const dispatch = vi.fn();
    const developerTools = { preset: 'preview' } as const;
    const stateRef = { current: state };
    function Harness() { useSimulatorDeveloperControls({ state, stateRef, dispatch, developerTools }); return null; }
    let view: ReturnType<typeof create> | undefined;
    try {
        act(() => { view = create(React.createElement(Harness)); });
        const callback: unknown = addEventListener.mock.calls[0]?.[1];
        if (typeof callback !== 'function') throw new Error('Keyboard listener not installed');
        const preventDefault = vi.fn(); const stopPropagation = vi.fn();
        act(() => callback({ key: 'z', target: null, preventDefault, stopPropagation }));
        expect(dispatch).not.toHaveBeenCalled(); expect(stopPropagation).not.toHaveBeenCalled();
        act(() => view?.unmount());
        expect(removeEventListener).toHaveBeenCalledWith('keydown', callback, true);
    } finally { view?.unmount(); vi.unstubAllGlobals(); }
});
