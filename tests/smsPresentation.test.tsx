// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { SimulatorLocaleProvider } from '../src/i18n/SimulatorLocale';
import { SimulatorRegionalPresentationProvider } from '../src/contract/regionalPresentation';
import {
    RegionalDateFormat,
    RegionalTimeFormat,
    type RegionalPreferences,
} from '../src/apps/settings/regionalFormats';
import { SmsMessageTimeline } from '../src/views/messages/SmsMessageTimeline';
import SmsSimulatorView from '../src/views/messages/SmsSimulatorView';
import MessagesThreadListView from '../src/views/messages/MessagesThreadListView';
import { MessageSender, SmsMode, type SimulatorSmsPayload } from '../src/types/session';

const instant = '2026-10-05T12:00:00.000Z';
const regional: RegionalPreferences = {
    country: 'US',
    language: 'en',
    currency: 'USD',
    dateFormat: RegionalDateFormat.YearMonthDay,
    timeFormat: RegionalTimeFormat.TwentyFourHour,
    timeZone: 'UTC',
};
const visible = [
    { id: 'known', from: MessageSender.Them, text: 'Known instant', timestamp: instant },
    {
        id: 'authored',
        from: MessageSender.Me,
        text: 'Authored label',
        timestamp: 'Yesterday afternoon',
    },
];
function Messages() {
    return (
        <>
            <MessagesThreadListView
                threads={visible.map((message) => ({
                    id: message.id,
                    preview: message.text,
                    timestamp: message.timestamp,
                }))}
                onSelectThread={vi.fn()}
            />
            <SmsMessageTimeline visible={visible} onAction={vi.fn()} />
        </>
    );
}

it('formats ISO labels in the default package list and timeline while preserving authored labels', () => {
    const view = render(
        <SimulatorLocaleProvider locale='en-US' timeZone='UTC'>
            <Messages />
        </SimulatorLocaleProvider>,
    );
    const expected = new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
    }).format(new Date(instant));
    expect(view.container.querySelector('.simulator-messages__thread-time')?.textContent).toBe(
        expected,
    );
    expect(
        screen
            .getByText('Known instant', { selector: '.simulator-messages__bubble span' })
            .closest('li')?.title,
    ).toBe(expected);
    expect(
        screen
            .getByText('Authored label', { selector: '.simulator-messages__bubble span' })
            .closest('li')?.title,
    ).toBe('Yesterday afternoon');
    expect(screen.getByText('Yesterday afternoon')).toBeTruthy();
    expect(visible[0]?.timestamp).toBe(instant);
});

it('updates list and timeline formatting when regional preferences change and honors explicit overrides', () => {
    const draw = (value: RegionalPreferences, formatDateTime?: (date: Date) => string) => (
        <SimulatorRegionalPresentationProvider value={value} formatDateTime={formatDateTime}>
            <Messages />
        </SimulatorRegionalPresentationProvider>
    );
    const view = render(draw(regional));
    expect(view.container.querySelector('.simulator-messages__thread-time')?.textContent).toBe(
        '2026-10-05, 12:00:00',
    );
    view.rerender(
        draw({
            ...regional,
            timeZone: 'America/Denver',
            timeFormat: RegionalTimeFormat.TwelveHour,
        }),
    );
    expect(view.container.querySelector('.simulator-messages__thread-time')?.textContent).toBe(
        '2026-10-05, 6:00:00 AM',
    );
    expect(
        screen
            .getByText('Known instant', { selector: '.simulator-messages__bubble span' })
            .closest('li')?.title,
    ).toBe('2026-10-05, 6:00:00 AM');
    const override = vi.fn(() => 'Host date');
    view.rerender(draw(regional, override));
    expect(screen.getByText('Host date')).toBeTruthy();
    expect(
        screen
            .getByText('Known instant', { selector: '.simulator-messages__bubble span' })
            .closest('li')?.title,
    ).toBe('Host date');
    expect(override).toHaveBeenCalledWith(new Date(instant));
    expect(screen.getByText('Yesterday afternoon')).toBeTruthy();
});

it('renders unavailable attachments from typed availability and retains the full localized accessible label', () => {
    const onAction = vi.fn();
    const view = render(
        <SimulatorLocaleProvider
            messages={{
                'screen.smsSimulatorView.attachment.unavailable':
                    'Pièce jointe indisponible : {label}',
            }}
        >
            <SmsMessageTimeline
                visible={[
                    {
                        id: 'received',
                        from: MessageSender.Them,
                        text: 'Received',
                        attachment: { label: 'photo.jpg · non disponible' },
                    },
                    {
                        id: 'sent',
                        from: MessageSender.Me,
                        text: 'Sent',
                        attachment: { label: 'two attachments; text only saved.', url: '' },
                    },
                ]}
                onAction={onAction}
            />
        </SimulatorLocaleProvider>,
    );
    const received = screen.getByRole('button', {
        name: 'Pièce jointe indisponible : photo.jpg · non disponible',
    });
    expect(received.tabIndex).toBe(0);
    expect(received.title).toBe('Pièce jointe indisponible : photo.jpg · non disponible');
    expect(received.parentElement?.dataset.attachmentStatus).toBe('unavailable');
    expect(
        received.parentElement?.classList.contains('simulator-messages__attachment-row--sent'),
    ).toBe(false);
    expect(
        screen
            .getByRole('button', { name: /two attachments/ })
            .parentElement?.classList.contains('simulator-messages__attachment-row--sent'),
    ).toBe(true);
    fireEvent.click(received);
    expect(received.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById(received.getAttribute('aria-controls') ?? '')?.hidden).toBe(
        false,
    );
    expect(document.getElementById(received.getAttribute('aria-controls') ?? '')?.textContent).toBe(
        received.title,
    );
    fireEvent.click(received);
    expect(received.getAttribute('aria-expanded')).toBe('false');
    expect(onAction).not.toHaveBeenCalled();
    view.rerender(
        <SmsMessageTimeline
            visible={[
                {
                    id: 'received',
                    from: MessageSender.Them,
                    text: 'Received',
                    attachment: { label: 'Changed label' },
                },
            ]}
            onAction={onAction}
        />,
    );
    expect(
        screen.getByRole('button', { name: 'Attachment unavailable: Changed label' }),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: /photo.jpg/ })).toBeNull();
});

it('leaves available attachment actions intact even when their authored label says missing', () => {
    const onAction = vi.fn();
    render(
        <SimulatorLocaleProvider
            messages={{ 'screen.smsSimulatorView.open.attachment': 'Ouvrir : {label}' }}
        >
            <SmsMessageTimeline
                visible={[
                    {
                        id: 'file',
                        from: MessageSender.Me,
                        text: 'Available',
                        attachment: { label: 'missing information.pdf', url: '/file.pdf' },
                    },
                ]}
                onAction={onAction}
            />
        </SimulatorLocaleProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir : missing information.pdf' }));
    expect(onAction).toHaveBeenCalledWith({ type: 'click_link', href: '/file.pdf' });
    expect(screen.queryByRole('button', { name: /Attachment unavailable/ })).toBeNull();
});

it('keeps historical read-only threads noneditable while exposing unavailable attachment details', () => {
    const onAction = vi.fn();
    const payload: SimulatorSmsPayload = {
        mode: SmsMode.History,
        readOnly: true,
        visibleMessageCount: 1,
        thread: {
            sender_display_name: 'Taylor',
            messages: [
                {
                    from: MessageSender.Them,
                    text: 'Imported evidence',
                    attachment: { label: 'photo.jpg' },
                },
            ],
        },
    };
    render(
        <SmsSimulatorView
            payload={payload}
            visibleCount={1}
            onAction={onAction}
            onRevealNext={vi.fn()}
        />,
    );
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Attachment unavailable: photo.jpg' }).tabIndex).toBe(
        0,
    );
    expect(onAction).not.toHaveBeenCalled();
});
