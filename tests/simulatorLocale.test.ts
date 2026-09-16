import PhoneDialView from '../src/views/PhoneDialView';
import { SimulatorCapabilitiesContext } from '../src/contract/capabilities';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SimulatorLocaleProvider } from '../src/i18n/SimulatorLocale';
import { SimulatorDetailBackBar } from '../src/components/SimulatorDetail';
import { SimulatorSearchInput } from '../src/components/SimulatorSearchInput';
import { describe, expect, it } from 'vitest';
import { createTranslator, simulatorEnglish } from '../src/i18n/catalog';

describe('locale infrastructure', () => {
    it('falls back per key and interpolates long plain text without markup interpretation', () => {
        const long = 'A long translated search result: {query} '.repeat(8);
        const locale = createTranslator(simulatorEnglish, { 'search.empty': long });
        expect(locale.t('action.send')).toBe('Send');
        expect(locale.t('search.empty', { query: '<script>evidence</script>' })).toBe(
            long.replaceAll('{query}', '<script>evidence</script>'),
        );
    });

    it('supports host catalogs, plural counts, and independent explicit timezones', () => {
        const catalog = { items: { one: '{count} item', other: '{count} items' } };
        const utc = createTranslator(catalog, {}, { locale: 'en-US', timeZone: 'UTC' });
        const pacific = createTranslator(
            catalog,
            {},
            { locale: 'en-US', timeZone: 'America/Los_Angeles' },
        );
        expect(utc.t('items', { count: 1 })).toBe('1 item');
        expect(utc.t('items', { count: 2 })).toBe('2 items');
        expect(utc.number(1234)).toBe('1,234');
        const stamp = Date.UTC(2026, 0, 1, 1);
        expect(utc.date(stamp)).toBe('1/1/2026');
        expect(pacific.date(stamp)).toBe('12/31/2025');
    });
});

it('applies provider overrides consistently to shared visible and accessible labels', () => {
    const html = renderToStaticMarkup(
        React.createElement(SimulatorLocaleProvider, {
            messages: {
                'screen.simulatorDetail.back': 'Return to contacts',
                'list.search': 'Find saved contacts',
            },
            children: React.createElement(
                React.Fragment,
                null,
                React.createElement(SimulatorDetailBackBar, { onBack() {} }),
                React.createElement(SimulatorSearchInput, { value: '', onChange() {} }),
            ),
        }),
    );
    expect(html).toContain('aria-label="Return to contacts"');
    expect(html).toContain('>Return to contacts</button>');
    expect(html).toContain('placeholder="Find saved contacts"');
    expect(html).toContain('aria-label="Find saved contacts"');
});

it('explains an empty dial action and preserves a host unavailability reason', () => {
    const empty = renderToStaticMarkup(React.createElement(PhoneDialView, { onDial() {} }));
    expect(empty).toContain('Enter a phone number before calling.');
    expect(empty).toMatch(/aria-describedby="[^"]+"/);
    const unavailable = renderToStaticMarkup(
        React.createElement(SimulatorCapabilitiesContext.Provider, {
            value: { call: { state: 'unavailable', reason: 'Connect the line first.' } },
            children: React.createElement(PhoneDialView, { onDial() {} }),
        }),
    );
    expect(unavailable).toContain('Connect the line first.');
    expect(unavailable).not.toContain('Enter a phone number before calling.');
});

it('uses catalog overrides for navigation and unsupported-screen defaults', async () => {
    const { default: Shell } = await import('../src/shell/PhoneSimulatorShell');
    const { default: Unsupported } = await import('../src/UnsupportedScreenFallback');
    const html = renderToStaticMarkup(React.createElement(SimulatorLocaleProvider, {
        messages: { 'nav.phone': 'Calls and contacts', 'nav.exit': 'Leave preview', 'fallback.learner_unsupported_screen_title': 'Unavailable view' },
        children: React.createElement(Shell, { activeChannel: 'contacts', onChannelChange() {}, exitTo: '/exit', children: React.createElement(Unsupported, { app: 'phone', screen: 'missing' }) }),
    }));
    expect(html).toContain('aria-label="Calls and contacts"');
    expect(html).toContain('Leave preview');
    expect(html).toContain('Unavailable view');
});
