import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import SimulatorBrowserChrome from '../src/components/SimulatorBrowserChrome';

import { TestRenderer, act } from './reactTestRenderer';

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

describe('SimulatorBrowserChrome', () => {
    it('covers highlighted url rendering, title fallback, and nav button handlers', async () => {
        const onBack = vi.fn();
        const onForward = vi.fn();
        const onRefresh = vi.fn();
        const onHome = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(
                    SimulatorBrowserChrome,
                    {
                        title: '',
                        url: '',
                        urlHighlightSegments: [{ start: 20, end: 30 }],
                        onBack,
                        onForward,
                        onRefresh,
                        onHome,
                    },
                    React.createElement('div', null, 'Page body')
                )
            );
        });

        expect(flattenText(renderer!.toJSON())).toContain('Web Page Title');
        expect(flattenText(renderer!.toJSON())).toContain('Page body');

        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Back' }).props.onClick();
            renderer!.root.findByProps({ 'aria-label': 'Forward' }).props.onClick();
            renderer!.root.findByProps({ 'aria-label': 'Refresh' }).props.onClick();
            renderer!.root.findByProps({ 'aria-label': 'Home' }).props.onClick();
        });

        expect(onBack).toHaveBeenCalledTimes(1);
        expect(onForward).toHaveBeenCalledTimes(1);
        expect(onRefresh).toHaveBeenCalledTimes(1);
        expect(onHome).toHaveBeenCalledTimes(1);
    });

    it('covers unhighlighted url rendering and repeated highlight key generation', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorBrowserChrome, {
                    title: 'Portal',
                    url: 'https://evil.example.test/login',
                    urlHighlightSegments: [
                        { start: 8, end: 12 },
                        { start: 21, end: 26 },
                    ],
                })
            );
        });

        const highlighted = renderer!.root.findAll(
            (node) => node.type === 'span' && node.props.style?.backgroundColor != null
        );
        expect(highlighted).toHaveLength(2);
        expect(flattenText(renderer!.toJSON())).toContain('Portal');
        expect(flattenText(renderer!.toJSON())).toContain('https://evil.example.test/login');
    });

    it('covers invalid highlight ranges that collapse back to plain text', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorBrowserChrome, {
                    title: 'Portal',
                    url: 'https://example.test',
                    urlHighlightSegments: [{ start: 10, end: 10 }, { start: 50, end: 60 }],
                })
            );
        });

        const highlighted = renderer!.root.findAll(
            (node) => node.type === 'span' && node.props.style?.backgroundColor != null
        );
        expect(highlighted).toHaveLength(0);
        expect(flattenText(renderer!.toJSON())).toContain('https://example.test');
    });
});
