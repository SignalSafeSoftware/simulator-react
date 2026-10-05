import type { ReactTestRendererJSON } from 'react-test-renderer';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import SimulatorErrorBoundary from '../src/SimulatorErrorBoundary';
import { act, renderWithAct } from './reactTestRenderer';
function flattenText(node: ReactTestRendererJSON | ReactTestRendererJSON[] | null): string {
    if (node == null) return '';
    if (Array.isArray(node)) return node.map((child) => flattenText(child)).join('');
    return (node.children ?? [])
        .map((child) => (typeof child === 'string' ? child : flattenText(child)))
        .join('');
}
function Boom(): never {
    throw new Error('render failed');
}
describe('SimulatorErrorBoundary', () => {
    it('renders fallback UI and calls onRetry when dismiss is clicked', async () => {
        const onRetry = vi.fn();
        const renderer = await renderWithAct(
            React.createElement(SimulatorErrorBoundary, {
                onRetry,
                children: React.createElement(Boom),
            }),
        );
        const fallback = renderer.root.findByProps({ 'data-testid': 'simulator-error-fallback' });
        expect(fallback).toHaveProperty('props');
        expect(flattenText(renderer.toJSON())).not.toContain('render failed');
        const dismiss = renderer.root.find(
            (node) => node.type === 'button' && node.children?.includes('Dismiss'),
        );
        expect(dismiss).toHaveProperty('props');
        await act(async () => {
            dismiss!.props.onClick();
        });
        expect(onRetry).toHaveBeenCalledTimes(1);
        renderer.unmount();
    });
});
