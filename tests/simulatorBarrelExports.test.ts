import { describe, expect, it } from 'vitest';

describe('simulator package barrel exports', () => {
    it('loads the main package entry barrel', async () => {
        const barrel = await import('../src/index');

        expect(typeof barrel.applyPreviewFallback).toBe('function');
        expect(typeof barrel.resolveScreen).toBe('function');
    });

    it('loads the screen registry barrel', async () => {
        const barrel = await import('../src/screenRegistry');

        expect(typeof barrel.resolveScreen).toBe('function');
        expect(typeof barrel.renderActiveScreen).toBe('function');
        expect(Array.isArray(barrel.SCREEN_REGISTRY)).toBe(true);
    });
});
