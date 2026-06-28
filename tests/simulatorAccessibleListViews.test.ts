import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import ContactsView from '../src/views/ContactsView';
import EmailMessageDetail from '../src/views/EmailMessageDetail';
import EmailInboxList from '../src/views/EmailInboxList';
import MessagesThreadListView from '../src/views/MessagesThreadListView';
import PhoneHistoryList from '../src/views/PhoneHistoryList';
import SmsSimulatorView from '../src/views/SmsSimulatorView';

import { TestRenderer, act } from './reactTestRenderer';

function flattenText(node: TestRenderer.ReactTestRendererJSON | TestRenderer.ReactTestRendererJSON[] | null): string {
    if (node == null) {
        return '';
    }
    if (Array.isArray(node)) {
        return node.map((child) => flattenText(child)).join('');
    }
    return (node.children ?? [])
        .map((child) => (typeof child === 'string' ? child : flattenText(child)))
        .join('');
}

describe('simulator accessible list views', () => {
    it('renders inbox rows as buttons and still selects a message', async () => {
        const onSelectMessage = vi.fn();
        const onCompose = vi.fn();
        const onSearchSubmit = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(EmailInboxList, {
                    inbox: [
                        {
                            id: 'm1',
                            subject: 'Subject',
                            from: 'sender@example.test',
                            from_display_name: 'Sender Name',
                            unread: true,
                            date_at: 'Today',
                        },
                    ],
                    selectedMessageId: null,
                    onSelectMessage,
                    onCompose,
                    onSearchSubmit,
                })
            );
        });

        const composeButton = renderer!.root.findByProps({ 'aria-label': 'Compose email' });
        const rowButton = renderer!.root.findAllByType('button').find((node) => node.props.type === 'button' && node.props['aria-label'] == null);
        expect(rowButton?.props.type).toBe('button');
        expect(flattenText(renderer!.toJSON())).toContain('Sender Name');
        expect(flattenText(renderer!.toJSON())).toContain('Today');

        await act(async () => {
            composeButton.props.onClick();
            renderer!.root.findByProps({ 'aria-label': 'Search' }).props.onChange({ target: { value: 'zzz' } });
            renderer!.root.findByProps({ 'aria-label': 'Search' }).props.onKeyDown({
                key: 'Enter',
                preventDefault: vi.fn(),
            });
        });

        expect(onCompose).toHaveBeenCalledTimes(1);
        expect(onSearchSubmit).toHaveBeenCalled();
        expect(flattenText(renderer!.toJSON())).toContain('No results for "zzz".');

        await act(async () => {
            renderer!.update(
                React.createElement(EmailInboxList, {
                    key: 'email-inbox-reset',
                    inbox: [
                        {
                            id: 'm1',
                            subject: 'Subject',
                            from: 'sender@example.test',
                            unread: true,
                        },
                    ],
                    selectedMessageId: null,
                    onSelectMessage,
                })
            );
        });

        await act(async () => {
            renderer!.root.findAll((node) => typeof node.props.onClick === 'function' && node.props['aria-label'] == null)[0].props.onClick();
        });

        expect(onSelectMessage).toHaveBeenCalledWith('m1');
    });

    it('covers controlled inbox search, trash empty state, and selected row styling', async () => {
        const onSelectMessage = vi.fn();
        const onSearchChange = vi.fn();
        const onSearchSubmit = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(EmailInboxList, {
                    inbox: [
                        {
                            id: 'm1',
                            subject: 'Reset password',
                            from: 'alerts@example.test',
                            snippet: 'Review your login attempt',
                        },
                    ],
                    selectedMessageId: 'm1',
                    onSelectMessage,
                    searchQuery: 'alerts',
                    onSearchChange,
                    onSearchSubmit,
                })
            );
        });

        const selectedRow = renderer!.root.findAllByType('button').find((node) => node.props.type === 'button' && node.props['aria-label'] == null);
        expect(selectedRow?.props.className).toContain('simulator-surface--selected');

        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Search' }).props.onChange({ target: { value: 'reset' } });
            renderer!.root.findByProps({ 'aria-label': 'Search' }).props.onKeyDown({
                key: 'Enter',
                preventDefault: vi.fn(),
            });
        });
        expect(onSearchChange).toHaveBeenCalledWith('reset');
        expect(onSearchSubmit).toHaveBeenCalledWith('alerts');

        await act(async () => {
            renderer!.update(
                React.createElement(EmailInboxList, {
                    inbox: [],
                    selectedMessageId: null,
                    onSelectMessage,
                    folderLabel: 'Trash',
                })
            );
        });
        expect(flattenText(renderer!.toJSON())).toContain('No emails in Trash.');
    });

    it('covers inbox sender-field searches and default empty search submit handler', async () => {
        const onSelectMessage = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(EmailInboxList, {
                    inbox: [
                        {
                            id: 'm1',
                            subject: 'Quarterly notice',
                            from: 'alerts@example.test',
                            from_display_name: 'Security Team',
                            snippet: 'Review your activity',
                        },
                    ],
                    selectedMessageId: null,
                    onSelectMessage,
                })
            );
        });

        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Search' }).props.onChange({ target: { value: 'alerts@example.test' } });
            renderer!.root.findByProps({ 'aria-label': 'Search' }).props.onKeyDown({
                key: 'Enter',
                preventDefault: vi.fn(),
            });
        });
        expect(flattenText(renderer!.toJSON())).toContain('Security Team');

        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Search' }).props.onChange({ target: { value: 'Security Team' } });
        });
        expect(flattenText(renderer!.toJSON())).toContain('Security Team');
        expect(flattenText(renderer!.toJSON())).not.toContain('No results for');

        await act(async () => {
            renderer!.update(
                React.createElement(EmailInboxList, {
                    inbox: [],
                    selectedMessageId: null,
                    onSelectMessage,
                })
            );
        });
        expect(flattenText(renderer!.toJSON())).toContain('No emails.');
    });

    it('covers inbox search with missing subject and sender fields', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(EmailInboxList, {
                    inbox: [
                        {
                            id: 'm2',
                            subject: undefined,
                            from: undefined,
                            from_display_name: undefined,
                            snippet: 'Only snippet text',
                        },
                    ],
                    selectedMessageId: null,
                    onSelectMessage: vi.fn(),
                })
            );
        });

        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Search' }).props.onChange({ target: { value: 'snippet' } });
        });

        expect(flattenText(renderer!.toJSON())).toContain('Only snippet text');
        expect(flattenText(renderer!.toJSON())).not.toContain('No results for');
    });

    it('renders phone contact rows as buttons and still opens the selected contact', async () => {
        const onOpenContact = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(ContactsView, {
                    contacts: [{ id: 'c1', displayName: 'Ada Lovelace', number: '555-0100' }],
                    onBack: vi.fn(),
                    phoneLocalNavItems: [{ id: 'contacts', label: 'Contacts' }],
                    onOpenContact,
                })
            );
        });

        const rowButton = renderer!.root.findAllByType('button').find((node) => node.props.className?.includes('simulator-border--top-none'));
        expect(rowButton).toBeDefined();

        await act(async () => {
            rowButton!.props.onClick();
        });

        expect(onOpenContact).toHaveBeenCalledWith('c1');
    });

    it('renders actionable phone history rows as buttons and passive rows as non-buttons', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(PhoneHistoryList, {
                    entries: [
                        {
                            id: 'call-1',
                            number: '555-0100',
                            kind: 'incoming',
                        },
                    ],
                    incomingCallContent: {
                        transcript: 'Call now.',
                        choices: [],
                        caller_name: 'Security Team',
                    },
                    hasVoicemail: true,
                    onSelectIncoming: vi.fn(),
                    onSelectVoicemail: vi.fn(),
                })
            );
        });

        const buttons = renderer!.root.findAllByType('button');
        expect(buttons.length).toBeGreaterThanOrEqual(2);
        expect(
            renderer!.root.findAll(
                (node) =>
                    node.type === 'div' &&
                    (node.props.className?.includes('simulator-surface--white') ||
                        node.props.className?.includes('simulator-surface--light'))
            ).length
        ).toBeGreaterThan(0);
    });

    it('renders the sms message timeline with native list markup', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SmsSimulatorView, {
                    payload: {
                        thread: {
                            messages: [{ from: 'them', text: 'Hello' }],
                            sender_display_name: 'Security Team',
                        },
                        visibleMessageCount: 1,
                    },
                    visibleCount: 1,
                    onAction: vi.fn(),
                    onRevealNext: vi.fn(),
                })
            );
        });

        const timeline = renderer!.root.findByProps({ 'aria-label': 'Message timeline' });
        expect(timeline.type).toBe('ul');
        expect(timeline.findAllByType('li')).toHaveLength(1);
    });

    it('covers email message detail fallback fields and action buttons', async () => {
        const onAction = vi.fn();
        const onBack = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(EmailMessageDetail, {
                    message: {
                        from: 'sender@example.test',
                        from_display_name: '',
                        to: undefined,
                        subject: undefined,
                        body: undefined,
                        links: [
                            { href: 'https://example.test', text: '' },
                            { href: 'https://example.test', text: '' },
                        ],
                        attachment_name: 'invoice.pdf',
                        attachment_type: '',
                    } as never,
                    onAction,
                })
            );
        });

        expect(renderer!.root.findByProps({ 'aria-label': 'From' }).props.value).toBe('sender@example.test');
        expect(renderer!.root.findByProps({ 'aria-label': 'To' }).props.value).toBe('');
        expect(renderer!.root.findByProps({ 'aria-label': 'Subject' }).props.value).toBe('');
        expect(renderer!.root.findByProps({ 'aria-label': 'Body' }).props.value).toBe('');
        expect(renderer!.root.findAllByProps({ 'aria-label': 'Back to inbox' })).toHaveLength(0);

        await act(async () => {
            renderer!.root.findAllByType('button').find((node) => node.props['aria-label'] === 'https://example.test')!.props.onClick();
            renderer!.root.findByProps({ 'aria-label': 'Open attachment' }).props.onClick();
            renderer!.root.findByProps({ 'aria-label': 'Download attachment' }).props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'click_link', href: 'https://example.test' }));
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'open_attachment' }));
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'download_attachment' }));

        await act(async () => {
            renderer!.update(
                React.createElement(EmailMessageDetail, {
                    message: {
                        from: 'sender@example.test',
                        from_display_name: 'Sender Name',
                        to: 'user@example.test',
                        subject: 'Subject',
                        body: 'Body',
                        links: [],
                    } as never,
                    onAction,
                    onBack,
                })
            );
        });
        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Forward' }).props.onClick();
            renderer!.root.findByProps({ 'aria-label': 'Dispose' }).props.onClick();
            renderer!.root.findByProps({ 'aria-label': 'Cancel' }).props.onClick();
        });
        expect(onBack).toHaveBeenCalledTimes(3);

        await act(async () => {
            renderer!.update(
                React.createElement(EmailMessageDetail, {
                    message: {
                        from: undefined,
                        from_display_name: null,
                        to: 'user@example.test',
                        subject: 'No sender',
                        body: 'Body',
                        links: [{ text: 'Open portal' }, { title: 'Portal only' }],
                    } as never,
                    onAction,
                })
            );
        });
        expect(renderer!.root.findByProps({ 'aria-label': 'From' }).props.value).toBe('');
        await act(async () => {
            renderer!.root.findAllByType('button').find((node) => node.props['aria-label'] === 'Open portal')!.props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'click_link', href: undefined }));
    });

    it('renders thread rows as buttons and covers compose and search handlers', async () => {
        const onSelectThread = vi.fn();
        const onCompose = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(MessagesThreadListView, {
                    threads: [
                        {
                            id: 't1',
                            preview: 'Preview text',
                            senderName: 'Security Team',
                            timestamp: '09:00',
                            unread: true,
                        },
                    ],
                    onSelectThread,
                    onCompose,
                })
            );
        });

        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'New thread' }).props.onClick();
            renderer!.root.findByProps({ 'aria-label': 'Search threads' }).props.onChange({ target: { value: 'zzz' } });
            renderer!.root.findByProps({ 'aria-label': 'Search threads' }).props.onKeyDown({
                key: 'Enter',
                preventDefault: vi.fn(),
            });
        });
        expect(onCompose).toHaveBeenCalledTimes(1);
        expect(flattenText(renderer!.toJSON())).toContain('No results for "zzz".');

        await act(async () => {
            renderer!.update(
                React.createElement(MessagesThreadListView, {
                    key: 'thread-reset',
                    threads: [
                        {
                            id: 't1',
                            preview: 'Preview text',
                            senderName: 'Security Team',
                            timestamp: '09:00',
                        },
                    ],
                    onSelectThread,
                    onCompose,
                })
            );
        });
        await act(async () => {
            renderer!.root.findAllByType('button').find((node) => node.props.type === 'button' && node.props['aria-label'] == null)!.props.onClick();
        });
        expect(onSelectThread).toHaveBeenCalledWith('t1');

        await act(async () => {
            renderer!.update(
                React.createElement(MessagesThreadListView, {
                    threads: [],
                    onSelectThread,
                })
            );
        });
        expect(flattenText(renderer!.toJSON())).toContain('No conversations.');
    });

    it('covers thread sender fallbacks, search matches, and non-top-row border styling', async () => {
        const onSelectThread = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(MessagesThreadListView, {
                    threads: [
                        {
                            id: 't1',
                            preview: 'Security notice',
                            senderNumber: '+15550000001',
                            unread: false,
                        },
                        {
                            id: 't2',
                            preview: undefined,
                        },
                    ],
                    onSelectThread,
                })
            );
        });

        expect(flattenText(renderer!.toJSON())).toContain('+15550000001');
        expect(flattenText(renderer!.toJSON())).toContain('Unknown');
        const rowButtons = renderer!.root.findAllByType('button').filter((node) => node.props['aria-label'] == null);
        expect(rowButtons[1].props.className).toContain('simulator-border--top-none');

        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Search threads' }).props.onChange({ target: { value: '0001' } });
        });
        expect(flattenText(renderer!.toJSON())).toContain('+15550000001');
        expect(flattenText(renderer!.toJSON())).not.toContain('No sender preview');

        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Search threads' }).props.onChange({ target: { value: 'preview' } });
        });
        expect(flattenText(renderer!.toJSON())).toContain('No results for "preview".');
    });
});
