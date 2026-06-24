import React from 'react';
import { describe, expect, it } from 'vitest';
import UnsupportedScreenFallback from '../src/UnsupportedScreenFallback';
import { TestRenderer } from './reactTestRenderer';

function flattenText(node: TestRenderer.ReactTestRendererJSON | TestRenderer.ReactTestRendererJSON[] | null): string {
    if (node == null) {
        return '';
    }
    if (Array.isArray(node)) {
        return node.map((child) => flattenText(child)).join('');
    }
    return (node.children ?? [])
        .map((child) => (typeof child === 'string' ? child : flattenText(child)))
        .join('');
}

describe('UnsupportedScreenFallback', () => {
    it('renders the app, screen, and empty-screen placeholder', () => {
        const filled = TestRenderer.create(
            React.createElement(UnsupportedScreenFallback, {
                app: 'phone',
                screen: 'mystery',
            })
        );
        const empty = TestRenderer.create(
            React.createElement(UnsupportedScreenFallback, {
                app: 'email',
                screen: '',
            })
        );

        expect(flattenText(filled.toJSON())).toContain('App: phone');
        expect(flattenText(filled.toJSON())).toContain('Screen: mystery');
        expect(flattenText(empty.toJSON())).toContain('Screen: (empty)');
        expect(empty.root.findByProps({ 'data-testid': 'simulator-unsupported-screen' }).props.role).toBe('alert');
    });
});
