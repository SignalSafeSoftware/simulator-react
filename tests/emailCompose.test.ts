import type { ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import TestRenderer from 'react-test-renderer';
import { act } from 'react-test-renderer';
import { expect, it, vi } from 'vitest';
import EmailComposeView from '../src/views/email/EmailComposeView.js';

it('keeps controlled Bcc and body on failure and clears only after success', async () => {
    const draft = {
        to: 'to@example.test',
        bcc: 'private@example.test',
        subject: 'Test',
        body: ' original body ',
    };
    const onSend = vi
        .fn()
        .mockRejectedValueOnce(new Error('Delivery unavailable'))
        .mockResolvedValueOnce(undefined);
    const onDraftChange = vi.fn();
    const onCancel = vi.fn();
    let view: ReactTestRenderer;
    await act(async () => {
        view = TestRenderer.create(
            createElement(EmailComposeView, { draft, onSend, onDraftChange, onCancel }),
        );
    });
    await act(async () => {
        view!.root.findByType('form').props.onSubmit({ preventDefault() {} });
    });
    expect(view!.root.findByProps({ role: 'alert' }).props.children).toBe('Delivery unavailable');
    expect(onDraftChange).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
    await act(async () => {
        view!.root.findByType('form').props.onSubmit({ preventDefault() {} });
    });
    expect(onSend).toHaveBeenLastCalledWith(draft);
    expect(onDraftChange).toHaveBeenCalledWith({ to: '', bcc: '', subject: '', body: '' });
    expect(onCancel).toHaveBeenCalledOnce();
    await act(async () => view!.unmount());
});

it('ignores unsupported shared CC edits while retaining supported draft updates', async () => {
    const draft = {
        to: 'to@example.test',
        cc: 'existing@example.test',
        bcc: '',
        subject: '',
        body: '',
    };
    const original = JSON.stringify(draft);
    const onDraftChange = vi.fn();
    let view: ReactTestRenderer;
    await act(async () => {
        view = TestRenderer.create(
            createElement(EmailComposeView, {
                draft,
                onDraftChange,
                onSend: vi.fn(),
                onCancel: vi.fn(),
            }),
        );
    });
    await act(async () => {
        view!.root
            .findByProps({ 'aria-label': 'CC' })
            .props.onChange({ target: { value: 'ignored@example.test' } });
    });
    expect(onDraftChange).not.toHaveBeenCalled();
    await act(async () => {
        view!.root
            .findByProps({ 'aria-label': 'BCC' })
            .props.onChange({ target: { value: 'private@example.test' } });
    });
    expect(onDraftChange).toHaveBeenCalledExactlyOnceWith({
        ...draft,
        bcc: 'private@example.test',
    });
    expect(JSON.stringify(draft)).toBe(original);
    await act(async () => view!.unmount());
});
