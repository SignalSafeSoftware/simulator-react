// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SmsSimulatorView from '../src/views/messages/SmsSimulatorView';
import {
    scriptedConversationVisibleCount,
    scriptedConversationVisibleMessages,
} from '../src/views/messages/scriptedConversationReveal';
import type { ScriptedConversationClock } from '../src/contract/scriptedConversationClock';
import { SmsMode, type SimulatorSmsPayload } from '../src/types/session';
import SimulatorWithSession from '../src/SimulatorWithSession';
import { fullDeviceToPayload } from '../src/adapters/deviceToSession';
import { getInitialSessionState } from '../src/state/simulatorSessionInitialState';

function conversation(id = 'A', prefix = id): SimulatorSmsPayload {
    return {
        mode: SmsMode.Scenario,
        visibleMessageCount: 99,
        thread: {
            id,
            sender_display_name: 'Same contact',
            messages: [
                { id: 'one', from: 'them', text: `${prefix} first`, delay_seconds: 0 },
                { id: 'two', from: 'them', text: `${prefix} second`, delay_seconds: 1 },
                { id: 'three', from: 'me', text: `${prefix} third`, delay_seconds: 0 },
                { id: 'four', from: 'them', text: `${prefix} fourth`, delay_seconds: 0.5 },
            ],
        },
    };
}
function texts(): string[] {
    const list = screen.getByRole('list', { name: 'Message timeline' });
    return within(list)
        .queryAllByRole('listitem')
        .map((item) => item.textContent ?? '');
}

afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('scripted conversation logical clock', () => {
    it('uses inclusive cumulative delays and stable authored ordering at equal times', () => {
        const messages = conversation().thread.messages;
        const original = JSON.stringify(messages);
        for (const [elapsed, count] of [
            [0, 1],
            [999, 1],
            [1000, 3],
            [1499, 3],
            [1500, 4],
        ])
            expect(scriptedConversationVisibleCount(messages, elapsed ?? 0)).toBe(count);
        expect(scriptedConversationVisibleCount([], 0)).toBe(0);
        expect(scriptedConversationVisibleCount([{ from: 'them', text: 'Immediate' }], 0)).toBe(1);
        expect(JSON.stringify(messages)).toBe(original);
    });

    it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
        'fails closed for invalid elapsed time %s',
        (elapsed) => {
            expect(scriptedConversationVisibleCount(conversation().thread.messages, elapsed)).toBe(
                0,
            );
        },
    );

    it('projects pause, speed-sized jumps, backward seek and replay without effects or timers', () => {
        vi.useFakeTimers();
        const payload = conversation();
        const original = JSON.stringify(payload);
        const onAction = vi.fn();
        const onRevealNext = vi.fn();
        const view = (clock: ScriptedConversationClock) => (
            <SmsSimulatorView
                payload={payload}
                visibleCount={99}
                onAction={onAction}
                onRevealNext={onRevealNext}
                scriptedConversationClock={clock}
            />
        );
        const rendered = render(view({ conversationId: 'A', elapsedMs: 0 }));
        expect(texts()).toEqual(['A first']);
        expect(vi.getTimerCount()).toBe(0);
        act(() => vi.advanceTimersByTime(60_000));
        expect(texts()).toEqual(['A first']);
        for (const [elapsedMs, expected] of [
            [1500, ['A first', 'A second', 'A third', 'A fourth']],
            [1000, ['A first', 'A second', 'A third']],
            [999, ['A first']],
            [0, ['A first']],
        ] as const) {
            rendered.rerender(view({ conversationId: 'A', elapsedMs }));
            expect(texts()).toEqual(expected);
        }
        expect(vi.getTimerCount()).toBe(0);
        expect(onAction).not.toHaveBeenCalled();
        expect(onRevealNext).not.toHaveBeenCalled();
        expect(JSON.stringify(payload)).toBe(original);
    });

    it('uses current source, exact conversation identity and a fresh origin on repeated entry', () => {
        vi.useFakeTimers();
        const onRevealNext = vi.fn();
        const onAction = vi.fn();
        const view = (payload: SimulatorSmsPayload, conversationId: string, elapsedMs: number) => (
            <SmsSimulatorView
                payload={payload}
                visibleCount={99}
                onAction={onAction}
                onRevealNext={onRevealNext}
                scriptedConversationClock={{ conversationId, elapsedMs }}
            />
        );
        const rendered = render(view(conversation('A'), 'A', 1500));
        expect(texts()).toHaveLength(4);
        rendered.rerender(view(conversation('B'), 'B', 0));
        expect(texts()).toEqual(['B first']);
        rendered.rerender(view(conversation('A'), 'A', 0));
        expect(texts()).toEqual(['A first']);
        rendered.rerender(view(conversation('A', 'Other source'), 'A', 1000));
        expect(texts()).toEqual([
            'Other source first',
            'Other source second',
            'Other source third',
        ]);
        rendered.rerender(view(conversation('A'), 'B', 1500));
        expect(texts()).toEqual([]);
        expect(vi.getTimerCount()).toBe(0);
        expect(onAction).not.toHaveBeenCalled();
        expect(onRevealNext).not.toHaveBeenCalled();
    });

    it('cancels pending fallback callbacks when controlled and cleans them up on unmount', () => {
        vi.useFakeTimers();
        const onRevealNext = vi.fn();
        const payload = conversation();
        const view = (clock?: ScriptedConversationClock) => (
            <SmsSimulatorView
                payload={payload}
                visibleCount={0}
                onAction={vi.fn()}
                onRevealNext={onRevealNext}
                scriptedConversationClock={clock}
            />
        );
        const rendered = render(view());
        expect(vi.getTimerCount()).toBe(4);
        rendered.rerender(view({ conversationId: 'A', elapsedMs: 0 }));
        expect(vi.getTimerCount()).toBe(0);
        act(() => vi.advanceTimersByTime(10_000));
        expect(onRevealNext).not.toHaveBeenCalled();
        rendered.rerender(view());
        act(() => vi.advanceTimersByTime(999));
        expect(onRevealNext).toHaveBeenCalledTimes(1);
        act(() => vi.advanceTimersByTime(1));
        expect(onRevealNext).toHaveBeenCalledTimes(3);
        rendered.unmount();
        expect(vi.getTimerCount()).toBe(0);
        act(() => vi.advanceTimersByTime(10_000));
        expect(onRevealNext).toHaveBeenCalledTimes(3);
    });

    it('keeps history immediately visible even with a mismatched or invalid clock', () => {
        vi.useFakeTimers();
        const payload = { ...conversation(), mode: SmsMode.History };
        const onRevealNext = vi.fn();
        render(
            <SmsSimulatorView
                payload={payload}
                visibleCount={0}
                onAction={vi.fn()}
                onRevealNext={onRevealNext}
                scriptedConversationClock={{ conversationId: 'wrong', elapsedMs: -1 }}
            />,
        );
        expect(texts()).toHaveLength(4);
        expect(vi.getTimerCount()).toBe(0);
        expect(onRevealNext).not.toHaveBeenCalled();
    });

    it('forwards logical time through the public session without dispatch or telemetry on seek', () => {
        vi.useFakeTimers();
        const state = getInitialSessionState(
            fullDeviceToPayload({
                entry_point: {
                    app: 'messages',
                    screen: 'thread_detail',
                    target: { kind: 'conversation', id: 'A' },
                },
                messages: { thread_detail: conversation().thread },
            }),
        );
        const original = JSON.stringify(state);
        const dispatch = vi.fn();
        const onSimulatorEvent = vi.fn();
        const view = (elapsedMs: number) => (
            <SimulatorWithSession
                state={state}
                dispatch={dispatch}
                onSimulatorEvent={onSimulatorEvent}
                scriptedConversationClock={{ conversationId: 'A', elapsedMs }}
            />
        );
        const rendered = render(view(1000));
        expect(texts()).toEqual(['A first', 'A second', 'A third']);
        rendered.rerender(view(0));
        expect(texts()).toEqual(['A first']);
        act(() => vi.advanceTimersByTime(10_000));
        expect(texts()).toEqual(['A first']);
        expect(dispatch).not.toHaveBeenCalled();
        expect(onSimulatorEvent).not.toHaveBeenCalled();
        expect(JSON.stringify(state)).toBe(original);
    });
});

it('exposes the conversation body anchor only once controlled content is actually revealed', () => {
    vi.useFakeTimers();
    const payload = conversation();
    payload.thread.messages[0] = { from: 'them', text: 'Delayed first', delay_seconds: 1 };
    const onRevealNext = vi.fn();
    const view = (elapsedMs: number) => (
        <SmsSimulatorView
            payload={payload}
            visibleCount={99}
            onAction={vi.fn()}
            onRevealNext={onRevealNext}
            scriptedConversationClock={{ conversationId: 'A', elapsedMs }}
        />
    );
    const rendered = render(view(999));
    const anchor = () =>
        rendered.container.querySelector('[data-simulator-anchor="conversation-body"]');
    expect(anchor()).toBeNull();
    expect(texts()).toEqual([]);
    rendered.rerender(view(1000));
    expect(anchor()?.getAttribute('data-simulator-record-id')).toBe('A');
    expect(texts()).toEqual(['Delayed first']);
    act(() => vi.advanceTimersByTime(5000));
    expect(texts()).toEqual(['Delayed first']);
    rendered.rerender(view(0));
    expect(anchor()).toBeNull();
    expect(texts()).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
    expect(onRevealNext).not.toHaveBeenCalled();
});

it.each(['before', 'after'] as const)(
    'reveals a local reply %s scripted rows immediately without consuming their delays',
    (position) => {
        vi.useFakeTimers();
        const original = conversation();
        const local = {
            id: 'runtime-reply',
            from: 'me',
            text: 'Live reply',
            delay_seconds: 10,
        } as const;
        const payload: SimulatorSmsPayload = {
            ...original,
            thread: {
                ...original.thread,
                messages:
                    position === 'before'
                        ? [local, ...original.thread.messages]
                        : [...original.thread.messages, local],
            },
        };
        const snapshot = JSON.stringify(payload);
        const onAction = vi.fn();
        const onRevealNext = vi.fn();
        const view = (elapsedMs: number) => (
            <SmsSimulatorView
                payload={payload}
                visibleCount={99}
                onAction={onAction}
                onRevealNext={onRevealNext}
                scriptedConversationClock={{
                    conversationId: 'A',
                    elapsedMs,
                    immediateMessageIds: ['runtime-reply'],
                }}
            />
        );
        const rendered = render(view(0));
        const authoredTexts = () => texts().filter((text) => text !== 'Live reply');
        expect(texts()).toContain('Live reply');
        expect(authoredTexts()).toEqual(['A first']);
        act(() => vi.advanceTimersByTime(10_000));
        expect(authoredTexts()).toEqual(['A first']);
        rendered.rerender(view(1000));
        expect(texts()).toContain('Live reply');
        expect(authoredTexts()).toEqual(['A first', 'A second', 'A third']);
        rendered.rerender(view(1500));
        expect(authoredTexts()).toEqual(['A first', 'A second', 'A third', 'A fourth']);
        rendered.rerender(view(0));
        expect(texts()).toContain('Live reply');
        expect(authoredTexts()).toEqual(['A first']);
        expect(onAction).not.toHaveBeenCalled();
        expect(onRevealNext).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
        expect(JSON.stringify(payload)).toBe(snapshot);
    },
);

it('keeps runtime exceptions scoped to an exact conversation and exact record IDs', () => {
    const payload = conversation();
    const view = (conversationId: string) => (
        <SmsSimulatorView
            payload={payload}
            visibleCount={99}
            onAction={vi.fn()}
            onRevealNext={vi.fn()}
            scriptedConversationClock={{
                conversationId,
                elapsedMs: 0,
                immediateMessageIds: ['other-thread-reply'],
            }}
        />
    );
    const rendered = render(view('A'));
    expect(texts()).toEqual(['A first']);
    rendered.rerender(view('B'));
    expect(texts()).toEqual([]);
});

it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'does not reveal local exceptions for an invalid clock %s',
    (elapsedMs) => {
        const messages = conversation().thread.messages;
        expect(scriptedConversationVisibleMessages(messages, elapsedMs, ['one', 'two'])).toEqual(
            [],
        );
    },
);

it('does not restart reveal timers after an actual controlled reply changes the message payload', () => {
    vi.useFakeTimers();
    const source = conversation();
    const before = JSON.stringify(source);
    const onAction = vi.fn();
    const onRevealNext = vi.fn();
    function ControlledReply({ elapsedMs }: { elapsedMs: number }) {
        const [messages, setMessages] = React.useState(source.thread.messages);
        return (
            <SmsSimulatorView
                payload={{ ...source, thread: { ...source.thread, messages } }}
                visibleCount={99}
                onAction={(action) => {
                    onAction(action);
                    if (action.type === 'send_reply')
                        setMessages((previous) => [
                            ...previous,
                            { id: 'runtime-send', from: 'me', text: action.replyText ?? '' },
                        ]);
                }}
                onRevealNext={onRevealNext}
                scriptedConversationClock={{
                    conversationId: 'A',
                    elapsedMs,
                    immediateMessageIds: ['runtime-send'],
                }}
            />
        );
    }
    const rendered = render(<ControlledReply elapsedMs={0} />);
    expect(texts()).toEqual(['A first']);
    fireEvent.change(screen.getByRole('textbox', { name: 'Reply to message' }), {
        target: { value: 'Actual controlled reply' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(texts()).toEqual(['A first', 'Actual controlled reply']);
    expect(onAction).toHaveBeenCalledExactlyOnceWith({
        type: 'send_reply',
        replyText: 'Actual controlled reply',
    });
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(60_000));
    expect(texts()).toEqual(['A first', 'Actual controlled reply']);
    expect(onRevealNext).not.toHaveBeenCalled();
    rendered.rerender(<ControlledReply elapsedMs={1000} />);
    expect(texts()).toEqual(['A first', 'A second', 'A third', 'Actual controlled reply']);
    rendered.rerender(<ControlledReply elapsedMs={0} />);
    expect(texts()).toEqual(['A first', 'Actual controlled reply']);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onRevealNext).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(JSON.stringify(source)).toBe(before);
});
