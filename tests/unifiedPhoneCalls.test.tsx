import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SimulatorCallType } from '@signalsafe/simulator-core/phoneCalls';
import { mapPhone } from '../src/adapters/device/phoneMapper.js';
import { authoredPhoneCall } from '../src/views/phone/authoredPhoneCall.js';
import { PhoneHistoryEntryRow } from '../src/views/phone/PhoneHistoryEntryRow.js';

describe('unified call presentation', () => {
    it('keeps distinct compact labels for every authored type', () => {
        for (const type of Object.values(SimulatorCallType)) {
            const payload = mapPhone({
                calls: [{ id: 'call', type, name: 'Bank', number: '123' }],
            });
            const entry = payload?.callHistory?.[0];
            if (!entry) throw new Error('Call record missing');
            const html = renderToStaticMarkup(
                createElement(PhoneHistoryEntryRow, {
                    entry,
                    entriesSelectable: true,
                    onSelectVoicemail: () => {},
                }),
            );
            expect(html).toContain(type.charAt(0).toUpperCase() + type.slice(1));
            expect(entry.callType).toBe(type);
        }
    });
    it('opens the selected voicemail instead of the first voicemail', () => {
        const payload = mapPhone({
            calls: [
                { id: 'a', type: 'voicemail', transcript: 'First message' },
                { id: 'b', type: 'voicemail', transcript: 'Second message', number: '123' },
            ],
        });
        const selected = authoredPhoneCall(payload, 'b', () => {}, null);
        expect(selected.active).toBeUndefined();
        const html = renderToStaticMarkup(selected.voicemail);
        expect(html).toContain('Second message');
        expect(html).not.toContain('First message');
    });
    it('distinguishes ringing direction without changing the legacy history-kind contract', () => {
        const payload = mapPhone({
            calls: [
                { id: 'a', type: 'incoming', name: 'First' },
                { id: 'b', type: 'calling', name: 'Second' },
            ],
        });
        expect(authoredPhoneCall(payload, 'a', () => {}, null).content?.outgoing).toBe(false);
        expect(authoredPhoneCall(payload, 'b', () => {}, null).content?.outgoing).toBe(true);
        expect(payload?.callHistory?.map((call) => call.kind)).toEqual(['incoming', 'outgoing']);
    });
});

it.each([SimulatorCallType.Incoming, SimulatorCallType.Calling])(
    'preserves the authored caller title for an active %s call',
    (type) => {
        const payload = mapPhone({
            calls: [
                {
                    id: 'active',
                    type,
                    name: 'Grandma',
                    number: '+639175550123',
                    caller_title: 'Grandma calling (URGENT)',
                },
            ],
        });
        expect(payload?.content?.caller_title).toBe('Grandma calling (URGENT)');
        expect(payload?.callHistory?.[0]?.callerTitle).toBe('Grandma calling (URGENT)');
        expect(authoredPhoneCall(payload, 'active', () => {}, null).content?.caller_title).toBe(
            'Grandma calling (URGENT)',
        );
    },
);
