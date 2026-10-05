import React from 'react';
import type { ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import DirectoryView from '../src/views/contacts/DirectoryView';
import EmailComposeView from '../src/views/email/EmailComposeView';
import MessagesNewThreadView from '../src/views/messages/MessagesNewThreadView';
import PhoneIncomingScene from '../src/views/phone/PhoneIncomingScene';
import { TestRenderer, act } from './reactTestRenderer';
import { flattenText } from './support/viewCoverageSupport';

describe('compose, new thread and incoming call views', () => {
    it('covers standalone compose, new-thread, and incoming-call views', async () => {
        const onCancel = vi.fn();
        const onSend = vi.fn();
        let composeRenderer: ReactTestRenderer | null = null;
        await act(async () => {
            composeRenderer = TestRenderer.create(
                React.createElement(EmailComposeView, {
                    onSend,
                    onCancel,
                }),
            );
        });
        for (const [label, value] of [
            ['Recipient', ' user@example.test '],
            ['Bcc', 'hidden@example.test'],
            ['Subject', ' Subject '],
            ['Body', ' Body '],
        ]) {
            await act(async () => {
                composeRenderer!.root
                    .findByProps({ 'aria-label': label })
                    .props.onChange({ target: { value } });
            });
        }
        await act(async () => {
            composeRenderer!.root.findByType('form').props.onSubmit({ preventDefault() {} });
        });
        expect(onSend).toHaveBeenCalledWith({
            to: 'user@example.test',
            bcc: 'hidden@example.test',
            subject: 'Subject',
            body: ' Body ',
        });
        expect(onCancel).toHaveBeenCalled();

        const onBack = vi.fn();
        let threadRenderer: ReactTestRenderer | null = null;
        await act(async () => {
            threadRenderer = TestRenderer.create(
                React.createElement(MessagesNewThreadView, { onBack, onSend: vi.fn() }),
            );
        });
        const threadInputs = threadRenderer!.root.findAllByType('input');
        await act(async () => {
            threadInputs[0]!.props.onChange({ target: { value: '+15551230000' } });
            threadRenderer!.root
                .findByProps({ 'aria-label': 'Message body' })
                .props.onChange({ target: { value: 'Hello' } });
        });
        await act(async () => {
            threadRenderer!.root.findByType('form').props.onSubmit({ preventDefault() {} });
        });
        await act(async () => {
            threadRenderer!.root.findByProps({ 'aria-label': 'Cancel' }).props.onClick();
        });
        expect(onBack).toHaveBeenCalledTimes(2);

        const onAnswer = vi.fn();
        const onIgnore = vi.fn();
        let incomingRenderer: ReactTestRenderer | null = null;
        await act(async () => {
            incomingRenderer = TestRenderer.create(
                React.createElement(PhoneIncomingScene, {
                    content: {
                        transcript: 'Incoming call.',
                        choices: [],
                        phone_number: '+15550000000',
                        caller_name: 'Security Team',
                        caller_title: 'urgent',
                        avatar_url: 'https://example.test/avatar.png',
                    },
                    onAnswer,
                    onIgnore,
                }),
            );
        });
        await act(async () => {
            incomingRenderer!.root.findByProps({ 'aria-label': 'Answer call' }).props.onClick();
            incomingRenderer!.root.findByProps({ 'aria-label': 'Decline call' }).props.onClick();
        });
        expect(onAnswer).toHaveBeenCalledTimes(1);
        expect(onIgnore).toHaveBeenCalledTimes(1);

        await act(async () => {
            incomingRenderer!.update(
                React.createElement(PhoneIncomingScene, {
                    content: {
                        transcript: 'Incoming call.',
                        choices: [],
                        urgency: 'urgent',
                    } as never,
                    onAnswer,
                    onIgnore,
                }),
            );
        });
        expect(flattenText(incomingRenderer!.toJSON())).toContain('Unknown');
        expect(flattenText(incomingRenderer!.toJSON())).toContain('urgent');
        expect(
            incomingRenderer!.root.findAllByProps({ className: 'simulator-call-number' }),
        ).toHaveLength(0);
    });

    it('shows directory entry detail when initialSelectedDirectoryId is set', async () => {
        let directoryRenderer: ReactTestRenderer | null = null;
        await act(async () => {
            directoryRenderer = TestRenderer.create(
                React.createElement(DirectoryView, {
                    directory: [
                        {
                            id: 'helpdesk',
                            label: 'IT Helpdesk',
                            number: '+15550123456',
                            description: 'Password resets.',
                        },
                    ],
                    contacts: null,
                    onBack: vi.fn(),
                    onAction: vi.fn(),
                    initialSelectedDirectoryId: 'helpdesk',
                }),
            );
        });
        const tree = directoryRenderer!.toJSON();
        expect(flattenText(tree)).toContain('IT Helpdesk');
        expect(flattenText(tree)).toContain('Password resets.');
        expect(flattenText(tree)).toContain('Change');
    });
});
