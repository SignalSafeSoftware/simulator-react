import { afterEach, describe, expect, it, vi } from 'vitest';
import { diffSimulatorPayloads } from '../src/utils/payload/simulatorPayloadDiff';

const originalNodeEnv = process.env.NODE_ENV;

const originalWindow = (globalThis as { window?: unknown }).window;

const originalLocalStorage = (globalThis as { localStorage?: unknown }).localStorage;

afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalWindow === undefined) {
        delete (globalThis as { window?: unknown }).window;
    } else {
        (globalThis as { window?: unknown }).window = originalWindow;
    }
    if (originalLocalStorage === undefined) {
        delete (globalThis as { localStorage?: unknown }).localStorage;
    } else {
        (globalThis as { localStorage?: unknown }).localStorage = originalLocalStorage;
    }
    vi.restoreAllMocks();
});

describe('payload diffs', () => {
    it('covers structured payload diffs across all major sections', () => {
        const circular: Record<string, unknown> = {};
        circular.self = circular;

        const diffs = diffSimulatorPayloads(
            {
                entry_point: { app: 'email', screen: 'list' },
                device: {
                    main_menu_items: [{ id: 'email' }],
                    secondary_defaults: { phone: circular, email: true, internet: null },
                },
                contacts: [
                    { id: 'c1' },
                    { id: 'c2' },
                    { id: 'c3' },
                    { id: 'c4' },
                    { id: 'c5' },
                    { id: 'c6' },
                ],
                directory: [{ id: 'd1' }],
                phone: {
                    incoming_call: { transcript: 'Incoming' },
                    history: [{ id: 'call-1' }, { id: 'call-2' }],
                },
                email: {
                    messages: [{ id: 'm1' }],
                    detail: { subject: 'Old subject' },
                },
                messages: {
                    threads: [{ id: 't1' }],
                    thread_detail: { messages: [{ id: 'msg-1' }, { id: 'msg-2' }] },
                },
                internet: {
                    pages: [{ id: 'landing' }],
                    forms: [{ id: 'form-1' }],
                },
                home: {
                    widgets: [{ id: 'w1' }],
                    store: { featured_apps: [{ id: 'app-1' }] },
                    settings: { sections: [{ id: 's1' }] },
                },
            },
            {
                entry_point: { app: 'phone', screen: 'history' },
                device: {
                    main_menu_items: [{ id: 'email' }, { id: 'phone' }],
                    secondary_defaults: { phone: 'history', email: false, internet: 2 },
                },
                contacts: [
                    { id: 'c1' },
                    { id: 'c2' },
                    { id: 'c7' },
                    { id: 'c8' },
                    { id: 'c9' },
                    { id: 'c10' },
                    { id: 'c11' },
                ],
                directory: [{ id: 'd2' }, { id: 'd3' }],
                phone: {
                    history: [{ id: 'call-1' }],
                },
                email: {
                    messages: [{ id: 'm2' }, { id: 'm3' }],
                    detail: { subject: 'New subject' },
                },
                messages: {
                    threads: [{ id: 't1' }, { id: 't2' }],
                    thread_detail: { messages: [{ id: 'msg-1' }] },
                },
                internet: {
                    pages: [{ id: 'pricing' }, { id: 'support' }],
                    forms: [{ id: 'form-1' }, { id: 'form-2' }],
                },
                home: {
                    widgets: [],
                    store: { featured_apps: [] },
                    settings: { sections: [] },
                },
            },
        );

        expect(diffs.map((item) => item.section)).toEqual(
            expect.arrayContaining([
                'entry_point',
                'device',
                'contacts',
                'directory',
                'phone',
                'email',
                'messages',
                'internet',
                'home',
            ]),
        );
        expect(diffs).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ change: 'Entry point: email/list → phone/history' }),
                expect.objectContaining({ section: 'device', change: 'Device menu: 1 → 2 items' }),
                expect.objectContaining({
                    section: 'device',
                    detail: expect.stringContaining('(unserializable)'),
                }),
                expect.objectContaining({
                    section: 'contacts',
                    detail: expect.stringContaining('+'),
                }),
                expect.objectContaining({
                    section: 'directory',
                    change: 'Directory: 1 → 2 entries',
                }),
                expect.objectContaining({
                    section: 'phone',
                    change: 'Phone: incoming_call removed',
                }),
                expect.objectContaining({
                    section: 'phone',
                    change: 'Phone history: 2 → 1 entries',
                }),
                expect.objectContaining({
                    section: 'email',
                    change: 'Email detail (subject) changed',
                }),
                expect.objectContaining({ section: 'messages', change: 'Messages threads: 1 → 2' }),
                expect.objectContaining({
                    section: 'messages',
                    change: 'Messages thread_detail: 2 → 1 messages',
                }),
                expect.objectContaining({
                    section: 'internet',
                    change: 'Browser pages: landing → pricing, support',
                }),
                expect.objectContaining({ section: 'internet', change: 'Browser forms: 1 → 2' }),
                expect.objectContaining({
                    section: 'home',
                    change: 'Home: widgets 1→0, store apps 1→0, settings sections 1→0',
                }),
            ]),
        );
    });
});
