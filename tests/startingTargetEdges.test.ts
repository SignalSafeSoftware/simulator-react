import { expect, it } from 'vitest';
import { getInitialSessionState } from '../src/state/simulatorSessionInitialState';
import { fullDeviceToPayload } from '../src/adapters/deviceToSession';
it('only selects call and mail starting targets that actually exist', () => {
    for (const targetId of ['present', 'missing']) {
        const call = getInitialSessionState(
            fullDeviceToPayload({
                entry_point: {
                    app: 'phone',
                    screen: 'history',
                    target: { kind: 'call', id: targetId },
                },
                phone: { calls: [{ id: 'present', type: 'missed' }] },
            }),
        );
        expect(call.view.phone.selectedHistoryEntryId).toBe(
            targetId === 'present' ? 'present' : null,
        );
        const mail = getInitialSessionState(
            fullDeviceToPayload({
                entry_point: {
                    app: 'email',
                    screen: 'detail',
                    target: { kind: 'email', id: targetId },
                },
                email: {
                    messages: [
                        {
                            id: 'present',
                            subject: 'Example',
                            from: 'a@example.test',
                            folder_id: 'inbox',
                        },
                    ],
                },
            }),
        );
        expect(mail.view.email.selectedMessageId).toBe(targetId === 'present' ? 'present' : null);
    }
    expect(
        getInitialSessionState(
            fullDeviceToPayload({
                entry_point: {
                    app: 'phone',
                    screen: 'history',
                    target: { kind: 'call', id: 'missing' },
                },
            }),
        ).view.phone.selectedHistoryEntryId,
    ).toBeNull();
    expect(
        getInitialSessionState(
            fullDeviceToPayload({
                entry_point: {
                    app: 'email',
                    screen: 'detail',
                    target: { kind: 'email', id: 'missing' },
                },
            }),
        ).view.email.selectedMessageId,
    ).toBeNull();
    expect(
        Reflect.apply(fullDeviceToPayload, null, [{ entry_point: { app: 'home', screen: null } }]),
    ).toHaveProperty('entryPoint.screen', '');
});
