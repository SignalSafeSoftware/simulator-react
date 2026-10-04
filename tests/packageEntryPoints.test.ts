import { applyPreviewFallback } from '@signalsafe/simulator-react/utils/previewFallbackWorld';
import { resolveScreen } from '@signalsafe/simulator-react/screenRegistry/registry';
import { describe, expect, it } from 'vitest';

describe('simulator package entry points', () => {
    it('loads public owner modules', async () => {
        expect(typeof applyPreviewFallback).toBe('function');
        expect(typeof resolveScreen).toBe('function');
    });

    it('loads the screen registry implementation', async () => {
        const entry = await import('../src/screenRegistry/registry.js');

        expect(typeof entry.resolveScreen).toBe('function');
        expect(typeof entry.renderActiveScreen).toBe('function');
        expect(Array.isArray(entry.SCREEN_REGISTRY)).toBe(true);
    });
});
