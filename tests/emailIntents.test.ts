import React from 'react';
import { expect, it, vi } from 'vitest';
import EmailMessageDetail from '../src/views/email/EmailMessageDetail.js';
import { TestRenderer, act } from './reactTestRenderer.js';

it('dispatches supported email effects once without navigating', async () => {
    const onForward = vi.fn();
    const onDispose = vi.fn();
    const onBack = vi.fn();
    const onAction = vi.fn();
    const renderer = TestRenderer.create(
        React.createElement(EmailMessageDetail, {
            message: {
                from: 'sender@example.test',
                to: 'reader@example.test',
                subject: 'Message',
                body: 'Text',
            },
            onAction,
            onBack,
            onForward,
            onDispose,
        }),
    );
    await act(async () => {
        renderer.root.findByProps({ 'aria-label': 'Forward' }).props.onClick();
        renderer.root.findByProps({ 'aria-label': 'Dispose' }).props.onClick();
    });
    expect(onForward).toHaveBeenCalledTimes(1);
    expect(onDispose).toHaveBeenCalledTimes(1);
    expect(onBack).not.toHaveBeenCalled();
    expect(onAction).not.toHaveBeenCalled();
    renderer.unmount();
});
