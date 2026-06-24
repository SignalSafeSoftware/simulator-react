import { describe, expect, it } from 'vitest';
import { diffSimulatorPayloads } from '../src/utils/simulatorPayloadDiff';

function payloadWithDeviceMenu(ids: string[]): Record<string, unknown> {
    return {
        entry_point: { app: 'email', screen: 'list' },
        device: {
            main_menu_items: ids.map((id) => ({ id })),
        },
    };
}

describe('diffSimulatorPayloads', () => {
    it('does not report a device menu diff when the same ids are reordered', () => {
        const left = payloadWithDeviceMenu(['browser', 'email', 'messages']);
        const right = payloadWithDeviceMenu(['messages', 'browser', 'email']);

        const diffs = diffSimulatorPayloads(left, right);

        expect(diffs.find((item) => item.section === 'device')).toBeUndefined();
    });

    it('reports order-only device menu changes when ids remain the same length but change', () => {
        const left = payloadWithDeviceMenu(['browser', 'email', 'messages']);
        const right = payloadWithDeviceMenu(['browser', 'email', 'contacts']);

        const diffs = diffSimulatorPayloads(left, right);

        expect(diffs).toContainEqual({
            section: 'device',
            change: 'Device menu: 3 → 3 items',
            detail: 'Order or ids changed',
        });
    });

    it('rewrites browser page diffs to include page ids', () => {
        const diffs = diffSimulatorPayloads(
            {
                internet: {
                    pages: [{ id: 'landing' }],
                },
            },
            {
                internet: {
                    pages: [{ id: 'pricing' }, { id: 'support' }],
                },
            }
        );

        expect(diffs).toContainEqual({
            section: 'internet',
            change: 'Browser pages: landing → pricing, support',
            detail: '+pricing, +support, -landing',
        });
    });

    it('renames directory count changes to include entries wording', () => {
        const diffs = diffSimulatorPayloads(
            {
                directory: [{ id: 'alice' }],
            },
            {
                directory: [{ id: 'alice' }, { id: 'bob' }],
            }
        );

        expect(diffs).toContainEqual({
            section: 'directory',
            change: 'Directory: 1 → 2 entries',
            detail: '+bob',
        });
    });

    it('formats non-string secondary defaults without object default stringification', () => {
        const diffs = diffSimulatorPayloads(
            {
                device: {
                    secondary_defaults: {
                        internet: { screen: 'landing' },
                    },
                },
            },
            {
                device: {
                    secondary_defaults: {
                        internet: { screen: 'pricing' },
                    },
                },
            }
        );

        expect(diffs).toContainEqual({
            section: 'device',
            change: 'Device secondary_defaults changed',
            detail: 'internet: {"screen":"landing"} → {"screen":"pricing"}',
        });
    });

    it('covers fallback formatting, added incoming calls, long diff truncation, and forms-only browser changes', () => {
        const circular: Record<string, unknown> = {};
        circular.self = circular;

        const diffs = diffSimulatorPayloads(
            {
                entry_point: { app: '', screen: 7 },
                device: {
                    secondary_defaults: {
                        phone: undefined,
                        internet: circular,
                    },
                },
                contacts: [{ id: 'c1' }],
                phone: {
                    history: [],
                },
                email: {
                    messages: [{ id: 'm1' }],
                },
                internet: {
                    pages: [{ id: 'landing' }],
                    forms: [],
                },
            },
            {
                entry_point: { app: 'phone', screen: 9 },
                device: {
                    secondary_defaults: {
                        phone: 'history',
                        internet: 3,
                    },
                },
                contacts: [
                    { id: 'c1' },
                    { id: 'c2' },
                    { id: 'c3' },
                    { id: 'c4' },
                    { id: 'c5' },
                    { id: 'c6' },
                    { id: 'c7' },
                ],
                phone: {
                    incoming_call: { transcript: 'Hello' },
                    history: [{ id: 'call-1' }],
                },
                email: {
                    messages: [
                        { id: 'm2' },
                        { id: 'm3' },
                        { id: 'm4' },
                        { id: 'm5' },
                        { id: 'm6' },
                        { id: 'm7' },
                        { id: 'm8' },
                        { id: 'm9' },
                        { id: 'm10' },
                    ],
                },
                internet: {
                    pages: [{ id: 'landing' }],
                    forms: [{ id: 'form-1' }],
                },
            }
        );

        expect(diffs).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ section: 'entry_point', change: 'Entry point: (none) → phone/' }),
                expect.objectContaining({
                    section: 'device',
                    change: 'Device secondary_defaults changed',
                    detail: expect.stringContaining('phone: (none) → history'),
                }),
                expect.objectContaining({
                    section: 'device',
                    detail: expect.stringContaining('internet: (unserializable) → 3'),
                }),
                expect.objectContaining({
                    section: 'contacts',
                    detail: '+6 (c2, c3, c4, c5, c6…)',
                }),
                expect.objectContaining({ section: 'phone', change: 'Phone: incoming_call added' }),
                expect.objectContaining({ section: 'phone', change: 'Phone history: 0 → 1 entries' }),
                expect.objectContaining({
                    section: 'email',
                    detail: '+m2, +m3, +m4, +m5, +m6, +m7, +m8, +m9…',
                }),
                expect.objectContaining({ section: 'internet', change: 'Browser forms: 0 → 1' }),
            ])
        );
        expect(diffs.find((item) => item.section === 'internet' && item.change.includes('Browser pages'))).toBeUndefined();
    });

    it('covers invalid ids, nullish json formatting, and browser page removal labels', () => {
        const jsonUndefined = { toJSON: () => undefined };

        const diffs = diffSimulatorPayloads(
            {
                entry_point: { app: 7, screen: 'landing' },
                contacts: [{ id: 'c1' }, { label: 'missing-id' }],
                internet: {
                    pages: [{ id: 'landing' }, { label: 'missing-id' }],
                },
                device: {
                    secondary_defaults: {
                        phone: jsonUndefined,
                    },
                },
            },
            {
                entry_point: { app: 'internet', screen: 'pricing' },
                contacts: [{ id: 'c1' }],
                internet: {
                    pages: [],
                },
                device: {
                    secondary_defaults: {
                        phone: null,
                    },
                },
            }
        );

        expect(diffs).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ section: 'entry_point', change: 'Entry point: (none) → internet/pricing' }),
                expect.objectContaining({
                    section: 'device',
                    detail: 'phone: (none) → (none)',
                }),
                expect.objectContaining({
                    section: 'internet',
                    change: 'Browser pages: landing → (none)',
                    detail: '-landing',
                }),
            ])
        );
    });

    it('covers browser page additions from an empty starting set', () => {
        const diffs = diffSimulatorPayloads(
            {
                internet: {
                    pages: [],
                },
            },
            {
                internet: {
                    pages: [{ id: 'landing' }],
                },
            }
        );

        expect(diffs).toContainEqual({
            section: 'internet',
            change: 'Browser pages: (none) → landing',
            detail: '+landing',
        });
    });
});
