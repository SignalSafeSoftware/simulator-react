import React from 'react';
import { describe, expect, it } from 'vitest';
import UnsupportedScreenFallback from '../src/UnsupportedScreenFallback';
import { LEARNER_UNSUPPORTED_SCREEN_MESSAGE } from '../src/constants';
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
    it('renders learner-safe copy by default', () => {
        const filled = TestRenderer.create(
            React.createElement(UnsupportedScreenFallback, {
                app: 'phone',
                screen: 'mystery',
            }),
        );

        const text = flattenText(filled.toJSON());
        expect(text).toContain(LEARNER_UNSUPPORTED_SCREEN_MESSAGE);
        expect(text).not.toContain('App: phone');
        expect(text).not.toContain('Screen: mystery');
        expect(filled.root.findByProps({ 'data-testid': 'simulator-unsupported-screen' }).props.role).toBe('alert');
    });

    it('renders app and screen when showDiagnostics is true', () => {
        const filled = TestRenderer.create(
            React.createElement(UnsupportedScreenFallback, {
                app: 'phone',
                screen: 'mystery',
                showDiagnostics: true,
            }),
        );
        const empty = TestRenderer.create(
            React.createElement(UnsupportedScreenFallback, {
                app: 'email',
                screen: '',
                showDiagnostics: true,
            }),
        );

        expect(flattenText(filled.toJSON())).toContain('App: phone');
        expect(flattenText(filled.toJSON())).toContain('Screen: mystery');
        expect(flattenText(empty.toJSON())).toContain('Screen: (empty)');
    });
});
