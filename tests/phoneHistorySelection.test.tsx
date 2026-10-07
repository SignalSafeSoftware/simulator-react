// @vitest-environment jsdom
import { createRef, useReducer } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import { SimulatorPhoneScreenId } from '@signalsafe/simulator-core/devicePayload';
import PhoneSimulatorView from '../src/views/phone/PhoneSimulatorView.js';
import PhoneHistoryHeader from '../src/views/phone/PhoneHistoryHeader.js';
import { SimulatorLocaleProvider } from '../src/i18n/SimulatorLocale.js';
import {
    phoneHistoryContact,
    relatedPhoneHistoryEntries,
} from '../src/views/phone/phoneHistorySelection.js';
import { SimulatorCapabilitiesContext } from '../src/contract/capabilities.js';
import { createSimulatorNavigationDispatch } from '../src/contract/navigation.js';
import { simulatorSessionReducer } from '../src/state/simulatorSessionReducer.js';
import { SimulatorDispatchActionType } from '../src/state/simulatorDispatchActions.js';
import type { SimulatorCallHistoryEntry, SimulatorPhonePayload } from '../src/types/session.js';
import { createState } from './support/reducerSupport.js';

const entries: SimulatorCallHistoryEntry[] = [
    {
        id: 'selected',
        number: '+12025550123',
        name: 'Taylor Example',
        kind: 'incoming',
        timestamp: 'Monday 9:15 AM',
        durationSeconds: 65,
    },
    { id: 'related', number: '(202) 555-0123', kind: 'outgoing', timestamp: 'Sunday 4:00 PM' },
    {
        id: 'unrelated',
        number: '+442025550123',
        name: 'Taylor Example',
        kind: 'missed',
        timestamp: 'Saturday',
    },
    { id: 'blank', number: '', kind: 'unknown' },
    { id: 'unknown', number: 'Anonymous', kind: 'unknown' },
];
const payload: SimulatorPhonePayload = {
    content: {
        caller_name: 'Incoming scenario caller',
        phone_number: '+12025550999',
        transcript: 'Scenario call',
        choices: [],
    },
    chosenIndex: null,
    callHistory: entries,
    voicemailTranscript: 'Scenario voicemail',
};
const contacts = [
    {
        id: 'taylor',
        displayName: 'Taylor Contact',
        phoneNumbers: [{ label: 'Mobile', value: '(202) 555-0123', number: '+12025550123' }],
    },
];
const props = {
    payload,
    contacts,
    phoneCapabilities: { dial: true, voicemail: true, directory: false },
    screen: SimulatorPhoneScreenId.History,
    onNavigate: vi.fn(),
    onAction: vi.fn(),
    onBack: vi.fn(),
};

function row(container: HTMLElement, id: string) {
    const found = Array.from(
        container.querySelectorAll<HTMLButtonElement>('[data-simulator-history-id]'),
    ).find((element) => element.dataset.simulatorHistoryId === id);
    if (!found) throw new Error(`Missing history row ${id}`);
    return found;
}

function selectedState() {
    const state = createState({
        payload: { phone: payload },
        view: { activeApp: SimulatorApp.Phone, showPrimaryMenu: false },
    });
    return simulatorSessionReducer(state, {
        type: SimulatorDispatchActionType.SelectCallHistory,
        entryId: 'selected',
    });
}

describe('shared call history selection', () => {
    it('shares translated headings and forwards the focus target without making list headings tabbable', () => {
        const heading = createRef<HTMLHeadingElement>();
        const messages = {
            'calls.history': 'Historique des appels',
            'calls.details': 'Détails de l’appel',
        };
        const view = render(
            <SimulatorLocaleProvider messages={messages}>
                <PhoneHistoryHeader ref={heading} />
            </SimulatorLocaleProvider>,
        );
        expect(heading.current).toBe(
            screen.getByRole('heading', { name: messages['calls.history'], level: 2 }),
        );
        expect(heading.current?.hasAttribute('tabindex')).toBe(false);
        view.rerender(
            <SimulatorLocaleProvider messages={messages}>
                <PhoneHistoryHeader ref={heading} detail />
            </SimulatorLocaleProvider>,
        );
        expect(heading.current).toBe(
            screen.getByRole('heading', { name: messages['calls.details'], level: 2 }),
        );
        expect(heading.current?.tabIndex).toBe(-1);
        heading.current?.focus();
        expect(document.activeElement).toBe(heading.current);
    });

    it('opens a call detail from a standalone list, retains its search, and restores row focus on Back', () => {
        const onBack = vi.fn();
        const onAction = vi.fn();
        const { container } = render(
            <PhoneSimulatorView {...props} onBack={onBack} onAction={onAction} />,
        );
        fireEvent.change(screen.getByRole('searchbox', { name: 'Search calls' }), {
            target: { value: 'Monday' },
        });
        fireEvent.click(row(container, 'selected'));
        expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Call Details' }));
        const detail = container.querySelector('.simulator-history-detail');
        expect(detail).toBeTruthy();
        expect(
            within(detail as HTMLElement).getByRole('heading', { name: 'Taylor Contact' }),
        ).toBeTruthy();
        expect(screen.getByRole('heading', { name: 'Calls with Taylor Contact' })).toBeTruthy();
        expect(within(detail as HTMLElement).getByText('Monday 9:15 AM')).toBeTruthy();
        expect(screen.getByText('Mobile ·')).toBeTruthy();
        expect(screen.getByText('Sunday 4:00 PM')).toBeTruthy();
        expect(screen.queryByText('Saturday')).toBeNull();
        const relatedRows = Array.from(container.querySelectorAll('.simulator-phone-history-row'));
        expect(relatedRows).toHaveLength(2);
        for (const element of relatedRows) {
            expect(element.tagName).toBe('DIV');
            expect(element.hasAttribute('tabindex')).toBe(false);
            expect(element.hasAttribute('aria-current')).toBe(false);
        }
        fireEvent.click(screen.getByRole('button', { name: 'Call' }));
        expect(onAction).toHaveBeenCalledWith({ type: 'dial_phone', dialedNumber: '+12025550123' });
        expect(screen.getAllByRole('tab', { name: 'Back' })).toHaveLength(1);
        fireEvent.click(screen.getByRole('tab', { name: 'Back' }));
        expect(screen.queryByRole('heading', { name: 'Call Details' })).toBeNull();
        expect(
            (screen.getByRole('searchbox', { name: 'Search calls' }) as HTMLInputElement).value,
        ).toBe('Monday');
        expect(document.activeElement).toBe(row(container, 'selected'));
        expect(onBack).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('tab', { name: 'Back' }));
        expect(onBack).toHaveBeenCalledOnce();
    });

    it('uses session selection with the same Back behavior and clears a removed selected record', () => {
        function Session({ phone = payload }: { phone?: SimulatorPhonePayload }) {
            const [state, dispatch] = useReducer(
                simulatorSessionReducer,
                createState({ view: { activeApp: SimulatorApp.Phone, showPrimaryMenu: false } }),
            );
            return (
                <>
                    <output data-testid='selection'>
                        {state.view.phone.selectedHistoryEntryId ?? 'none'}
                    </output>
                    <PhoneSimulatorView
                        {...props}
                        payload={phone}
                        sessionState={state}
                        sessionDispatch={dispatch}
                    />
                </>
            );
        }
        const view = render(<Session />);
        fireEvent.click(row(view.container, 'selected'));
        expect(screen.getByTestId('selection').textContent).toBe('selected');
        fireEvent.click(screen.getByRole('tab', { name: 'Back' }));
        expect(screen.getByTestId('selection').textContent).toBe('none');
        expect(document.activeElement).toBe(row(view.container, 'selected'));
        fireEvent.click(row(view.container, 'selected'));
        view.rerender(
            <Session
                phone={{
                    ...payload,
                    callHistory: entries.filter((entry) => entry.id !== 'selected'),
                }}
            />,
        );
        expect(screen.queryByRole('heading', { name: 'Call Details' })).toBeNull();
        expect(screen.getByTestId('selection').textContent).toBe('none');
        expect(document.activeElement).toBe(
            screen.getByRole('searchbox', { name: 'Search calls' }),
        );
    });

    it('falls back to local selection when only one session prop is supplied and clears it when changing screens', () => {
        const dispatch = vi.fn();
        const view = render(<PhoneSimulatorView {...props} sessionDispatch={dispatch} />);
        fireEvent.click(row(view.container, 'selected'));
        expect(screen.getByRole('heading', { name: 'Call Details' })).toBeTruthy();
        expect(dispatch).not.toHaveBeenCalled();
        view.rerender(
            <PhoneSimulatorView
                {...props}
                sessionDispatch={dispatch}
                screen={SimulatorPhoneScreenId.Dial}
            />,
        );
        view.rerender(<PhoneSimulatorView {...props} sessionState={selectedState()} />);
        expect(screen.queryByRole('heading', { name: 'Call Details' })).toBeNull();
    });

    it('preserves scenario incoming and voicemail routing and honors a disabled calling capability', () => {
        const onNavigate = vi.fn();
        const onAction = vi.fn();
        const view = render(
            <SimulatorCapabilitiesContext.Provider
                value={{ call: { state: 'unsupported', reason: 'Calls are disabled here.' } }}
            >
                <PhoneSimulatorView {...props} onNavigate={onNavigate} onAction={onAction} />
            </SimulatorCapabilitiesContext.Provider>,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Incoming call' }));
        expect(onNavigate).toHaveBeenLastCalledWith(SimulatorPhoneScreenId.IncomingCall);
        fireEvent.click(screen.getByRole('button', { name: 'Voicemail' }));
        expect(onNavigate).toHaveBeenLastCalledWith(SimulatorPhoneScreenId.Voicemail);
        expect(onAction).toHaveBeenLastCalledWith({ type: 'open_voicemail' });
        fireEvent.click(row(view.container, 'selected'));
        const call = screen.getByRole('button', { name: 'Call' }) as HTMLButtonElement;
        expect(call.disabled).toBe(true);
        expect(screen.getByText('Calls are disabled here.').id).toBe(
            call.getAttribute('aria-describedby'),
        );
        fireEvent.click(call);
        expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('clears a local selection whose record is removed from the history', () => {
        const view = render(<PhoneSimulatorView {...props} />);
        fireEvent.click(row(view.container, 'selected'));
        expect(screen.getByRole('heading', { name: 'Call Details' })).toBeTruthy();
        view.rerender(
            <PhoneSimulatorView
                {...props}
                payload={{
                    ...payload,
                    callHistory: entries.filter((entry) => entry.id !== 'selected'),
                }}
            />,
        );
        expect(screen.queryByRole('heading', { name: 'Call Details' })).toBeNull();
    });

    it('leaves a session-owned selection alone off the history screen and while navigating', () => {
        const dispatch = vi.fn();
        const onNavigate = vi.fn();
        const state = selectedState();
        const view = render(
            <PhoneSimulatorView
                {...props}
                onNavigate={onNavigate}
                screen={SimulatorPhoneScreenId.Dial}
                sessionState={state}
                sessionDispatch={dispatch}
            />,
        );
        expect(dispatch).not.toHaveBeenCalled();
        view.rerender(
            <PhoneSimulatorView
                {...props}
                onNavigate={onNavigate}
                sessionState={state}
                sessionDispatch={dispatch}
            />,
        );
        fireEvent.click(screen.getByRole('tab', { name: 'Dial' }));
        expect(onNavigate).toHaveBeenCalledWith(SimulatorPhoneScreenId.Dial);
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('omits the call action when dialing is unavailable', () => {
        const view = render(
            <PhoneSimulatorView
                {...props}
                phoneCapabilities={{ dial: false, voicemail: true, directory: false }}
            />,
        );
        fireEvent.click(row(view.container, 'selected'));
        expect(screen.getByRole('heading', { name: 'Call Details' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Call' })).toBeNull();
    });

    it('shows the empty history when a configured phone has no calls, and preserves the absent-phone message', () => {
        const view = render(
            <PhoneSimulatorView
                {...props}
                payload={{ content: null, chosenIndex: null }}
                phoneCapabilities={{ dial: true, voicemail: false, directory: false }}
            />,
        );
        expect(screen.getByRole('heading', { name: 'Call History' })).toBeTruthy();
        expect(screen.getByText('No recent calls.')).toBeTruthy();
        view.rerender(<PhoneSimulatorView {...props} payload={null} />);
        expect(screen.getByText('No phone for this scenario.')).toBeTruthy();
    });

    it('groups full normalized numbers without matching display names, suffixes or blank numbers', () => {
        expect(relatedPhoneHistoryEntries(entries, entries[0]!).map((entry) => entry.id)).toEqual([
            'selected',
            'related',
        ]);
        expect(relatedPhoneHistoryEntries(entries, entries[3]!).map((entry) => entry.id)).toEqual([
            'blank',
        ]);
        expect(relatedPhoneHistoryEntries(entries, entries[4]!).map((entry) => entry.id)).toEqual([
            'unknown',
        ]);
        expect(phoneHistoryContact(entries[0]!, contacts)).toEqual({
            name: 'Taylor Contact',
            numberLabel: 'Mobile',
        });
        expect(
            phoneHistoryContact(entries[0]!, [
                ...contacts,
                { id: 'other', displayName: 'Other', number: '+12025550123' },
            ]),
        ).toEqual({});
        expect(phoneHistoryContact(entries[4]!, contacts)).toEqual({});
        expect(
            phoneHistoryContact(entries[0]!, [
                {
                    ...contacts[0]!,
                    phoneNumbers: [
                        ...contacts[0]!.phoneNumbers,
                        { label: 'Work', value: '+12025550123' },
                    ],
                },
            ]),
        ).toEqual({ name: 'Taylor Contact', numberLabel: undefined });
    });

    it('uses a number-only contact without labels or a display name', () => {
        expect(
            phoneHistoryContact(entries[0]!, [
                { id: 'bare', displayName: '', number: '+12025550123' },
            ]),
        ).toEqual({ name: undefined, numberLabel: undefined });
    });

    it('closes nested history with Back and clears it on explicit navigation, while Primary goes Home', () => {
        const state = selectedState();
        expect(state.view.phone.selectedHistoryEntryId).toBe('selected');
        const back = simulatorSessionReducer(state, { type: SimulatorDispatchActionType.Back });
        expect(back.view.phone.selectedHistoryEntryId).toBeNull();
        expect(back.view.activeApp).toBe(SimulatorApp.Phone);
        expect(back.view.showPrimaryMenu).toBe(false);
        expect(
            simulatorSessionReducer(back, { type: SimulatorDispatchActionType.Back }).view
                .activeApp,
        ).toBe(SimulatorApp.Home);
        for (const action of [
            {
                type: SimulatorDispatchActionType.NavLocal,
                app: SimulatorApp.Phone,
                screen: SimulatorPhoneScreenId.History,
            },
            {
                type: SimulatorDispatchActionType.NavLocal,
                app: SimulatorApp.Phone,
                screen: SimulatorPhoneScreenId.Contacts,
            },
            { type: SimulatorDispatchActionType.Cancel },
            { type: SimulatorDispatchActionType.SwitchApp, app: SimulatorApp.Phone },
        ])
            expect(
                simulatorSessionReducer(state, action).view.phone.selectedHistoryEntryId,
            ).toBeNull();
        const primary = simulatorSessionReducer(state, {
            type: SimulatorDispatchActionType.BackToPrimary,
        });
        expect(primary.view.phone.selectedHistoryEntryId).toBeNull();
        expect(primary.view.activeApp).toBe(SimulatorApp.Home);
        expect(primary.view.showPrimaryMenu).toBe(true);
    });

    it('preserves host navigation interception for nested Back and reports History as its destination', () => {
        let state = selectedState();
        const onNavigationEvent = vi.fn();
        const dispatch = vi.fn((action) => {
            state = simulatorSessionReducer(state, action);
        });
        const send = createSimulatorNavigationDispatch({
            getState: () => state,
            dispatch,
            onNavigationEvent,
            onNavigation: () => 'handled',
        });
        send({ type: SimulatorDispatchActionType.Back });
        expect(dispatch).not.toHaveBeenCalled();
        expect(state.view.phone.selectedHistoryEntryId).toBe('selected');
        expect(onNavigationEvent).toHaveBeenCalledWith({
            kind: 'back',
            disposition: 'handled',
            from: {
                app: SimulatorApp.Phone,
                screen: SimulatorPhoneScreenId.History,
                primaryMenu: false,
            },
            to: {
                app: SimulatorApp.Phone,
                screen: SimulatorPhoneScreenId.History,
                primaryMenu: false,
            },
        });
    });
});
