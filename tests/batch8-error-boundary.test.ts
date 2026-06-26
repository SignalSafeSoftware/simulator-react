import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import SimulatorErrorBoundary from '../src/SimulatorErrorBoundary';
import { TestRenderer, act } from './reactTestRenderer';

function Boom(): never {
    throw new Error('render failed');
}

describe('SimulatorErrorBoundary', () => {
    it('renders fallback UI and calls onRetry when dismiss is clicked', async () => {
        const onRetry = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(
                    SimulatorErrorBoundary,
                    { onRetry },
                    React.createElement(Boom),
                ),
            );
        });

        const fallback = renderer!.root.findByProps({ 'data-testid': 'simulator-error-fallback' });
        expect(fallback).toBeTruthy();

        const dismiss = renderer!.root.find(
            (node) => node.type === 'button' && node.children?.includes('Dismiss'),
        );
        expect(dismiss).toBeTruthy();

        await act(async () => {
            dismiss!.props.onClick();
        });
        expect(onRetry).toHaveBeenCalledTimes(1);

        renderer?.unmount();
    });
});
