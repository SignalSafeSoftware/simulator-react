import { describe, expect, it, vi } from 'vitest';

import { renderSimulatorChoice, renderSimulatorFeedback } from '../src/ui/renderSlots';
import { TestRenderer } from './reactTestRenderer';
import { collectBootstrapViolations } from './bootstrapClassDenylist';

describe('renderSlots', () => {
    it('renderSimulatorChoice uses default simulator button when no slot is provided', () => {
        const onClick = vi.fn();
        const renderer = TestRenderer.create(renderSimulatorChoice({ label: 'Send', tone: 'primary', onClick }));
        expect(collectBootstrapViolations(renderer.root)).toEqual([]);
        expect(
            renderer.root.findAll(
                (node) =>
                    typeof node.props.className === 'string' &&
                    node.props.className.includes('simulator-btn'),
            ).length,
        ).toBeGreaterThan(0);
    });

    it('renderSimulatorChoice delegates to host renderChoice slot', () => {
        const onClick = vi.fn();
        const slot = vi.fn((choice) => choice.label);
        const node = renderSimulatorChoice({ label: 'Custom', onClick }, slot);
        expect(slot).toHaveBeenCalledWith(expect.objectContaining({ label: 'Custom', onClick }));
        expect(node).toBe('Custom');
    });

    it('renderSimulatorFeedback uses default simulator alert when no slot is provided', () => {
        const renderer = TestRenderer.create(
            renderSimulatorFeedback({ message: 'Heads up', tone: 'warning' }),
        );
        expect(collectBootstrapViolations(renderer.root)).toEqual([]);
        expect(
            renderer.root.findAll(
                (node) =>
                    typeof node.props.className === 'string' &&
                    node.props.className.includes('simulator-alert'),
            ).length,
        ).toBeGreaterThan(0);
    });

    it('renderSimulatorFeedback delegates to host renderFeedback slot', () => {
        const slot = vi.fn((feedback) => feedback.message);
        const node = renderSimulatorFeedback({ message: 'Heads up', tone: 'warning' }, slot);
        expect(slot).toHaveBeenCalledWith({ message: 'Heads up', tone: 'warning' });
        expect(node).toBe('Heads up');
    });
});
