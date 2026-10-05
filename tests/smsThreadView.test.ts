import type { ReactTestRenderer } from 'react-test-renderer';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SmsSimulatorView from '../src/views/messages/SmsSimulatorView';
import { TestRenderer, act } from './reactTestRenderer';
import { flattenText } from './support/phonePanelsSupport';

afterEach(() => {
    vi.useRealTimers();
});

describe('sms thread view', () => {
    it('covers sms thread rendering, delayed reveal, attachments, and reply actions', async () => {
        vi.useFakeTimers();
        const onAction = vi.fn();
        const onRevealNext = vi.fn();
        const onBack = vi.fn();
        let smsRenderer: ReactTestRenderer | null = null;

        await act(async () => {
            smsRenderer = TestRenderer.create(
                React.createElement(SmsSimulatorView, {
                    payload: null,
                    visibleCount: 0,
                    onAction,
                    onRevealNext,
                }),
            );
        });
        expect(flattenText(smsRenderer!.toJSON())).toContain('No messages for this scenario.');

        await act(async () => {
            smsRenderer!.update(
                React.createElement(SmsSimulatorView, {
                    payload: {
                        thread: {
                            messages: [
                                {
                                    from: 'them',
                                    text: 'Hello',
                                    delay_seconds: 1,
                                    timestamp: '09:00',
                                },
                                {
                                    from: 'me',
                                    text: 'Attachment',
                                    attachment: { label: 'invoice.pdf', url: '/invoice.pdf' },
                                    delay_seconds: 1,
                                },
                                {
                                    from: 'them',
                                    text: 'No url attachment',
                                    attachment: { label: 'note.txt' },
                                },
                            ],
                            sender_display_name: 'Security Team',
                            links: [
                                { href: 'https://example.test', text: 'Open example' },
                                {
                                    href: 'https://example.test/doc',
                                    text: 'Doc',
                                    title: 'Reference',
                                },
                            ],
                        },
                        visibleMessageCount: 3,
                    },
                    visibleCount: 3,
                    onAction,
                    onRevealNext,
                    onBack,
                    showReplyBox: true,
                }),
            );
        });
        await act(async () => {
            vi.runAllTimers();
        });
        expect(onRevealNext).toHaveBeenCalledTimes(3);
        await act(async () => {
            smsRenderer!.root.findByProps({ 'aria-label': 'Open: invoice.pdf' }).props.onClick();
            smsRenderer!.root.findByProps({ 'aria-label': 'Link: Open example' }).props.onClick();
            smsRenderer!.root.findByProps({ 'aria-label': 'Link: Doc' }).props.onClick();
            smsRenderer!.root
                .findByProps({ 'aria-label': 'Reply to message' })
                .props.onChange({ target: { value: ' Reply ' } });
        });
        await act(async () => {
            smsRenderer!.root.findByType('form').props.onSubmit({ preventDefault() {} });
        });
        expect(onAction).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'click_link', href: '/invoice.pdf' }),
        );
        expect(onAction).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'click_link', href: 'https://example.test' }),
        );
        expect(onAction).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'send_reply', replyText: 'Reply' }),
        );
        expect(onBack).not.toHaveBeenCalled();

        await act(async () => {
            smsRenderer!.update(
                React.createElement(SmsSimulatorView, {
                    payload: {
                        thread: { messages: [], sender_number: '+1555' },
                        visibleMessageCount: 0,
                    },
                    visibleCount: 0,
                    onAction,
                    onRevealNext,
                    showReplyBox: false,
                }),
            );
        });
        expect(flattenText(smsRenderer!.toJSON())).toContain('No messages in this thread.');
    });

    it('covers sms sender fallbacks, null delayed messages, and enter-to-send replies', async () => {
        vi.useFakeTimers();
        const onAction = vi.fn();
        const onRevealNext = vi.fn();
        let renderer: ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SmsSimulatorView, {
                    payload: {
                        thread: {
                            messages: [
                                null as never,
                                { from: 'them', text: 'Hello', delay_seconds: 1 },
                            ],
                            sender_number: '+15550000077',
                            links: [{ href: 'https://example.test/fallback', text: '' }],
                        },
                        visibleMessageCount: 0,
                    },
                    visibleCount: 0,
                    onAction,
                    onRevealNext,
                }),
            );
        });

        expect(flattenText(renderer!.toJSON())).toContain('+15550000077');
        expect(flattenText(renderer!.toJSON())).toContain('No messages in this thread.');

        await act(async () => {
            vi.runAllTimers();
        });
        expect(onRevealNext).toHaveBeenCalledTimes(1);

        await act(async () => {
            renderer!.root
                .findByProps({ 'aria-label': 'Reply to message' })
                .props.onChange({ target: { value: ' Enter send ' } });
        });
        await act(async () => {
            renderer!.root.findByType('form').props.onSubmit({ preventDefault() {} });
            renderer!.root
                .findByProps({ 'aria-label': 'Link: https://example.test/fallback' })
                .props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'send_reply', replyText: 'Enter send' }),
        );
        expect(onAction).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'click_link', href: 'https://example.test/fallback' }),
        );
    });

    it('covers sms unknown sender fallback and title-only links', async () => {
        const onAction = vi.fn();
        let renderer: ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SmsSimulatorView, {
                    payload: {
                        thread: {
                            messages: [{ from: 'them', text: 'Hello', timestamp: '09:30' }],
                            links: [{ title: 'Portal only' } as never],
                        },
                        visibleMessageCount: 1,
                    },
                    visibleCount: 1,
                    onAction,
                    onRevealNext: vi.fn(),
                }),
            );
        });

        expect(flattenText(renderer!.toJSON())).toContain('Unknown');
        expect(flattenText(renderer!.toJSON())).toContain('Portal only');

        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Link: undefined' }).props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'click_link', href: undefined, linkIndex: 0 }),
        );
    });
});
