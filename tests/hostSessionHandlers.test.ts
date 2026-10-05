import React from 'react';
import { act, create } from 'react-test-renderer';
import { expect, it, vi } from 'vitest';
import { SimulatorCapabilitiesContext } from '../src/contract/capabilities';
import EmailComposeView from '../src/views/email/EmailComposeView';
import MessagesNewThreadView from '../src/views/messages/MessagesNewThreadView';
import PhoneCallView from '../src/views/phone/PhoneCallView.js';
import { formatPhoneCallDuration } from '../src/views/phone/PhoneCallView.js';
import MessagesThreadListView from '../src/views/messages/MessagesThreadListView';
import SimulatorWithSession from '../src/SimulatorWithSession';
import { getInitialSessionState } from '../src/state/simulatorSessionInitialState.js';
import {
    useSimulatorSessionHandlers,
    type UseSimulatorSessionHandlersResult,
} from '../src/hooks/useSimulatorSessionHandlers';
import { SimulatorActions } from '../src/actions/simulatorActions.js';
import { createSimulatorNavigationDispatch } from '../src/contract/navigation';
import { updateSimulatorPayload } from '../src/datasource/datasource';
import { payload } from './support/hostEdgesSupport';

it('exposes blocked compose capabilities without attempting delivery', async () => {
    const send = vi.fn();
    for (const element of [
        React.createElement(EmailComposeView, { onSend: send, onCancel: vi.fn() }),
        React.createElement(MessagesNewThreadView, { onSend: send, onBack: vi.fn() }),
    ]) {
        const view = create(
            React.createElement(
                SimulatorCapabilitiesContext.Provider,
                {
                    value: {
                        sendEmail: { state: 'unavailable', reason: 'Offline' },
                        sendMessage: { state: 'unavailable', reason: 'Offline' },
                    },
                },
                element,
            ),
        );
        expect(view.root.findByType('output').children).toEqual(['Offline']);
        await act(async () => view.root.findByType('form').props.onSubmit({ preventDefault() {} }));
        expect(send).not.toHaveBeenCalled();
        view.unmount();
    }
});
it('shows a safe generic error for a non-Error email rejection', async () => {
    const onCancel = vi.fn();
    const view = create(
        React.createElement(EmailComposeView, {
            onSend: vi.fn().mockRejectedValue('internal'),
            onCancel,
            draft: { to: 'ada@example.test', bcc: '', subject: '', body: '' },
        }),
    );
    await act(async () => view.root.findByType('form').props.onSubmit({ preventDefault() {} }));
    expect(view.root.findByProps({ role: 'alert' }).children.join('')).not.toContain('internal');
    expect(onCancel).not.toHaveBeenCalled();
    view.unmount();
});
it('shows a safe generic error for a non-Error message rejection', async () => {
    const view = create(
        React.createElement(MessagesNewThreadView, {
            onSend: vi.fn().mockRejectedValue('internal'),
            onBack: vi.fn(),
        }),
    );
    act(() => view.root.findByType('input').props.onChange({ target: { value: '123' } }));
    act(() => view.root.findByType('textarea').props.onChange({ target: { value: 'hello' } }));
    await act(async () => view.root.findByType('form').props.onSubmit({ preventDefault() {} }));
    expect(view.root.findByProps({ role: 'alert' }).children.join('')).not.toContain('internal');
    view.unmount();
});
it('renders connected, muted and reconnecting call states with safe durations', () => {
    expect(formatPhoneCallDuration(Infinity)).toBe('00:00');
    const props = {
        incoming: false,
        callerName: 'Ada',
        connectedAt: Date.now(),
        muted: true,
        digits: '',
        onAnswer: vi.fn(),
        onHangup: vi.fn(),
        onMute: vi.fn(),
        onDigit: vi.fn(),
    };
    for (const phase of ['connected', 'reconnecting'] as const) {
        const view = create(React.createElement(PhoneCallView, { ...props, phase }));
        expect(view.root.findByType('output').children.join('')).not.toBe('');
        act(() => view.unmount());
    }
});
it('falls back to the profile icon when a thread avatar fails', () => {
    const view = create(
        React.createElement(MessagesThreadListView, {
            threads: [{ id: 'one', preview: 'Hi', avatarUrl: '/broken.png' }],
            onSelectThread: vi.fn(),
        }),
    );
    act(() => view.root.findByType('img').props.onError());
    expect(view.root.findAllByType('img')).toHaveLength(0);
    view.unmount();
});
it('routes a host screen override through the navigation observer', () => {
    const state = getInitialSessionState(
        payload({ channel: 'phone', entryPoint: { app: 'phone', screen: 'history' } }),
    );
    const dispatch = vi.fn();
    const onNavigationEvent = vi.fn();
    const view = create(
        React.createElement(SimulatorWithSession, {
            state,
            dispatch,
            onNavigationEvent,
            screenOverrides: {
                phone: {
                    history: ({ onBack }) =>
                        React.createElement('button', { onClick: onBack }, 'Host back'),
                },
            },
        }),
    );
    act(() =>
        view.root
            .findAllByType('button')
            .find((button) => button.children.includes('Host back'))
            ?.props.onClick(),
    );
    expect(onNavigationEvent).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: 'BACK' });
    view.unmount();
});
it('reconciles selection in existing folders and clears removed messages without changing the folder', () => {
    const state = getInitialSessionState(
        payload({
            channel: 'email',
            email: {
                inbox: [{ id: 'one', subject: 'Hi', from: 'ada' }],
                selectedMessage: null,
                selectedMessageId: 'one',
            },
        }),
    );
    state.view.email.selectedMessageId = 'one';
    state.view.email.screen = 'outbox';
    expect(updateSimulatorPayload(state, state.payload).view).toBe(state.view);
    const next = updateSimulatorPayload(state, { ...state.payload, email: null });
    expect(next.view.email.selectedMessageId).toBeNull();
    expect(next.view.email.screen).toBe('outbox');
});
it('delegates non-navigation actions and classifies open-app actions', () => {
    const state = getInitialSessionState(payload({ channel: 'phone' }));
    const dispatch = vi.fn();
    const onNavigation = vi.fn();
    const send = createSimulatorNavigationDispatch({
        getState: () => state,
        dispatch,
        onNavigation,
    });
    send({ type: 'SIMULATOR_ACTION', action: SimulatorActions.openApp('email') });
    expect(onNavigation).toHaveBeenCalledWith(expect.objectContaining({ kind: 'app' }));
    send({ type: 'SIMULATOR_ACTION', action: SimulatorActions.openContact('one') });
    expect(dispatch).toHaveBeenCalledTimes(2);
});
it.each([false, true])('session handlers work with event reporting enabled=%s', (report) => {
    const state = getInitialSessionState(
        payload({
            channel: 'email',
            email: {
                inbox: [{ id: 'one', subject: 'Hi', from: 'ada' }],
                selectedMessage: null,
                selectedMessageId: null,
            },
        }),
    );
    const dispatch = vi.fn();
    const onSimulatorEvent = report ? vi.fn() : undefined;
    let handlers: UseSimulatorSessionHandlersResult | undefined;
    function Harness() {
        handlers = useSimulatorSessionHandlers({
            state,
            stateRef: { current: state },
            dispatch,
            onSimulatorEvent,
        });
        return null;
    }
    const view = create(React.createElement(Harness));
    if (!handlers) throw new Error('Handler harness did not mount');
    act(() => {
        handlers?.onToggleContactsPanel();
        handlers?.handleChannelChange('phone');
        handlers?.handleChannelChange('unknown-channel');
        handlers?.handleSelectEmail('one');
        handlers?.handleSelectThread('thread');
        handlers?.handleOpenContactFromPhone('contact');
        handlers?.handleSmsRevealNext();
        handlers?.handleAction(SimulatorActions.submitForm({}));
    });
    expect(dispatch).toHaveBeenCalledWith({ type: 'SELECT_EMAIL', messageId: 'one' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'SMS_REVEAL_NEXT' });
    expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ channel: 'unknown-channel' }),
    );
    if (onSimulatorEvent) expect(onSimulatorEvent).toHaveBeenCalled();
    view.unmount();
});
it('keeps compose drafts controlled by the host', async () => {
    const { MessageComposeContext } = await import('../src/contract/messageComposeContract.js');
    const onChange = vi.fn();
    const view = create(
        React.createElement(
            MessageComposeContext.Provider,
            {
                value: {
                    draft: { phoneNumber: '123', messageBody: 'hello' },
                    onChange,
                    onSend: vi.fn(),
                },
            },
            React.createElement(MessagesNewThreadView, { onBack: vi.fn() }),
        ),
    );
    act(() => view.root.findByType('input').props.onChange({ target: { value: '456' } }));
    expect(onChange).toHaveBeenLastCalledWith({ phoneNumber: '456', messageBody: 'hello' });
    act(() => view.root.findByType('textarea').props.onChange({ target: { value: 'updated' } }));
    expect(onChange).toHaveBeenLastCalledWith({ phoneNumber: '123', messageBody: 'updated' });
    view.unmount();
});
it('updates a dial draft from typed input and rejects submission when calling is unavailable', async () => {
    const { default: PhoneDialView } = await import('../src/views/phone/PhoneDialView.js');
    const onDial = vi.fn();
    const view = create(
        React.createElement(
            SimulatorCapabilitiesContext.Provider,
            { value: { call: { state: 'unavailable', reason: 'Offline' } } },
            React.createElement(PhoneDialView, { onDial }),
        ),
    );
    act(() => view.root.findByType('input').props.onChange({ target: { value: '123' } }));
    expect(view.root.findByType('input').props.value).toBe('123');
    act(() => view.root.findByType('form').props.onSubmit({ preventDefault() {} }));
    expect(onDial).not.toHaveBeenCalled();
    view.unmount();
});
