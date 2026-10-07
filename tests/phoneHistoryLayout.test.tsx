// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PhoneHistoryCallButton from '../src/views/phone/PhoneHistoryCallButton';
import PhoneHistoryLayout from '../src/views/phone/PhoneHistoryLayout';
import PhoneHistoryScreen from '../src/views/phone/PhoneHistoryScreen';
import PhoneHistorySummaryTitle from '../src/views/phone/PhoneHistorySummaryTitle';
import { SimulatorCapabilitiesContext } from '../src/contract/capabilities';

afterEach(cleanup);

const entry = {
    id: 'one',
    name: 'Sample Caller',
    number: '+12025550100',
    kind: 'incoming' as const,
    timestamp: 'Today 9:15 AM',
};
const list = {
    entries: [entry],
    onSelectIncoming: () => {},
    onSelectVoicemail: () => {},
};

describe('PhoneHistoryLayout', () => {
    it('shows the list under the history banner and the details when a call is open', () => {
        const { rerender } = render(<PhoneHistoryLayout list={list} />);
        expect(screen.getByRole('heading', { name: 'Call History' })).toBeInstanceOf(HTMLElement);
        expect(screen.getByRole('searchbox', { name: 'Search calls' })).toBeInstanceOf(HTMLElement);
        rerender(
            <PhoneHistoryLayout
                list={{ ...list, selectedEntryId: 'one' }}
                detail={{ caller: 'Sample Caller', timestamp: 'Today 9:15 AM' }}
            >
                <p>Host footer</p>
            </PhoneHistoryLayout>,
        );
        expect(screen.getByRole('heading', { name: 'Call Details' })).toBeInstanceOf(HTMLElement);
        expect(screen.getByRole('heading', { name: 'Sample Caller' })).toBeInstanceOf(HTMLElement);
        expect(screen.getByText('Host footer')).toBeInstanceOf(HTMLElement);
    });
});

describe('PhoneHistoryCallButton', () => {
    it('calls out, and honors disabled and the host call capability', () => {
        const onCall = vi.fn();
        const { rerender } = render(<PhoneHistoryCallButton onCall={onCall} />);
        fireEvent.click(screen.getByRole('button', { name: 'Call' }));
        expect(onCall).toHaveBeenCalledOnce();
        rerender(<PhoneHistoryCallButton onCall={onCall} disabled />);
        expect(screen.getByRole('button', { name: 'Call' }).hasAttribute('disabled')).toBe(true);
        rerender(
            <SimulatorCapabilitiesContext.Provider
                value={{ call: { state: 'unavailable', reason: 'No line.' } }}
            >
                <PhoneHistoryCallButton onCall={onCall} />
            </SimulatorCapabilitiesContext.Provider>,
        );
        expect(screen.getByRole('button', { name: 'Call' }).hasAttribute('disabled')).toBe(true);
        expect(screen.getByText('No line.')).toBeInstanceOf(HTMLElement);
    });
});

describe('PhoneHistorySummaryTitle', () => {
    it('names the caller or counts the calls from a number', () => {
        const { rerender } = render(<PhoneHistorySummaryTitle caller='Sample Caller' />);
        expect(screen.getByRole('heading', { name: 'Calls with Sample Caller' })).toBeInstanceOf(
            HTMLElement,
        );
        rerender(<PhoneHistorySummaryTitle count={1} />);
        expect(screen.getByText('1 call from this number')).toBeInstanceOf(HTMLElement);
        rerender(<PhoneHistorySummaryTitle count={45} />);
        expect(screen.getByText('45 calls from this number')).toBeInstanceOf(HTMLElement);
    });
});

describe('PhoneHistoryScreen caller names', () => {
    const open = (
        id: string,
        calls: Parameters<typeof PhoneHistoryScreen>[0]['payload']['callHistory'],
    ) =>
        render(
            <PhoneHistoryScreen
                payload={{ content: null, chosenIndex: null, callHistory: calls }}
                contacts={[]}
                selectedEntryId={id}
                hasVoicemail={false}
                onSelectEntry={() => {}}
                onSelectIncoming={() => {}}
                onSelectVoicemail={() => {}}
            />,
        );

    it('falls back to the formatted number, the raw number, or Unknown', () => {
        const shown = open('shown', [
            {
                id: 'shown',
                number: '+12025550999',
                displayNumber: '(202) 555-0999',
                kind: 'incoming',
            },
        ]);
        expect(screen.getAllByText(/\(202\) 555-0999/).length).toBeGreaterThan(0);
        shown.unmount();

        const raw = open('raw', [{ id: 'raw', number: '+12025550998', kind: 'incoming' }]);
        expect(screen.getAllByText(/555-0998|5550998/).length).toBeGreaterThan(0);
        raw.unmount();

        open('none', [{ id: 'none', number: '', kind: 'incoming' }]);
        expect(screen.getAllByText(/Unknown/).length).toBeGreaterThan(0);
    });
});
