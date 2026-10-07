// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RegionalSettings from '../src/apps/settings/RegionalSettings';
import {
    RegionalDateFormat,
    RegionalTimeFormat,
    formatRegionalCurrency,
    formatRegionalDate,
    formatRegionalDateTime,
    isRegionalPreferences,
    type RegionalPreferences,
} from '../src/apps/settings/regionalFormats';
import { SimulatorLocaleProvider } from '../src/i18n/SimulatorLocale';

const initial: RegionalPreferences = {
    country: 'US',
    language: 'en',
    currency: 'USD',
    dateFormat: RegionalDateFormat.Locale,
    timeFormat: RegionalTimeFormat.TwelveHour,
    timeZone: 'UTC',
};
const countries = [
    { value: 'US', label: 'United States' },
    { value: 'GB', label: 'United Kingdom' },
];
afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe('shared regional settings', () => {
    it('previews an unsaved choice, saves only on submit, and follows host preference updates', async () => {
        const save = vi.fn();
        const { rerender } = render(
            <RegionalSettings value={initial} countries={countries} onSave={save} />,
        );
        fireEvent.change(screen.getByLabelText('Time format'), {
            target: { value: RegionalTimeFormat.TwentyFourHour },
        });
        fireEvent.change(screen.getByLabelText('Date format'), {
            target: { value: RegionalDateFormat.YearMonthDay },
        });
        expect(screen.getByText('Preview: 2026-11-23, 18:45:00 · $1,234.56')).toBeDefined();
        expect(save).not.toHaveBeenCalled();
        await act(async () => {
            fireEvent.submit(screen.getByRole('form', { name: 'Regional settings' }));
        });
        expect(save).toHaveBeenCalledExactlyOnceWith({
            ...initial,
            dateFormat: RegionalDateFormat.YearMonthDay,
            timeFormat: RegionalTimeFormat.TwentyFourHour,
        });
        expect(screen.getByRole('status').textContent).toBe('Regional settings saved.');
        rerender(
            <RegionalSettings
                value={{ ...initial, country: 'GB' }}
                countries={countries}
                onSave={save}
            />,
        );
        expect(screen.getByLabelText<HTMLSelectElement>('Country').value).toBe('GB');
        expect(screen.getByLabelText<HTMLSelectElement>('Time format').value).toBe(
            RegionalTimeFormat.TwelveHour,
        );
    });

    it('blocks duplicate asynchronous saves and preserves edits after persistence rejects', async () => {
        let rejectSave: (reason: Error) => void = () => {
            throw new Error('Save did not start');
        };
        const save = vi.fn(
            () =>
                new Promise<void>((_, reject) => {
                    rejectSave = reject;
                }),
        );
        render(<RegionalSettings value={initial} countries={countries} onSave={save} />);
        fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'GB' } });
        const form = screen.getByRole('form', { name: 'Regional settings' });
        fireEvent.submit(form);
        fireEvent.submit(form);
        expect(save).toHaveBeenCalledTimes(1);
        expect(
            screen.getByRole<HTMLButtonElement>('button', { name: 'Saving regional settings…' })
                .disabled,
        ).toBe(true);
        expect(screen.getByLabelText<HTMLSelectElement>('Country').disabled).toBe(true);
        await act(async () => {
            rejectSave(new Error('Private host error'));
        });
        expect(screen.getByRole('alert').textContent).toContain('Your changes are preserved');
        expect(screen.queryByText('Private host error')).toBeNull();
        expect(screen.getByLabelText<HTMLSelectElement>('Country').value).toBe('GB');
        expect(
            screen.getByRole<HTMLButtonElement>('button', { name: 'Save regional settings' })
                .disabled,
        ).toBe(false);
    });

    it('uses translated controls and the host save message', async () => {
        render(
            <SimulatorLocaleProvider messages={{ 'settings.regional.save': 'Save formats' }}>
                <RegionalSettings
                    value={initial}
                    countries={countries}
                    onSave={() => undefined}
                    savedMessage='Host preferences updated.'
                />
            </SimulatorLocaleProvider>,
        );
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Save formats' }));
        });
        expect(screen.getByRole('status').textContent).toBe('Host preferences updated.');
    });

    it('shows invalid host preferences without crashing Intl or allowing save', () => {
        const save = vi.fn();
        render(
            <RegionalSettings
                value={{ ...initial, timeZone: 'Not/AZone' }}
                countries={countries}
                onSave={save}
            />,
        );
        expect(screen.getByRole('alert').textContent).toContain('invalid');
        fireEvent.submit(screen.getByRole('form', { name: 'Regional settings' }));
        expect(save).not.toHaveBeenCalled();
        expect(
            screen.getByRole<HTMLButtonElement>('button', { name: 'Save regional settings' })
                .disabled,
        ).toBe(true);
    });
});

describe('regional settings edge cases', () => {
    it('edits each preference and lists an unlisted host country', () => {
        render(
            <RegionalSettings
                value={{ ...initial, country: 'FR' }}
                countries={countries}
                onSave={vi.fn()}
            />,
        );
        expect(screen.getByRole('option', { name: 'FR' })).toBeDefined();
        const edits = [
            ['Language for formatting', 'fr'],
            ['Currency', 'EUR'],
            ['Time zone', 'Europe/Paris'],
        ] as const;
        for (const [label, next] of edits) {
            fireEvent.change(screen.getByLabelText(label), { target: { value: next } });
            expect(screen.getByLabelText<HTMLSelectElement>(label).value).toBe(next);
        }
    });

    it('ignores a selection that is not a valid preference', () => {
        render(<RegionalSettings value={initial} countries={countries} onSave={vi.fn()} />);
        fireEvent.change(screen.getByLabelText('Language for formatting'), {
            target: { value: 'xx' },
        });
        expect(screen.getByLabelText<HTMLSelectElement>('Language for formatting').value).toBe(
            'en',
        );
        expect(screen.queryByRole('alert')).toBeNull();
    });
});

describe('regional preference contract and formatting', () => {
    it('rejects malformed persisted preferences and unsupported zones', () => {
        expect(isRegionalPreferences(initial)).toBe(true);
        for (const value of [
            null,
            {},
            { ...initial, country: 'USA' },
            { ...initial, language: 'constructor' },
            { ...initial, currency: 'usd' },
            { ...initial, dateFormat: 'short' },
            { ...initial, timeFormat: '23' },
            { ...initial, timeZone: 'Not/AZone' },
            { ...initial, timeZone: undefined },
            Object.fromEntries(Object.entries(initial).filter(([key]) => key !== 'timeZone')),
        ]) {
            expect(isRegionalPreferences(value)).toBe(false);
        }
    });

    it('uses the selected zone for calendar boundaries and formats', () => {
        const date = new Date('2026-11-23T00:45:00Z');
        const settings = {
            ...initial,
            timeZone: 'America/Denver',
            dateFormat: RegionalDateFormat.MonthDayYear,
        };
        expect(formatRegionalDate(date, settings)).toBe('11/22/2026');
        expect(
            formatRegionalDate(date, { ...settings, dateFormat: RegionalDateFormat.DayMonthYear }),
        ).toBe('22/11/2026');
        expect(
            formatRegionalDate(date, { ...settings, dateFormat: RegionalDateFormat.YearMonthDay }),
        ).toBe('2026-11-22');
        expect(formatRegionalDateTime(date, settings)).toBe('11/22/2026, 5:45:00 PM');
        expect(
            formatRegionalDateTime(date, {
                ...settings,
                timeFormat: RegionalTimeFormat.TwentyFourHour,
            }),
        ).toBe('11/22/2026, 17:45:00');
        expect(formatRegionalCurrency(1234.56, initial)).toBe('$1,234.56');
    });

    it('falls back to empty date fields when the formatter reports no parts', () => {
        vi.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts').mockReturnValue([]);
        const settings = { ...initial, dateFormat: RegionalDateFormat.YearMonthDay };
        expect(formatRegionalDate(new Date('2026-11-23T00:45:00Z'), settings)).toBe('--');
    });
});
