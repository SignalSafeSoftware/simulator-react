// @vitest-environment jsdom
import {
    emptySimulatorStore,
    type Asset,
    type Mail,
} from '@signalsafe/simulator-core/apps/contracts';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Mailbox, { type MailboxSource } from '../src/apps/mail/Mailbox';
import {} from '../src/apps/shared/SimulatorAppsHost';
import { StoreHarness, settle } from './support/appHarness';
import {
    ME,
    mail,
    asset,
    setup,
    nav,
    openFolder,
    openMessage,
    field,
    alertText,
} from './support/mailboxSupport';

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
