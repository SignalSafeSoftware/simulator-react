import type { ReactTestRendererJSON } from 'react-test-renderer';
import { simulatorEnglish } from '../src/i18n/catalog.js';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import SimulatorErrorBoundary from '../src/SimulatorErrorBoundary';
import UnsupportedScreenFallback from '../src/UnsupportedScreenFallback';
import { TestRenderer, renderWithAct } from './reactTestRenderer';
function flattenText(node: ReactTestRendererJSON | ReactTestRendererJSON[] | null): string {
    if (node == null) return '';
    if (Array.isArray(node)) return node.map((child) => flattenText(child)).join('');
    return (node.children ?? [])
        .map((child) => (typeof child === 'string' ? child : flattenText(child)))
        .join('');
}
function Boom(): never {
    throw new Error('internal reducer dispatch failed at src/state/foo.ts:42');
}
describe('learner-safe simulator errors', () => {
    it('SimulatorErrorBoundary hides exception message and stack by default', async () => {
        const renderer = await renderWithAct(
            React.createElement(SimulatorErrorBoundary, { children: React.createElement(Boom) }),
        );
        const text = flattenText(renderer.toJSON());
        expect(text).toContain(simulatorEnglish['fallback.learner_simulator_error_message']);
        expect(text).not.toContain('internal reducer');
        expect(text).not.toContain('foo.ts');
        expect(
            renderer.root.findAllByProps({ 'data-testid': 'simulator-error-diagnostics-stack' }),
        ).toHaveLength(0);
        renderer.unmount();
    });
    it('SimulatorErrorBoundary shows diagnostics when showDiagnostics is true', async () => {
        const renderer = await renderWithAct(
            React.createElement(SimulatorErrorBoundary, {
                showDiagnostics: true,
                children: React.createElement(Boom),
            }),
        );
        const text = flattenText(renderer.toJSON());
        expect(text).toContain('internal reducer dispatch failed');
        expect(
            renderer.root.findByProps({ 'data-testid': 'simulator-error-diagnostics-stack' }),
        ).toBeTruthy();
        renderer.unmount();
    });
    it('UnsupportedScreenFallback hides app/screen ids by default', () => {
        const renderer = TestRenderer.create(
            React.createElement(UnsupportedScreenFallback, {
                app: 'phone',
                screen: 'secret_internal_screen',
            }),
        );
        const text = flattenText(renderer.toJSON());
        expect(text).toContain(simulatorEnglish['fallback.learner_unsupported_screen_message']);
        expect(text).not.toContain('secret_internal_screen');
        expect(text).not.toContain('App:');
    });
    it('UnsupportedScreenFallback shows app/screen when showDiagnostics is true', () => {
        const renderer = TestRenderer.create(
            React.createElement(UnsupportedScreenFallback, {
                app: 'phone',
                screen: 'mystery',
                showDiagnostics: true,
            }),
        );
        const text = flattenText(renderer.toJSON());
        expect(text).toContain('App: phone');
        expect(text).toContain('Screen: mystery');
    });
    it('logs render errors to console without rendering stack to learners', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const renderer = await renderWithAct(
            React.createElement(SimulatorErrorBoundary, { children: React.createElement(Boom) }),
        );
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
        renderer.unmount();
    });
});
