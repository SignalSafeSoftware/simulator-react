import { createElement } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { expect, it, vi } from 'vitest';
import EmailComposeView from '../src/views/EmailComposeView.js';

it('keeps controlled Bcc and body on failure and clears only after success', async () => {
    const draft = { to: 'to@example.test', bcc: 'private@example.test', subject: 'Test', body: ' original body ' };
    const onSend = vi.fn().mockRejectedValueOnce(new Error('Delivery unavailable')).mockResolvedValueOnce(undefined);
    const onDraftChange = vi.fn();
    const onCancel = vi.fn();
    let view: TestRenderer.ReactTestRenderer;
    await act(async () => { view = TestRenderer.create(createElement(EmailComposeView, { draft, onSend, onDraftChange, onCancel })); });
    await act(async () => { view!.root.findByType('form').props.onSubmit({ preventDefault() {} }); });
    expect(view!.root.findByProps({ role: 'alert' }).props.children).toBe('Delivery unavailable');
    expect(onDraftChange).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
    await act(async () => { view!.root.findByType('form').props.onSubmit({ preventDefault() {} }); });
    expect(onSend).toHaveBeenLastCalledWith(draft);
    expect(onDraftChange).toHaveBeenCalledWith({ to: '', bcc: '', subject: '', body: '' });
    expect(onCancel).toHaveBeenCalledOnce();
    await act(async () => view!.unmount());
});
