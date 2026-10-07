// @vitest-environment jsdom
import type { Mail } from '@signalsafe/simulator-core/apps/contracts';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import {
    useScenarioEmailSource,
    type ScenarioEmailSourceOptions,
} from '../src/apps/mail/ScenarioEmailSource';
import { SimulatorLocaleProvider } from '../src/i18n/SimulatorLocale';
import type { SimulatorEmailPayload } from '../src/types/session';
import { setup } from './support/mailboxSupport';

afterEach(cleanup);

const identity = 'learner@example.test';
function email(): SimulatorEmailPayload {
    return {
        inbox: [
            {
                id: 'original',
                subject: 'Original',
                from: 'sender@example.test',
                snippet: 'Short preview',
            },
        ],
        outbox: [{ id: 'sent', subject: 'Sent original', from: identity, snippet: 'Sent preview' }],
        trash: [{ id: 'trash', subject: '', from: 'other@example.test' }],
        selectedMessageId: 'original',
        selectedMessage: {
            subject: 'Original',
            from: 'sender@example.test',
            reply_to: 'replies@example.test',
            to: identity,
            cc: 'team@example.test',
            body: 'Complete scenario text',
        },
    };
}
function Source({
    onCompose,
    ...options
}: ScenarioEmailSourceOptions & { onCompose: (mail: Mail) => void }) {
    const source = useScenarioEmailSource(options);
    return source ? <div aria-label={source.label}>{source.render(onCompose)}</div> : null;
}
function props(
    overrides: Partial<Pick<ScenarioEmailSourceOptions, 'payload' | 'selectedMessageId'>> = {},
) {
    return {
        payload: email(),
        identity,
        onSelectMessage: vi.fn<(id: string) => void>(),
        onCompose: vi.fn<(mail: Mail) => void>(),
        ...overrides,
    };
}

it('keeps scenario email opt-in and omits it without a supplied payload', () => {
    const view = render(<Source {...props({ payload: null })} />);
    expect(view.container.childElementCount).toBe(0);
    view.unmount();
    setup();
    expect(screen.queryByRole('button', { name: 'Scenario email' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Imported email' })).toBeNull();
});

it('routes selections from all scenario folders to the host without mutating the payload', () => {
    const options = props();
    const original = JSON.stringify(options.payload);
    render(<Source {...options} />);
    for (const subject of ['Original', 'Sent original', '(No subject)']) {
        fireEvent.click(screen.getByRole('button', { name: subject }));
    }
    expect(options.onSelectMessage.mock.calls).toEqual([['original'], ['sent'], ['trash']]);
    expect(JSON.stringify(options.payload)).toBe(original);
    expect(screen.queryByRole('button', { name: /delete|mark.*read/i })).toBeNull();
    expect(screen.getByText(/Scenario content is read-only/)).toBeTruthy();
});

it('uses the selected row preview instead of another message’s full content', () => {
    const options = props({ selectedMessageId: 'sent' });
    render(<Source {...options} />);
    expect(screen.getByText('Sent preview')).toBeTruthy();
    expect(screen.getByText(/Only the scenario preview text/)).toBeTruthy();
    expect(screen.queryByText('Complete scenario text')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Forward in simulated mailbox' }));
    expect(options.onCompose).toHaveBeenCalledWith(
        expect.objectContaining({
            subject: 'Fwd: Sent original',
            body: expect.stringContaining('Sent preview'),
        }),
    );
});

it('creates independent reply and forward drafts while preserving the read-only original', () => {
    const options = props();
    const original = JSON.stringify(options.payload);
    render(<Source {...options} />);
    expect(screen.queryByText(/Only the scenario preview text/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Reply in simulated mailbox' }));
    fireEvent.click(screen.getByRole('button', { name: 'Forward in simulated mailbox' }));
    const reply = options.onCompose.mock.calls[0]?.[0];
    const forward = options.onCompose.mock.calls[1]?.[0];
    expect(reply).toMatchObject({
        folder: 'drafts',
        threadId: 'original',
        from: identity,
        to: 'replies@example.test',
        subject: 'Re: Original',
        sourceRecordId: null,
    });
    expect(reply?.id).not.toBe('original');
    expect(reply?.body).toContain('Complete scenario text');
    expect(forward).toMatchObject({
        folder: 'drafts',
        from: identity,
        to: '',
        cc: '',
        subject: 'Fwd: Original',
    });
    expect(forward?.threadId).not.toBe('original');
    expect(forward?.body).toContain('--- sender@example.test ---');
    expect(forward?.body).toContain('Complete scenario text');
    expect(JSON.stringify(options.payload)).toBe(original);
});

it('handles empty folders and unknown selection without exposing stale content', () => {
    render(
        <Source
            {...props({
                payload: { inbox: [], selectedMessage: null, selectedMessageId: null },
                selectedMessageId: 'missing',
            })}
        />,
    );
    expect(screen.getAllByText('No scenario messages in this folder.')).toHaveLength(3);
    expect(screen.queryByRole('article')).toBeNull();
    expect(screen.queryByRole('button', { name: /in simulated mailbox/ })).toBeNull();
});

it('uses the host locale for the optional source label, folders and actions', () => {
    render(
        <SimulatorLocaleProvider
            messages={{
                'app.mail.scenario.source': 'Courrier du scénario',
                'app.mail.folder.inbox': 'Réception',
                'app.mail.scenario.reply': 'Répondre',
            }}
        >
            <Source {...props()} />
        </SimulatorLocaleProvider>,
    );
    expect(screen.getByLabelText('Courrier du scénario')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Réception' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Répondre' })).toBeTruthy();
});

it('previews a selected row that has no snippet with an empty body', () => {
    render(<Source {...props({ selectedMessageId: 'trash' })} />);
    expect(screen.getByText(/Only the scenario preview text/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: '(No subject)', level: 4 })).toBeTruthy();
});

it('drafts from a full message without reply-to, subject or selected id', () => {
    const options = props({
        payload: {
            inbox: [],
            selectedMessageId: null,
            selectedMessage: { subject: '', from: 'sender@example.test', body: 'Body text' },
        },
    });
    render(<Source {...options} />);
    expect(screen.getByRole('heading', { name: '(No subject)', level: 4 })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reply in simulated mailbox' }));
    expect(options.onCompose).toHaveBeenCalledWith(
        expect.objectContaining({ threadId: 'scenario', to: 'sender@example.test' }),
    );
});
