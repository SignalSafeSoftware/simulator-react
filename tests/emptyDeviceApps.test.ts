import { describe, expect, it } from 'vitest';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import {
    emptySimulatorStore,
    simulatorStoreSchema,
} from '@signalsafe/simulator-core/apps/contracts';
import { fullDeviceToPayload } from '../src/adapters/deviceToSession.js';
import { mapPhone } from '../src/adapters/device/phoneMapper.js';
import { mapEmail } from '../src/adapters/device/emailMapper.js';
import { mapMessages } from '../src/adapters/device/messagesMapper.js';
import { createSimulatorDatasource } from '../src/datasource/datasource.js';

const entry = { entry_point: { app: SimulatorApp.Home, screen: 'home' } };
describe('available full-device apps without authored records', () => {
    it.each([entry, { ...entry, contacts: [], phone: {}, messages: {}, email: {} }])(
        'normalizes omitted and explicitly empty app collections',
        (input) => {
            const before = JSON.stringify(input);
            const payload = fullDeviceToPayload(input);
            expect(payload.phone).toMatchObject({ content: null, callHistory: [] });
            expect(payload.contacts).toEqual([]);
            expect(payload.sms).toMatchObject({
                threads: [],
                thread: { messages: [] },
            });
            expect(payload.email).toMatchObject({
                inbox: [],
                selectedMessage: null,
                selectedMessageId: null,
            });
            expect(JSON.stringify(input)).toBe(before);
        },
    );
    it('applies defaults through validated datasource construction', () => {
        const source = createSimulatorDatasource(entry);
        expect(source.calls?.callHistory).toEqual([]);
        expect(source.contacts).toEqual([]);
        expect(source.sms?.threads).toEqual([]);
        expect(source.email?.inbox).toEqual([]);
    });
    it('creates independent collections for separate devices', () => {
        const first = fullDeviceToPayload(entry);
        const second = fullDeviceToPayload(entry);
        first.contacts?.push({ id: 'contact', displayName: 'Changed' });
        expect(second.contacts).toEqual([]);
        expect(first.phone?.callHistory).not.toBe(second.phone?.callHistory);
        expect(first.sms?.threads).not.toBe(second.sms?.threads);
        expect(first.email?.inbox).not.toBe(second.email?.inbox);
    });
    it('keeps explicitly absent scenario payloads distinct at mapper boundaries', () => {
        expect(mapPhone(undefined)).toBeNull();
        expect(mapEmail(undefined)).toBeNull();
        expect(mapMessages(undefined)).toBeNull();
    });
    it('retains the detail-only SMS fallback instead of fabricating list records', () => {
        expect(
            mapMessages({ thread_detail: { id: 'thread', messages: [] } })?.threads,
        ).toBeUndefined();
    });
    it('uses valid independent empty stores for photos, vault and mailbox', () => {
        const first = emptySimulatorStore();
        const second = emptySimulatorStore();
        expect(simulatorStoreSchema.safeParse(first).success).toBe(true);
        expect(first.photos).toEqual([]);
        expect(first.secrets).toEqual([]);
        expect(first.mail).toEqual([]);
        expect(first.vaultFolders).toEqual(['Unfiled']);
        expect(first.photos).not.toBe(second.photos);
        expect(first.secrets).not.toBe(second.secrets);
    });
    it('continues rejecting invalid supplied data', () => {
        expect(() =>
            createSimulatorDatasource({ ...entry, phone: { calls: 'invalid' } }),
        ).toThrow();
        expect(() => createSimulatorDatasource({ ...entry, contacts: 'invalid' })).toThrow();
    });
});
