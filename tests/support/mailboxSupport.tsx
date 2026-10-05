// @vitest-environment jsdom
import {
    emptySimulatorStore,
    type Asset,
    type Mail,
    type SimulatorStore,
} from '@signalsafe/simulator-core/apps/contracts';
import { fireEvent, render, screen } from '@testing-library/react';
import type {} from 'react';
import { vi } from 'vitest';
import Mailbox, { type MailboxSource } from '../../src/apps/mail/Mailbox';
import { SimulatorAppsProvider } from '../../src/apps/shared/SimulatorAppsHost';
import { StoreHarness, settle, type HarnessStore } from '../support/appHarness';

export const ME = 'learner@example.test';

export const mail = (id: string, overrides: Partial<Mail> = {}): Mail => ({
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

export const asset = (name: string): Asset => ({
    name,
    mime: 'text/plain',
    data: 'data:text/plain;base64,aGk=',
});

export interface Options {
    mails?: Mail[];
    initial?: Partial<SimulatorStore>;
    onBack?: () => void;
    prepare?: (store: HarnessStore) => void;
    sources?: readonly MailboxSource[];
    displayMail?: (mail: Mail) => Mail;
    emailService?: { send: (draft: Mail) => Promise<Mail> };
    readAsset?: (file: File) => Promise<Asset>;
}

export function setup({
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

export const nav = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

export const openFolder = async (name: RegExp) => {
    fireEvent.click(screen.getByRole('button', { name }));
    await settle();
};

export const openMessage = async (subject: string) => {
    fireEvent.click(screen.getByText(subject).closest('button')!);
    await settle();
};

export const field = (label: string, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });

export const alertText = () => screen.getByRole('alert').textContent;
