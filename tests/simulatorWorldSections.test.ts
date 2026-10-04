import { describe, expect, it } from 'vitest';
import { applyPartials, deepMergeSections } from '../src/utils/payload/simulatorWorldSections';

describe('simulatorWorldSections', () => {
    it('deep-merges section objects while filtering unknown keys', () => {
        const merged = deepMergeSections(
            {
                device: {
                    mainMenuItems: [{ id: 'email' }],
                    secondaryDefaults: { email: 'list' },
                },
                browser: {
                    pages: [{ id: 'landing' }],
                },
                ignored: { keep: false },
            } as never,
            {
                // @ts-expect-error Exercise recursive merging of incomplete untyped device data.
                device: {
                    secondaryDefaults: { phone: 'history' },
                },
                browser: {
                    // @ts-expect-error Exercise array replacement with incomplete untyped page data.
                    pages: [{ id: 'pricing' }],
                },
            },
        );

        expect(merged).toEqual({
            device: {
                mainMenuItems: [{ id: 'email' }],
                secondaryDefaults: { email: 'list', phone: 'history' },
            },
            browser: {
                pages: [{ id: 'pricing' }],
            },
        });
    });

    it('covers empty partial application, nullish entries, and empty overlay handling', () => {
        expect(applyPartials([])).toEqual({});
        expect(
            applyPartials(
                [
                    {
                        email: {
                            // @ts-expect-error Exercise incomplete inbox data at the raw merge boundary.
                            inbox: [{ id: 'm1' }],
                        },
                    },
                    null as never,
                ],
                {},
            ),
        ).toEqual({
            email: {
                inbox: [{ id: 'm1' }],
            },
        });
    });

    it('covers nullish first partial fallback before overlay merge', () => {
        expect(
            applyPartials([undefined as never], {
                home: {
                    // @ts-expect-error Exercise incomplete widget data at the raw merge boundary.
                    widgets: [{ id: 'w1' }],
                },
            }),
        ).toEqual({
            home: {
                widgets: [{ id: 'w1' }],
            },
        });
    });
});
