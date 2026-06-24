import { describe, expect, it } from 'vitest';
import { applyPartials, deepMergeSections } from '../src/utils/simulatorWorldSections';

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
                device: {
                    secondaryDefaults: { phone: 'history' },
                },
                browser: {
                    pages: [{ id: 'pricing' }],
                },
            }
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
                            inbox: [{ id: 'm1' }],
                        },
                    },
                    null as never,
                ],
                {}
            )
        ).toEqual({
            email: {
                inbox: [{ id: 'm1' }],
            },
        });
    });

    it('covers nullish first partial fallback before overlay merge', () => {
        expect(
            applyPartials(
                [undefined as never],
                {
                    home: {
                        widgets: [{ id: 'w1' }],
                    },
                }
            )
        ).toEqual({
            home: {
                widgets: [{ id: 'w1' }],
            },
        });
    });
});
