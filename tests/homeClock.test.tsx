// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HomeClock from '../src/apps/home/HomeClock';
import DeviceHome from '../src/apps/home/DeviceHome';
import { SimulatorLocaleProvider } from '../src/i18n/SimulatorLocale';

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

describe('shared Home clock', () => {
    it('uses the locale provider, rolls the date at midnight, and cleans up its timer', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-10-06T05:59:59Z'));
        const { container, unmount } = render(
            <SimulatorLocaleProvider locale='en-US' timeZone='America/Denver'>
                <DeviceHome />
            </SimulatorLocaleProvider>,
        );
        expect(screen.getByText('Monday, October 5, 2026')).toBeDefined();
        expect(screen.getByText('11:59:59 PM')).toBeDefined();
        expect(container.querySelector('time')?.dateTime).toBe('2026-10-06T05:59:59.000Z');
        expect(container.querySelectorAll('[aria-live]')).toHaveLength(0);
        act(() => vi.advanceTimersByTime(1000));
        expect(screen.getByText('Tuesday, October 6, 2026')).toBeDefined();
        expect(screen.getByText('12:00:00 AM')).toBeDefined();
        expect(vi.getTimerCount()).toBe(1);
        unmount();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('updates regional preferences without duplicating clocks or timers', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-10-06T05:09:57Z'));
        const { container, rerender } = render(
            <HomeClock locale='en-US' timeZone='America/Denver' hour12 />,
        );
        expect(screen.getByText('11:09:57 PM')).toBeDefined();
        rerender(<HomeClock locale='en-GB' timeZone='UTC' hour12={false} />);
        expect(screen.getByText('Tuesday, 6 October 2026')).toBeDefined();
        expect(screen.getByText('5:09:57')).toBeDefined();
        expect(container.querySelectorAll('time')).toHaveLength(1);
        expect(vi.getTimerCount()).toBe(1);
    });

    it('retains explicit header overrides and disables apps without a host capability', () => {
        const { container } = render(<DeviceHome homeHeader={<p>Host header</p>} />);
        expect(container.querySelector('time')).toBeNull();
        for (const name of ['Settings', 'Vault', 'Photos']) {
            const tile = screen.getByRole('button', { name });
            expect(tile.hasAttribute('disabled')).toBe(true);
            expect(tile.getAttribute('title')).toBe('Unavailable in this scenario.');
        }
    });
});
