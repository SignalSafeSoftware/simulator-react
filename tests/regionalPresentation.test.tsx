// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SimulatorLocaleProvider } from '../src/i18n/SimulatorLocale.js';
import {
    RegionalDateFormat,
    RegionalTimeFormat,
    type RegionalPreferences,
} from '../src/apps/settings/regionalFormats.js';
import {
    SimulatorRegionalPresentationProvider,
    useTimestampFormatter,
} from '../src/contract/regionalPresentation.js';
import {
    PhoneNumberFormatContext,
    formatPhoneNumber,
    usePhoneNumberFormatter,
} from '../src/contract/phonePresentation.js';
import PhoneHistoryList from '../src/views/phone/PhoneHistoryList.js';
import PhoneHistoryDetail from '../src/views/phone/PhoneHistoryDetail.js';
import PhoneSimulatorView from '../src/views/phone/PhoneSimulatorView.js';

const instant = '2026-10-05T12:00:00.000Z';
const number = '+12025550123';
const regional: RegionalPreferences = {
    country: 'US',
    language: 'en',
    currency: 'USD',
    dateFormat: RegionalDateFormat.YearMonthDay,
    timeFormat: RegionalTimeFormat.TwentyFourHour,
    timeZone: 'America/Denver',
};
function Values({ timestamp = instant, phone = number }: { timestamp?: string; phone?: string }) {
    const formatTimestamp = useTimestampFormatter();
    const formatNumber = usePhoneNumberFormatter();
    return (
        <>
            <output data-testid='time'>{formatTimestamp(timestamp)}</output>
            <output data-testid='phone'>{formatNumber(phone)}</output>
        </>
    );
}

describe('shared regional presentation', () => {
    it('formats phone labels using the selected country without inferring a dialing address', () => {
        for (const value of ['2025550123', '+12025550123', '1 (202) 555-0123', '+1 202-555-0123']) {
            expect(formatPhoneNumber(value)).toBe('(202) 555-0123');
        }
        expect(formatPhoneNumber('+442079460123')).toBe('+44 20 7946 0123');
        expect(formatPhoneNumber('+66626247677')).toBe('+66 62 624 7677');
        expect(formatPhoneNumber('+442079460123', 'GB')).toBe('020 7946 0123');
        expect(formatPhoneNumber(number, 'GB')).toBe('+1 202 555 0123');
        for (const value of [
            '+12025550123 ext 4',
            '+1202',
            '12345',
            'Anonymous',
            '02079460123',
            '',
        ]) {
            expect(formatPhoneNumber(value, 'GB')).toBe(value);
        }
    });

    it('formats history rows and details by default using the existing locale and timezone', () => {
        render(
            <SimulatorLocaleProvider locale='en-US' timeZone='UTC'>
                <PhoneHistoryList
                    entries={[
                        {
                            id: 'call',
                            name: 'Taylor',
                            number,
                            timestamp: instant,
                            kind: 'incoming',
                        },
                    ]}
                    onSelectIncoming={vi.fn()}
                    onSelectVoicemail={vi.fn()}
                />
                <PhoneHistoryDetail caller='Taylor' number={number} timestamp={instant} />
            </SimulatorLocaleProvider>,
        );
        expect(screen.getAllByText('(202) 555-0123')).toHaveLength(2);
        expect(screen.getAllByText('10/5/2026, 12:00:00 PM')).toHaveLength(2);
        expect(screen.queryByText(instant)).toBeNull();
    });

    it('applies regional timezone, date order, time format and country changes together', () => {
        const view = render(
            <SimulatorRegionalPresentationProvider value={regional}>
                <Values />
            </SimulatorRegionalPresentationProvider>,
        );
        expect(screen.getByTestId('time').textContent).toBe('2026-10-05, 06:00:00');
        expect(screen.getByTestId('phone').textContent).toBe('(202) 555-0123');
        view.rerender(
            <SimulatorRegionalPresentationProvider
                value={{
                    ...regional,
                    country: 'GB',
                    dateFormat: RegionalDateFormat.DayMonthYear,
                    timeFormat: RegionalTimeFormat.TwelveHour,
                    timeZone: 'Europe/London',
                }}
            >
                <Values />
            </SimulatorRegionalPresentationProvider>,
        );
        expect(screen.getByTestId('time').textContent).toBe('05/10/2026, 1:00:00 pm');
        expect(screen.getByTestId('phone').textContent).toBe('+1 202 555 0123');
    });

    it('uses locale country and timezone in standalone views without a regional provider', () => {
        render(
            <SimulatorLocaleProvider locale='en-GB' timeZone='Europe/London'>
                <Values phone='+442079460123' />
            </SimulatorLocaleProvider>,
        );
        expect(screen.getByTestId('phone').textContent).toBe('020 7946 0123');
        expect(screen.getByTestId('time').textContent).toBe('05/10/2026, 13:00:00');
    });

    it.each([
        'Yesterday',
        'Monday 9:15 AM',
        '10/5/2026, 12:00:00 PM',
        '2026-10-05',
        '2026-10-05T12:00:00',
        '2026-02-30T12:00:00Z',
        '2025-02-29T12:00:00Z',
        '2026-10-05T25:00:00Z',
        'not a date',
        '',
    ])('preserves authored, ambiguous or invalid timestamp %s', (timestamp) => {
        const formatDateTime = vi.fn(() => 'Formatted');
        render(
            <SimulatorRegionalPresentationProvider value={regional} formatDateTime={formatDateTime}>
                <Values timestamp={timestamp} />
            </SimulatorRegionalPresentationProvider>,
        );
        expect(screen.getByTestId('time').textContent).toBe(timestamp);
        expect(formatDateTime).not.toHaveBeenCalled();
    });

    it.each(['2024-02-29T14:30:00.123456+02:30', '2024-02-29T12:00:00.123456Z'])(
        'keeps explicit formatter overrides and parses valid ISO instant %s',
        (timestamp) => {
            const phoneOverride = vi.fn((value: string) => `Phone ${value}`);
            const dateOverride = vi.fn((date: Date) => date.toISOString());
            render(
                <PhoneNumberFormatContext.Provider value={phoneOverride}>
                    <SimulatorRegionalPresentationProvider
                        value={regional}
                        formatDateTime={dateOverride}
                    >
                        <Values timestamp={timestamp} />
                    </SimulatorRegionalPresentationProvider>
                </PhoneNumberFormatContext.Provider>,
            );
            expect(screen.getByTestId('phone').textContent).toBe(`Phone ${number}`);
            expect(phoneOverride).toHaveBeenCalledWith(number);
            expect(screen.getByTestId('time').textContent).toBe('2024-02-29T12:00:00.123Z');
            expect(dateOverride).toHaveBeenCalledWith(new Date('2024-02-29T12:00:00.123Z'));
        },
    );

    it('retains explicit display numbers and raw call actions after formatting call details', () => {
        const onAction = vi.fn();
        const payload = {
            content: null,
            chosenIndex: null,
            callHistory: [
                {
                    id: 'call',
                    name: 'Taylor',
                    number,
                    displayNumber: 'Private business line',
                    timestamp: instant,
                    kind: 'incoming' as const,
                },
            ],
        };
        const view = render(
            <SimulatorRegionalPresentationProvider value={regional}>
                <PhoneSimulatorView
                    payload={payload}
                    screen='history'
                    contacts={[]}
                    phoneCapabilities={{ dial: true, voicemail: false, directory: false }}
                    onNavigate={vi.fn()}
                    onAction={onAction}
                />
            </SimulatorRegionalPresentationProvider>,
        );
        expect(screen.getByText('Private business line')).toBeTruthy();
        const row = view.container.querySelector<HTMLButtonElement>(
            '[data-simulator-history-id="call"]',
        );
        if (!row) throw new Error('Missing call history row');
        fireEvent.click(row);
        expect(screen.getAllByText('2026-10-05, 06:00:00')).toHaveLength(2);
        fireEvent.click(screen.getByRole('button', { name: 'Call' }));
        expect(onAction).toHaveBeenCalledWith({ type: 'dial_phone', dialedNumber: number });
        expect(payload.callHistory[0]?.number).toBe(number);
        expect(payload.callHistory[0]?.timestamp).toBe(instant);
    });
});
