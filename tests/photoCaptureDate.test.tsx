// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PhotoMetadata } from '@signalsafe/simulator-core/apps/contracts';
import { formatPhotoCaptureDate } from '../src/apps/photos/captureDate.js';
import {
    parseRegionalDateInput,
    regionalDateInput,
} from '../src/apps/settings/regionalDateInput.js';
import {
    SimulatorAppsProvider,
    useSimulatorAppsHost,
} from '../src/apps/shared/SimulatorAppsHost.js';
import { SimulatorLocaleProvider } from '../src/i18n/SimulatorLocale.js';
import { createTranslator, simulatorEnglish } from '../src/i18n/catalog.js';
import { SimulatorRegionalPresentationProvider } from '../src/contract/regionalPresentation.js';
import type { RegionalPreferences } from '../src/apps/settings/regionalFormats.js';

const metadata: PhotoMetadata = {
    capturedAt: '2026-09-25T13:45:00',
    timeZone: '-06:00',
    latitude: null,
    longitude: null,
};
const t = createTranslator(simulatorEnglish).t;
const regional: RegionalPreferences = {
    country: 'US',
    language: 'en',
    currency: 'USD',
    dateFormat: 'ymd',
    timeFormat: '24',
    timeZone: 'Asia/Kathmandu',
};

function CaptureDate({ value = metadata }: { value?: PhotoMetadata }) {
    const host = useSimulatorAppsHost();
    return <output>{host.formatCaptureDate(value)}</output>;
}

describe('shared capture date interpretation', () => {
    it('converts IANA and explicit offset capture times without depending on the browser zone', () => {
        const formatDate = (date: Date) => date.toISOString();
        for (const timeZone of ['-06:00', 'America/Denver']) {
            expect(formatPhotoCaptureDate({ ...metadata, timeZone }, formatDate, t)).toBe(
                '2026-09-25T19:45:00.000Z',
            );
        }
        expect(parseRegionalDateInput('2026-09-24T12:00', 'Asia/Kathmandu')).toBe(
            Date.parse('2026-09-24T06:15:00Z'),
        );
        const instant = Date.parse('2026-11-23T02:45:00.123Z');
        expect(regionalDateInput(instant, 'America/Denver')).toBe('2026-11-22T19:45:00.123');
        expect(parseRegionalDateInput('2026-11-22T19:45:00.123', 'America/Denver')).toBe(instant);
    });

    it.each([
        ['2026-02-30T12:00', 'UTC'],
        ['2026-02-30T12:00', '-06:00'],
        ['2026-03-08T02:30', 'America/Denver'],
        ['2026-11-01T01:30', 'America/Denver'],
        ['2026-04-05T01:45', 'Australia/Lord_Howe'],
        ['2026-09-25T13:45', 'America/De'],
        ['2026-09-25T13:45', '+25:00'],
        ['2026-09-25T13:45', '+14:30'],
        ['2026-09-25T13:45', '+15:00'],
        ['2026-09-25T13:45', ''],
        ['not a date', 'UTC'],
        ['2026-13-45T10:00', 'UTC'],
    ])('rejects invalid or ambiguous capture time %s (%s)', (capturedAt, timeZone) => {
        expect(parseRegionalDateInput(capturedAt, timeZone)).toBeNaN();
    });

    it('uses empty fields when the formatter reports no date parts', () => {
        vi.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts').mockReturnValueOnce([]);
        expect(regionalDateInput(0, 'UTC')).toBe('--T::.000');
        vi.restoreAllMocks();
    });

    it('accepts valid times adjacent to DST transitions', () => {
        expect(parseRegionalDateInput('2026-03-08T03:30', 'America/Denver')).toBe(
            Date.parse('2026-03-08T09:30:00Z'),
        );
        expect(parseRegionalDateInput('2026-11-01T02:30', 'America/Denver')).toBe(
            Date.parse('2026-11-01T09:30:00Z'),
        );
    });

    it('localizes unknown and invalid metadata without inventing an instant', () => {
        const formatDate = vi.fn(() => 'unexpected');
        const translate = createTranslator(simulatorEnglish, {
            'app.photos.captureUnknown': 'Date inconnue',
            'app.photos.captureZoneUnknown': 'fuseau inconnu',
            'app.photos.captureInvalid': '{when} — heure non valide ({zone})',
        }).t;
        expect(formatPhotoCaptureDate({ ...metadata, capturedAt: '' }, formatDate, translate)).toBe(
            'Date inconnue',
        );
        expect(formatPhotoCaptureDate({ ...metadata, timeZone: '' }, formatDate, translate)).toBe(
            '2026-09-25 13:45:00 (fuseau inconnu)',
        );
        expect(
            formatPhotoCaptureDate({ ...metadata, timeZone: 'America/De' }, formatDate, translate),
        ).toBe('2026-09-25 13:45:00 — heure non valide (America/De)');
        expect(formatDate).not.toHaveBeenCalled();
    });
});

describe('portable photo date defaults', () => {
    it('uses the shared locale and timezone without a host capture formatter', () => {
        render(
            <SimulatorLocaleProvider locale='en-GB' timeZone='UTC'>
                <CaptureDate />
            </SimulatorLocaleProvider>,
        );
        expect(screen.getByText('25/09/2026, 19:45:00')).toBeTruthy();
    });

    it('updates saved regional timezone, date order and time format without remounting', () => {
        const view = render(
            <SimulatorRegionalPresentationProvider value={regional}>
                <CaptureDate />
            </SimulatorRegionalPresentationProvider>,
        );
        expect(screen.getByText('2026-09-26, 01:30:00')).toBeTruthy();
        view.rerender(
            <SimulatorRegionalPresentationProvider
                value={{
                    ...regional,
                    timeZone: 'America/Denver',
                    dateFormat: 'mdy',
                    timeFormat: '12',
                }}
            >
                <CaptureDate />
            </SimulatorRegionalPresentationProvider>,
        );
        expect(screen.getByText('09/25/2026, 1:45:00 PM')).toBeTruthy();
    });

    it('preserves inherited regional and explicit app formatting overrides', () => {
        const dateFormatter = vi.fn((date: Date) => `Host: ${date.toISOString()}`);
        const view = render(
            <SimulatorRegionalPresentationProvider value={regional} formatDateTime={dateFormatter}>
                <SimulatorAppsProvider value={{}}>
                    <CaptureDate />
                </SimulatorAppsProvider>
            </SimulatorRegionalPresentationProvider>,
        );
        expect(screen.getByText('Host: 2026-09-25T19:45:00.000Z')).toBeTruthy();
        view.rerender(
            <SimulatorAppsProvider value={{ formatDate: () => 'App date' }}>
                <SimulatorAppsProvider value={{}}>
                    <CaptureDate />
                </SimulatorAppsProvider>
            </SimulatorAppsProvider>,
        );
        expect(screen.getByText('App date')).toBeTruthy();
        view.rerender(
            <SimulatorAppsProvider value={{ formatCaptureDate: () => 'Explicit capture label' }}>
                <SimulatorAppsProvider value={{}}>
                    <CaptureDate />
                </SimulatorAppsProvider>
            </SimulatorAppsProvider>,
        );
        expect(screen.getByText('Explicit capture label')).toBeTruthy();
    });

    it('uses localized default labels from the current provider', () => {
        render(
            <SimulatorLocaleProvider messages={{ 'app.photos.captureUnknown': 'Date inconnue' }}>
                <CaptureDate value={{ ...metadata, capturedAt: '' }} />
            </SimulatorLocaleProvider>,
        );
        expect(screen.getByText('Date inconnue')).toBeTruthy();
    });
});
