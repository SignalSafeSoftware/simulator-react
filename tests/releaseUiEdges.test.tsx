// @vitest-environment jsdom
import { fireEvent, render, screen, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import PhoneSimulatorView from '../src/views/phone/PhoneSimulatorView';
import PhoneHistoryScreen from '../src/views/phone/PhoneHistoryScreen';
import { AuthoredPhoneVoicemail } from '../src/views/phone/authoredPhoneCall';
import { SimulatorDetailBlock } from '../src/ui/layout/SimulatorDetail';
import Mailbox from '../src/apps/mail/Mailbox';
import { StoreHarness } from './support/appHarness';
import { setup, mail, openFolder } from './support/mailboxSupport';
import { createState } from './support/reducerSupport';
import { useBrowserHistory } from '../src/apps/browser/useBrowserHistory';
import { mapPhone } from '../src/adapters/device/phoneMapper';
afterEach(cleanup);
const phoneCapabilities = { dial: true, voicemail: true, directory: false };
it('shows a useful empty state when there is no phone content', () => {
    render(
        <PhoneSimulatorView
            payload={null}
            screen='history'
            phoneCapabilities={phoneCapabilities}
            onNavigate={() => {}}
            onAction={() => {}}
        />,
    );
    expect(screen.getByText(/No phone/)).toBeTruthy();
});
it('returns from selected authored voicemail details through the session reducer', () => {
    const payload = {
        content: null,
        chosenIndex: null,
        callHistory: [
            { id: 'voice', callType: 'voicemail' as const, number: '', kind: 'voicemail' as const },
        ],
    };
    const state = createState({
        payload: { phone: payload },
        view: {
            activeApp: 'phone',
            phone: {
                screen: 'history',
                chosenIndex: null,
                stack: [],
                selectedHistoryEntryId: 'voice',
            },
        },
    });
    const dispatch = vi.fn();
    render(
        <PhoneSimulatorView
            payload={payload}
            screen='history'
            phoneCapabilities={phoneCapabilities}
            sessionState={state}
            sessionDispatch={dispatch}
            onNavigate={() => {}}
            onAction={() => {}}
        />,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Back' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'BACK' });
});
it('can delete a legacy voicemail independently of authored call identities', () => {
    const dispatch = vi.fn();
    render(
        <PhoneSimulatorView
            payload={{ content: null, chosenIndex: null, voicemailTranscript: 'Example' }}
            screen='voicemail'
            phoneCapabilities={phoneCapabilities}
            sessionDispatch={dispatch}
            onNavigate={() => {}}
            onAction={() => {}}
        />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete voicemail' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'DELETE_VOICEMAIL', entryId: null });
});
it('renders unknown numbers and missing voicemail transcripts without inventing content', () => {
    const view = render(
        <PhoneHistoryScreen
            payload={{
                content: null,
                chosenIndex: null,
                callHistory: [
                    {
                        id: 'unknown',
                        number: '',
                        numberLabel: 'Mobile',
                        callType: 'missed',
                        kind: 'missed',
                    },
                ],
            }}
            contacts={[]}
            selectedEntryId='unknown'
            hasVoicemail={false}
            onSelectEntry={() => {}}
            onSelectIncoming={() => {}}
            onSelectVoicemail={() => {}}
        />,
    );
    expect(screen.getByRole('heading', { name: 'Unknown' })).toBeTruthy();
    view.rerender(
        <AuthoredPhoneVoicemail
            entry={{ id: 'unknown', number: '', kind: 'voicemail' }}
            navigation={null}
            onBack={() => {}}
        />,
    );
    expect(screen.getByText(/Voicemail/)).toBeTruthy();
    view.rerender(<SimulatorDetailBlock>Example block</SimulatorDetailBlock>);
    expect(screen.getByText('Example block')).toBeTruthy();
});
it('starts a composed mail with the current identity and exposes unknown sent dates in details and lists', async () => {
    render(
        <StoreHarness>
            {(store) => <Mailbox store={store} initialCompose onBack={() => {}} />}
        </StoreHarness>,
    );
    expect(screen.getByRole('heading', { name: 'New email' })).toBeTruthy();
    cleanup();
    setup({ mails: [mail('unknown', { sentAt: null, subject: '' })] });
    await openFolder(/Inbox/);
    fireEvent.click(screen.getByRole('button', { name: /No subject/ }));
    expect(screen.getByText(/Date not set/)).toBeTruthy();
});
it('keeps a custom folder name as the heading instead of inheriting Object prototype members', async () => {
    setup({ mails: [mail('custom', { folder: 'constructor' })] });
    await openFolder(/constructor/);
    expect(screen.getByRole('heading', { name: 'constructor' })).toBeTruthy();
});
it('does not convert an empty legacy voicemail transcript into authored speech', () => {
    expect(
        mapPhone({ incoming_call: { transcript: 'Example' }, voicemail: { transcript: '' } })
            ?.voicemailTranscript,
    ).toBeUndefined();
});

it('falls back to a safe built-in page when an authored selection disappears entirely', () => {
    const first = { id: 'one', title: 'First', url: 'https://example.test', html: 'Example' };
    const hook = renderHook(({ pages, selected }) => useBrowserHistory(pages, selected), {
        initialProps: { pages: [first], selected: 'one' },
    });
    hook.rerender({ pages: [], selected: 'missing' });
    expect(hook.result.current.nav.page.id).not.toBe('one');
});
