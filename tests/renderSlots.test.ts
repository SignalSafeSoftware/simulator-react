import { describe, expect, it, vi } from 'vitest';

import { renderSimulatorChoice, renderSimulatorFeedback } from '../src/ui/renderSlots';

describe('renderSlots', () => {
    it('renderSimulatorChoice uses default button when no slot is provided', () => {
        const onClick = vi.fn();
        const node = renderSimulatorChoice({ label: 'Send', tone: 'primary', onClick });
        expect(node).toBeTruthy();
        expect(typeof node).toBe('object');
    });

    it('renderSimulatorChoice delegates to host renderChoice slot', () => {
        const onClick = vi.fn();
        const slot = vi.fn((choice) => choice.label);
        const node = renderSimulatorChoice({ label: 'Custom', onClick }, slot);
        expect(slot).toHaveBeenCalledWith(expect.objectContaining({ label: 'Custom', onClick }));
        expect(node).toBe('Custom');
    });

    it('renderSimulatorFeedback delegates to host renderFeedback slot', () => {
        const slot = vi.fn((feedback) => feedback.message);
        const node = renderSimulatorFeedback({ message: 'Heads up', tone: 'warning' }, slot);
        expect(slot).toHaveBeenCalledWith({ message: 'Heads up', tone: 'warning' });
        expect(node).toBe('Heads up');
    });
});
