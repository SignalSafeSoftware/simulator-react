import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { mapEmail } from '../src/adapters/device/emailMapper';
import EmailSimulatorView from '../src/views/email/EmailSimulatorView';
import { TestRenderer, act } from './reactTestRenderer';

describe('email message bodies', () => {
    it('opens full content by identity in every folder without leaking selected detail', async () => {
        const messages = ['inbox', 'outbox', 'trash'].map((folder_id) => ({
            id: folder_id,
            folder_id,
            subject: folder_id,
            from: 'sender@example.test',
            body: `Full ${folder_id} body`,
            snippet: `Short ${folder_id}`,
            to: 'recipient@example.test',
            cc: 'copy@example.test',
            attachment_name: 'report.pdf',
            attachment_type: 'application/pdf',
            links: [{ href: 'https://example.test', text: 'Read report' }],
        }));
        const payload = mapEmail({
            messages,
            detail: { ...messages[0]!, body: 'Explicit detail' },
        });
        expect(payload?.messagesById?.trash).toMatchObject({
            body: 'Full trash body',
            to: 'recipient@example.test',
            cc: 'copy@example.test',
            attachment_name: 'report.pdf',
            links: messages[2]!.links,
        });
        for (const id of [null, 'inbox', 'outbox', 'trash']) {
            let renderer: ReturnType<typeof TestRenderer.create>;
            await act(async () => {
                renderer = TestRenderer.create(
                    React.createElement(EmailSimulatorView, {
                        payload,
                        screen: 'detail',
                        selectedMessageId: id,
                        onAction: vi.fn(),
                        onSelectMessage: vi.fn(),
                    }),
                );
            });
            expect(
                renderer!.root
                    .findByProps({ className: 'prototype-message-body' })
                    .children.join(''),
            ).toBe(id == null || id === 'inbox' ? 'Explicit detail' : `Full ${id} body`);
            await act(async () => renderer!.unmount());
        }
    });

    it('retains snippet fallback and an intentionally empty full body', () => {
        const payload = mapEmail({
            messages: [
                {
                    id: 'summary',
                    folder_id: 'inbox',
                    subject: '',
                    from: '',
                    snippet: 'Preview only',
                },
                {
                    id: 'empty',
                    folder_id: 'inbox',
                    subject: '',
                    from: '',
                    body: '',
                    snippet: 'Preview',
                },
            ],
        });
        expect(payload?.messagesById?.summary?.body).toBe('Preview only');
        expect(payload?.messagesById?.empty?.body).toBe('');
        expect(mapEmail(undefined)).toBeNull();
    });
});
