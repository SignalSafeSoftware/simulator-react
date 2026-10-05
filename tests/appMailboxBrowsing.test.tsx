// @vitest-environment jsdom
import { type Mail } from '@signalsafe/simulator-core/apps/contracts';
import { fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type MailboxSource } from '../src/apps/mail/Mailbox';
import { settle } from './support/appHarness';
import {
    mail,
    asset,
    setup,
    nav,
    openFolder,
    openMessage,
    field,
    alertText,
} from './support/mailboxSupport';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('Mailbox folders', () => {
    it('renders nothing until the store has data', () => {
        const { container } = setup({
            prepare: (store) => Object.defineProperty(store, 'data', { value: null }),
        });
        expect(container.firstChild).toBeNull();
    });

    it('shows folder counts and leaves the app from the folder list', () => {
        const { onBack } = setup({
            mails: [mail('1'), mail('2'), mail('3', { folder: 'sent' })],
        });
        expect(screen.getByRole('button', { name: 'Inbox2' })).toBeInstanceOf(HTMLElement);
        expect(screen.getByRole('button', { name: 'Sent1' })).toBeInstanceOf(HTMLElement);
        expect(screen.getByRole('button', { name: 'Trash0' })).toBeInstanceOf(HTMLElement);
        nav('Back');
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('treats missing counts as zero', () => {
        setup({ prepare: (store) => Object.defineProperty(store, 'counts', { value: undefined }) });
        expect(screen.getByRole('button', { name: 'Inbox0' })).toBeInstanceOf(HTMLElement);
    });

    it('lists folder messages with the right counterpart and unread markers', async () => {
        setup({
            mails: [
                mail('1', { read: false, subject: '' }),
                mail('2', { folder: 'sent', to: 'them@example.test' }),
                mail('3', { folder: 'drafts', to: 'draft@example.test' }),
            ],
        });
        await openFolder(/^Inbox/);
        expect(screen.getByText('● (No subject)')).toBeInstanceOf(HTMLElement);
        expect(screen.getByText('sender@example.test')).toBeInstanceOf(HTMLElement);
        nav('Back');
        await openFolder(/^Sent/);
        expect(screen.getByText('them@example.test')).toBeInstanceOf(HTMLElement);
        nav('Back');
        await openFolder(/^Drafts/);
        expect(screen.getByText('draft@example.test')).toBeInstanceOf(HTMLElement);
    });

    it('searches and reports empty folders and empty searches', async () => {
        setup({ mails: [mail('1', { subject: 'Invoice' })] });
        await openFolder(/^Sent/);
        expect(screen.getByText('No messages in this folder.')).toBeInstanceOf(HTMLElement);
        nav('Back');
        await openFolder(/^Inbox/);
        fireEvent.change(screen.getByLabelText('Search email'), { target: { value: 'nothing' } });
        await settle();
        expect(screen.getByText('No messages match your search.')).toBeInstanceOf(HTMLElement);
        fireEvent.change(screen.getByLabelText('Search email'), { target: { value: 'invoice' } });
        await settle();
        expect(screen.getByText('Invoice')).toBeInstanceOf(HTMLElement);
    });

    it('resets the search when returning to the folder list', async () => {
        setup({ mails: [mail('1')] });
        await openFolder(/^Inbox/);
        field('Search email', 'x');
        nav('Back');
        await openFolder(/^Inbox/);
        expect((screen.getByLabelText('Search email') as HTMLInputElement).value).toBe('');
    });

    it('pages long folders and retries failed loads', async () => {
        setup({
            mails: Array.from({ length: 25 }, (_, index) => mail(`m${index}`)),
            prepare: (store) => {
                const page = store.page;
                let failed = false;
                store.page = (collection, query) => {
                    if (!failed && query.offset === 20) {
                        failed = true;
                        return Promise.reject(new Error('offline'));
                    }
                    return page(collection, query);
                };
            },
        });
        await openFolder(/^Inbox/);
        expect(screen.getAllByText(/^Subject m/)).toHaveLength(20);
        fireEvent.click(screen.getByText('Load more email'));
        await settle();
        expect(alertText()).toBe('offline');
        fireEvent.click(screen.getByText('Retry'));
        await settle();
        expect(screen.getAllByText(/^Subject m/)).toHaveLength(25);
    });

    it('opens custom sources and returns from them', async () => {
        const compose = vi.fn();
        const sources: MailboxSource[] = [
            {
                id: 'imports',
                label: 'Imported',
                render: (onCompose) => (
                    <button
                        onClick={() => {
                            compose();
                            onCompose(mail('imp', { subject: 'Imported draft', folder: 'drafts' }));
                        }}
                    >
                        compose-from-source
                    </button>
                ),
            },
        ];
        setup({ sources });
        fireEvent.click(screen.getByRole('button', { name: 'Imported' }));
        expect(screen.getByRole('button', { name: 'Imported' })).toBeInstanceOf(HTMLElement);
        nav('Back');
        expect(screen.getByRole('button', { name: 'Inbox0' })).toBeInstanceOf(HTMLElement);

        fireEvent.click(screen.getByRole('button', { name: 'Imported' }));
        fireEvent.click(screen.getByText('compose-from-source'));
        expect((screen.getByLabelText('Subject') as HTMLInputElement).value).toBe('Imported draft');
    });
});

describe('Mailbox messages', () => {
    const thread = (extra: Mail[] = []) => [
        mail('a', {
            threadId: 't',
            subject: 'Original',
            cc: 'cc@example.test',
            bcc: 'bcc@example.test',
            sourceRecordId: 'src-1',
            attachments: [asset('notes.txt')],
        }),
        mail('b', { threadId: 't', subject: 'Reply to original', folder: 'sent' }),
        mail('c', { threadId: 't', subject: 'Gone', folder: 'trash' }),
        ...extra,
    ];

    it('opens a message with headers, attachments and thread navigation', async () => {
        setup({ mails: thread() });
        await openFolder(/^Inbox/);
        await openMessage('Original');
        expect(screen.getByText('From: sender@example.test')).toBeInstanceOf(HTMLElement);
        expect(screen.getByText('CC: cc@example.test')).toBeInstanceOf(HTMLElement);
        expect(screen.getByText('BCC: bcc@example.test')).toBeInstanceOf(HTMLElement);
        expect(screen.getByText(/Based on imported source record src-1/)).toBeInstanceOf(
            HTMLElement,
        );
        expect(screen.getByRole('link', { name: 'notes.txt' }).getAttribute('download')).toBe(
            'notes.txt',
        );
        const details = screen.getByText('Messages in this simulated thread').closest('details')!;
        expect(within(details).queryByText('Gone')).toBeNull();
        fireEvent.click(within(details).getByText('Reply to original'));
        await settle();
        expect(screen.getByRole('heading', { name: 'Reply to original' })).toBeInstanceOf(
            HTMLElement,
        );
    });

    it('hides optional headers and uses a fallback subject', async () => {
        setup({ mails: [mail('x', { subject: '' })] });
        await openFolder(/^Inbox/);
        await openMessage('(No subject)');
        expect(screen.queryByText(/^CC:/)).toBeNull();
        expect(screen.queryByText(/^BCC:/)).toBeNull();
        expect(screen.queryByText(/imported source/)).toBeNull();
        expect(screen.getByRole('heading', { name: '(No subject)' })).toBeInstanceOf(HTMLElement);
    });

    it('marks unread messages read when opened and toggles the state', async () => {
        const { store } = setup({ mails: [mail('u', { read: false })] });
        await openFolder(/^Inbox/);
        await openMessage('● Subject u');
        expect(store().state().mail[0]!.read).toBe(true);
        fireEvent.click(screen.getByText('Mark unread'));
        await settle();
        expect(store().state().mail[0]!.read).toBe(false);
        expect(screen.getByText('Mark read')).toBeInstanceOf(HTMLElement);
    });

    it('does not rewrite messages that are already read', async () => {
        const { store } = setup({ mails: [mail('r')] });
        const before = store().state().revision;
        await openFolder(/^Inbox/);
        await openMessage('Subject r');
        expect(store().state().revision).toBe(before);
    });

    it('moves messages to trash and restores them', async () => {
        const { store } = setup({ mails: [mail('m', { folder: 'sent', previousFolder: 'sent' })] });
        await openFolder(/^Sent/);
        await openMessage('Subject m');
        fireEvent.click(screen.getByText('Move to trash'));
        await settle();
        expect(store().state().mail[0]).toMatchObject({ folder: 'trash', previousFolder: 'sent' });
        await openMessage('Subject m');
        fireEvent.click(screen.getByText('Restore'));
        await settle();
        expect(store().state().mail[0]).toMatchObject({ folder: 'sent' });
    });

    it('keeps the message open when the store rejects a move to trash', async () => {
        const { store } = setup({
            mails: [mail('m')],
            prepare: (created) => {
                created.put = async () => false;
            },
        });
        await openFolder(/^Inbox/);
        await openMessage('Subject m');
        fireEvent.click(screen.getByText('Move to trash'));
        await settle();
        expect(store().state().mail[0]!.folder).toBe('inbox');
        expect(screen.getByRole('heading', { name: 'Subject m' })).toBeInstanceOf(HTMLElement);
    });

    it('permanently deletes only after confirmation and success', async () => {
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
        const { store } = setup({ mails: [mail('t', { folder: 'trash' })] });
        await openFolder(/^Trash/);
        await openMessage('Subject t');
        fireEvent.click(screen.getByText('Delete permanently'));
        await settle();
        expect(store().state().mail).toHaveLength(1);
        expect(confirm).toHaveBeenCalledWith('Permanently delete this simulated email?');

        confirm.mockReturnValue(true);
        const remove = store().remove;
        store().remove = async () => false;
        fireEvent.click(screen.getByText('Delete permanently'));
        await settle();
        expect(screen.getByText('Restore')).toBeInstanceOf(HTMLElement);

        store().remove = remove;
        fireEvent.click(screen.getByText('Delete permanently'));
        await settle();
        expect(store().state().mail).toHaveLength(0);
    });

    it('applies the display transformation to lists and details', async () => {
        setup({
            mails: [mail('1')],
            displayMail: (item) => ({ ...item, subject: item.subject.toUpperCase() }),
        });
        await openFolder(/^Inbox/);
        expect(screen.getByText('SUBJECT 1')).toBeInstanceOf(HTMLElement);
        await openMessage('SUBJECT 1');
        expect(screen.getByRole('heading', { name: 'SUBJECT 1' })).toBeInstanceOf(HTMLElement);
    });

    it('returns from a message to its folder and then the folder list', async () => {
        setup({ mails: [mail('1')] });
        await openFolder(/^Inbox/);
        await openMessage('Subject 1');
        nav('Back');
        expect(screen.getByLabelText('Search email')).toBeInstanceOf(HTMLElement);
        nav('Back');
        expect(screen.getByRole('button', { name: 'Inbox1' })).toBeInstanceOf(HTMLElement);
    });

    it('reports record load failures and retries', async () => {
        setup({
            mails: [mail('1')],
            prepare: (store) => {
                const get = store.get;
                let calls = 0;
                store.get = ((collection: never, id: string) => {
                    calls += 1;
                    if (calls === 1) return Promise.reject(new Error('missing record'));
                    if (calls === 2) return Promise.reject('plain');
                    return get(collection, id);
                }) as typeof store.get;
            },
        });
        await openFolder(/^Inbox/);
        await openMessage('Subject 1');
        expect(alertText()).toBe('missing record');
        fireEvent.click(screen.getByText('Retry'));
        await settle();
        expect(alertText()).toContain('could not be loaded');
        fireEvent.click(screen.getByText('Retry'));
        await settle();
        expect(screen.getByRole('heading', { name: 'Subject 1' })).toBeInstanceOf(HTMLElement);
    });

    it('pages long threads and reports thread load errors', async () => {
        const many = Array.from({ length: 22 }, (_, index) =>
            mail(`t${index}`, { threadId: 'long', subject: `Thread ${index}` }),
        );
        setup({
            mails: many,
            prepare: (store) => {
                const page = store.page;
                let failed = false;
                store.page = (collection, query) => {
                    if (!failed && query.threadId === 'long' && query.offset === 20) {
                        failed = true;
                        return Promise.reject(new Error('thread offline'));
                    }
                    return page(collection, query);
                };
            },
        });
        await openFolder(/^Inbox/);
        await openMessage('Thread 0');
        fireEvent.click(screen.getByText('Load more thread messages'));
        await settle();
        expect(alertText()).toBe('thread offline');
        fireEvent.click(screen.getByText('Retry'));
        await settle();
        expect(screen.getAllByText(/^Thread \d+$/).length).toBeGreaterThan(20);
    });
});
