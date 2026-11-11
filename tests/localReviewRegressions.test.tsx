// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { LockSettings } from '../src/apps/lock/LockScreen';
import { SimulatorAppsProvider } from '../src/apps/shared/SimulatorAppsHost';
import { mail, setup, openFolder } from './support/mailboxSupport';
import { StoreHarness } from './support/appHarness';
it('disables lock configuration with a clear capability explanation', () => {
    render(
        <SimulatorAppsProvider value={{ lockAvailable: () => false }}>
            <StoreHarness>
                {(store) => <LockSettings store={store} onLock={() => undefined} />}
            </StoreHarness>
        </SimulatorAppsProvider>,
    );
    expect(screen.getByRole('status').textContent).toContain('HTTPS');
    expect(
        screen.getByRole('button', { name: 'Save screen password' }).closest('fieldset')?.disabled,
    ).toBe(true);
    expect(screen.queryByText(/importKey/)).toBeNull();
});

it('keeps simulator mailbox summaries based on the body beyond the editor label cap', async () => {
    const body = 'Preview body remains independent of the short editor list label. '.repeat(3);
    setup({ mails: [mail('summary', { subject: 'Editor label', body })] });
    await openFolder(/Inbox/);
    expect(screen.getByText(body.slice(0, 100))).toBeDefined();
    expect(screen.queryByText(body.slice(0, 40))).toBeNull();
});
