// @vitest-environment jsdom
import {
    emptySimulatorStore,
    type Asset,
    type Mail,
    type SimulatorStore,
} from '@signalsafe/simulator-core/apps/contracts';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Mailbox, { type MailboxSource } from '../src/apps/mail/Mailbox';
import { SimulatorAppsProvider } from '../src/apps/shared/SimulatorAppsHost';
import { StoreHarness, flush, type HarnessStore } from './support/appHarness';

const ME = 'learner@example.test';

const mail = (id: string, overrides: Partial<Mail> = {}): Mail => ({
    id,
    threadId: id,
    sourceRecordId: null,
    folder: 'inbox',
    previousFolder: 'inbox',
    from: 'sender@example.test',
    to: ME,
    cc: '',
    bcc: '',
    subject: `Subject ${id}`,
    body: `Body ${id}`,
    attachments: [],
    read: true,
    createdAt: '2024-01-02T10:00:00.000Z',
    updatedAt: '2024-01-02T10:00:00.000Z',
    ...overrides,
});

const asset = (name: string): Asset => ({
    name,
    mime: 'text/plain',
    data: 'data:text/plain;base64,aGk=',
});

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

afterEach(() => {
    vi.restoreAllMocks();
});

interface Options {
    mails?: Mail[];
    initial?: Partial<SimulatorStore>;
    onBack?: () => void;
    prepare?: (store: HarnessStore) => void;
    sources?: readonly MailboxSource[];
    displayMail?: (mail: Mail) => Mail;
    emailService?: { send: (draft: Mail) => Promise<Mail> };
    readAsset?: (file: File) => Promise<Asset>;
}

function setup({
    mails = [],
    initial = {},
    onBack = vi.fn(),
    prepare,
    sources,
    displayMail,
    emailService,
    readAsset = vi.fn(async (file: File) => asset(file.name)),
}: Options = {}) {
    let current!: HarnessStore;
    const view = render(
        <SimulatorAppsProvider value={{ readAsset } as never}>
            <StoreHarness
                initial={{ ...emptySimulatorStore(), mail: mails, ...initial }}
                prepare={prepare}
            >
                {(store) => {
                    current = store;
                    return (
                        <Mailbox
                            store={store}
                            onBack={onBack}
                            sources={sources}
                            displayMail={displayMail}
                            emailService={emailService}
                        />
                    );
                }}
            </StoreHarness>
        </SimulatorAppsProvider>,
    );
    return { ...view, store: () => current, onBack, readAsset };
}

const settle = () => act(flush);
const nav = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const openFolder = async (name: RegExp) => {
    fireEvent.click(screen.getByRole('button', { name }));
    await settle();
};
const openMessage = async (subject: string) => {
    fireEvent.click(screen.getByText(subject).closest('button')!);
    await settle();
};
const field = (label: string, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
const alertText = () => screen.getByRole('alert').textContent;

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
        expect(screen.getByRole('button', { name: 'Inbox2' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Sent1' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Trash0' })).toBeTruthy();
        nav('Back');
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('treats missing counts as zero', () => {
        setup({ prepare: (store) => Object.defineProperty(store, 'counts', { value: undefined }) });
        expect(screen.getByRole('button', { name: 'Inbox0' })).toBeTruthy();
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
        expect(screen.getByText('● (No subject)')).toBeTruthy();
        expect(screen.getByText('sender@example.test')).toBeTruthy();
        nav('Back');
        await openFolder(/^Sent/);
        expect(screen.getByText('them@example.test')).toBeTruthy();
        nav('Back');
        await openFolder(/^Drafts/);
        expect(screen.getByText('draft@example.test')).toBeTruthy();
    });

    it('searches and reports empty folders and empty searches', async () => {
        setup({ mails: [mail('1', { subject: 'Invoice' })] });
        await openFolder(/^Sent/);
        expect(screen.getByText('No messages in this folder.')).toBeTruthy();
        nav('Back');
        await openFolder(/^Inbox/);
        fireEvent.change(screen.getByLabelText('Search email'), { target: { value: 'nothing' } });
        await settle();
        expect(screen.getByText('No messages match your search.')).toBeTruthy();
        fireEvent.change(screen.getByLabelText('Search email'), { target: { value: 'invoice' } });
        await settle();
        expect(screen.getByText('Invoice')).toBeTruthy();
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
        expect(screen.getByRole('button', { name: 'Imported' })).toBeTruthy();
        nav('Back');
        expect(screen.getByRole('button', { name: 'Inbox0' })).toBeTruthy();

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
        expect(screen.getByText('From: sender@example.test')).toBeTruthy();
        expect(screen.getByText('CC: cc@example.test')).toBeTruthy();
        expect(screen.getByText('BCC: bcc@example.test')).toBeTruthy();
        expect(screen.getByText(/Based on imported source record src-1/)).toBeTruthy();
        expect(screen.getByRole('link', { name: 'notes.txt' }).getAttribute('download')).toBe(
            'notes.txt',
        );
        const details = screen.getByText('Messages in this simulated thread').closest('details')!;
        expect(within(details).queryByText('Gone')).toBeNull();
        fireEvent.click(within(details).getByText('Reply to original'));
        await settle();
        expect(screen.getByRole('heading', { name: 'Reply to original' })).toBeTruthy();
    });

    it('hides optional headers and uses a fallback subject', async () => {
        setup({ mails: [mail('x', { subject: '' })] });
        await openFolder(/^Inbox/);
        await openMessage('(No subject)');
        expect(screen.queryByText(/^CC:/)).toBeNull();
        expect(screen.queryByText(/^BCC:/)).toBeNull();
        expect(screen.queryByText(/imported source/)).toBeNull();
        expect(screen.getByRole('heading', { name: '(No subject)' })).toBeTruthy();
    });

    it('marks unread messages read when opened and toggles the state', async () => {
        const { store } = setup({ mails: [mail('u', { read: false })] });
        await openFolder(/^Inbox/);
        await openMessage('● Subject u');
        expect(store().state().mail[0]!.read).toBe(true);
        fireEvent.click(screen.getByText('Mark unread'));
        await settle();
        expect(store().state().mail[0]!.read).toBe(false);
        expect(screen.getByText('Mark read')).toBeTruthy();
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
        expect(screen.getByRole('heading', { name: 'Subject m' })).toBeTruthy();
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
        expect(screen.getByText('Restore')).toBeTruthy();

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
        expect(screen.getByText('SUBJECT 1')).toBeTruthy();
        await openMessage('SUBJECT 1');
        expect(screen.getByRole('heading', { name: 'SUBJECT 1' })).toBeTruthy();
    });

    it('returns from a message to its folder and then the folder list', async () => {
        setup({ mails: [mail('1')] });
        await openFolder(/^Inbox/);
        await openMessage('Subject 1');
        nav('Back');
        expect(screen.getByLabelText('Search email')).toBeTruthy();
        nav('Back');
        expect(screen.getByRole('button', { name: 'Inbox1' })).toBeTruthy();
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
        expect(screen.getByRole('heading', { name: 'Subject 1' })).toBeTruthy();
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

describe('Mailbox composing', () => {
    const composeNew = async () => {
        await openFolder(/^Inbox/);
        nav('Compose');
    };
    const fillValid = () => {
        field('TO', 'friend@example.test');
        field('Subject', 'Hello');
        field('Body', 'Hi there');
    };

    it('composes and sends a message, moving to the sent folder', async () => {
        const { store } = setup();
        await composeNew();
        expect(screen.getByText(`From: ${ME}`)).toBeTruthy();
        fillValid();
        nav('Send');
        await settle();
        expect(store().state().mail[0]).toMatchObject({
            folder: 'sent',
            to: 'friend@example.test',
            subject: 'Hello',
        });
        expect(screen.getByLabelText('Search email')).toBeTruthy();
    });

    it('reports invalid recipients and keeps the draft', async () => {
        setup();
        await composeNew();
        field('TO', 'not-an-address');
        nav('Send');
        await settle();
        expect(alertText()).toBe('Enter valid email recipients separated by commas.');
        expect(screen.getByLabelText('TO')).toBeTruthy();
    });

    it('uses a fallback message for non-Error send failures and ignores repeated submits', async () => {
        const gate = deferred<Mail>();
        const send = vi.fn(() => gate.promise);
        setup({ emailService: { send } });
        await composeNew();
        fillValid();
        const form = screen.getByLabelText('TO').closest('form')!;
        fireEvent.submit(form);
        fireEvent.submit(form);
        expect(send).toHaveBeenCalledTimes(1);
        await act(async () => gate.reject('boom'));
        expect(alertText()).toBe('Email could not be sent. Your draft is still open.');
    });

    it('saves drafts and rejects drafts that exceed limits', async () => {
        const { store } = setup();
        await composeNew();
        field('Subject', 'x'.repeat(501));
        nav('Save draft');
        await settle();
        expect(alertText()).toBe('Message or attachments exceed supported limits.');

        field('Subject', 'Draft subject');
        nav('Save draft');
        await settle();
        expect(store().state().mail[0]).toMatchObject({
            folder: 'drafts',
            subject: 'Draft subject',
        });
        expect(screen.getByRole('button', { name: 'Drafts' })).toBeTruthy();
    });

    it('does not close the draft when the store rejects the save', async () => {
        setup({
            prepare: (store) => {
                store.put = async () => false;
            },
        });
        await composeNew();
        nav('Save draft');
        await settle();
        expect(screen.getByLabelText('TO')).toBeTruthy();
    });

    it('asks before discarding changed drafts but not unchanged ones', async () => {
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
        setup();
        await composeNew();
        nav('Back');
        expect(confirm).not.toHaveBeenCalled();
        expect(screen.queryByLabelText('TO')).toBeNull();

        nav('Compose');
        field('Subject', 'Changed');
        nav('Back');
        expect(confirm).toHaveBeenCalledWith('Discard unsaved draft changes?');
        expect(screen.getByLabelText('TO')).toBeTruthy();
        confirm.mockReturnValue(true);
        nav('Back');
        expect(screen.queryByLabelText('TO')).toBeNull();
    });

    it('replies, replies to all and forwards from a message', async () => {
        setup({
            mails: [
                mail('1', {
                    to: `${ME}, other@example.test`,
                    cc: 'cc@example.test',
                    attachments: [asset('keep.txt')],
                }),
            ],
        });
        await openFolder(/^Inbox/);
        await openMessage('Subject 1');
        nav('Reply');
        expect((screen.getByLabelText('TO') as HTMLInputElement).value).toBe('sender@example.test');
        expect((screen.getByLabelText('Subject') as HTMLInputElement).value).toBe('Re: Subject 1');
        nav('Back');

        fireEvent.click(screen.getByText('Reply all'));
        expect((screen.getByLabelText('CC') as HTMLInputElement).value).toContain(
            'other@example.test',
        );
        nav('Back');

        fireEvent.click(screen.getByText('Forward'));
        expect((screen.getByLabelText('TO') as HTMLInputElement).value).toBe('');
        expect(screen.getByText('keep.txt')).toBeTruthy();
    });

    it('edits stored drafts without reply actions', async () => {
        setup({ mails: [mail('d', { folder: 'drafts', previousFolder: 'drafts' })] });
        await openFolder(/^Drafts/);
        await openMessage('Subject d');
        expect(screen.queryByText('Reply all')).toBeNull();
        expect(screen.queryByText('Forward')).toBeNull();
        nav('Edit draft');
        expect((screen.getByLabelText('Subject') as HTMLInputElement).value).toBe('Subject d');
    });

    it('opens the compose form from a folder view with the folder label active', async () => {
        setup();
        await openFolder(/^Trash/);
        nav('Trash');
        expect(screen.getByLabelText('Search email')).toBeTruthy();
        nav('Compose');
        expect(screen.getByRole('heading', { name: 'New email' })).toBeTruthy();
    });

    describe('attachments', () => {
        const file = (name = 'doc.txt') => new File(['hi'], name, { type: 'text/plain' });
        const attach = async (selected: File | null) => {
            fireEvent.change(screen.getByLabelText('Add attachment'), {
                target: { files: selected ? [selected] : [] },
            });
            await settle();
        };

        it('adds and removes attachments', async () => {
            setup();
            await composeNew();
            await attach(file('doc.txt'));
            expect(screen.getByText('doc.txt')).toBeTruthy();
            fireEvent.click(screen.getByRole('button', { name: 'Remove doc.txt' }));
            expect(screen.queryByText('doc.txt')).toBeNull();
        });

        it('ignores empty selections', async () => {
            const { readAsset } = setup();
            await composeNew();
            await attach(null);
            expect(readAsset).not.toHaveBeenCalled();
        });

        it('limits drafts to twenty attachments', async () => {
            setup({
                mails: [
                    mail('1', {
                        attachments: Array.from({ length: 20 }, (_, i) => asset(`f${i}.txt`)),
                    }),
                ],
            });
            await openFolder(/^Inbox/);
            await openMessage('Subject 1');
            fireEvent.click(screen.getByText('Forward'));
            await attach(file());
            expect(alertText()).toBe('A message supports up to 20 attachments.');
        });

        it('reports attachment read failures with a fallback', async () => {
            const readAsset = vi.fn(async () => {
                throw new Error('Too big');
            });
            setup({ readAsset });
            await composeNew();
            await attach(file());
            expect(alertText()).toBe('Too big');
            readAsset.mockImplementationOnce(() => Promise.reject('bad'));
            await attach(file());
            expect(alertText()).toBe('Attachment could not be read.');
        });

        it('drops an attachment that finishes reading after the draft changed', async () => {
            const gate = deferred<Asset>();
            let onCompose!: (mail: Mail) => void;
            const sources: MailboxSource[] = [
                {
                    id: 's',
                    label: 'Source',
                    render: (compose) => {
                        onCompose = compose;
                        return (
                            <button onClick={() => compose(mail('first', { subject: 'First' }))}>
                                go
                            </button>
                        );
                    },
                },
            ];
            setup({ sources, readAsset: () => gate.promise });
            fireEvent.click(screen.getByRole('button', { name: 'Source' }));
            fireEvent.click(screen.getByText('go'));
            await attach(file());
            act(() => onCompose(mail('second', { subject: 'Second' })));
            await act(async () => gate.resolve(asset('late.txt')));
            expect(screen.queryByText('late.txt')).toBeNull();
            expect((screen.getByLabelText('Subject') as HTMLInputElement).value).toBe('Second');
        });
    });
});

describe('Mailbox host defaults', () => {
    it('renders without a host provider', async () => {
        const store = emptySimulatorStore();
        const node: ReactNode = (
            <StoreHarness initial={{ ...store, mail: [mail('1')] }}>
                {(created) => <Mailbox store={created} onBack={() => {}} />}
            </StoreHarness>
        );
        render(node);
        await openFolder(/^Inbox/);
        expect(screen.getByText('Subject 1')).toBeTruthy();
    });
});
