import type { ReactTestRendererJSON, ReactTestRenderer } from 'react-test-renderer';
import {} from 'node:os';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {} from '../src/adapters/device/emailMapper';
import {} from '../src/adapters/device/homeMapper';
import {} from '../src/adapters/device/internetMapper';
import {} from '../src/adapters/device/messagesMapper';
import {} from '../src/adapters/device/phoneMapper';
import SimulatorErrorBoundary from '../src/SimulatorErrorBoundary';
import SimulatorLintBanner from '../src/developer-tools/SimulatorLintBanner.js';
import { SimulatorList, SimulatorListItem } from '../src/ui/lists/SimulatorList.js';
import { TestRenderer, act } from './reactTestRenderer';

const originalArgv = [...process.argv];

const originalCwd = process.cwd();

const originalDocument = globalThis.document;

const originalCustomEvent = (
    globalThis as {
        CustomEvent?: unknown;
    }
).CustomEvent;

const originalHTMLElement = (
    globalThis as {
        HTMLElement?: unknown;
    }
).HTMLElement;

function flattenText(node: ReactTestRendererJSON | ReactTestRendererJSON[] | null): string {
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

afterEach(() => {
    process.argv = [...originalArgv];
    process.chdir(originalCwd);
    (
        globalThis as {
            document?: Document;
        }
    ).document = originalDocument;
    (
        globalThis as {
            CustomEvent?: unknown;
        }
    ).CustomEvent = originalCustomEvent;
    (
        globalThis as {
            HTMLElement?: unknown;
        }
    ).HTMLElement = originalHTMLElement;
    vi.restoreAllMocks();
});

describe('error boundary and lint banner', () => {
    it('covers simulator error boundary fallback rendering and retry', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const onRetry = vi.fn();
        const Boom = () => {
            throw new Error('Boom');
        };
        let renderer: ReactTestRenderer | null = null;
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorErrorBoundary, {
                    fallbackTitle: 'Custom error',
                    onRetry,
                    showDiagnostics: true,
                    children: React.createElement(Boom),
                }),
            );
        });
        const text = flattenText(renderer!.toJSON());
        expect(text).toContain('Custom error');
        expect(text).toContain('Boom');
        expect(consoleSpy).toHaveBeenCalled();
        await act(async () => {
            renderer!.root.findByProps({ children: 'Dismiss' }).props.onClick();
        });
        expect(onRetry).toHaveBeenCalledTimes(1);
    });
    it('covers lint banner and simulator list components', async () => {
        let bannerRenderer: ReactTestRenderer | null = null;
        await act(async () => {
            bannerRenderer = TestRenderer.create(
                React.createElement(SimulatorLintBanner, {
                    warnings: [
                        { code: 'one', message: 'First warning', path: 'entry_point' },
                        { code: 'two', message: 'Second warning' },
                    ],
                }),
            );
        });
        expect(flattenText(bannerRenderer!.toJSON())).toContain('Template suggestions (2)');
        await act(async () => {
            bannerRenderer!.root.findByType('button').props.onClick();
        });
        expect(
            bannerRenderer!.root.findByProps({ 'data-testid': 'simulator-lint-banner' }),
        ).toBeTruthy();
        let emptyBanner: ReactTestRenderer | null = null;
        await act(async () => {
            emptyBanner = TestRenderer.create(
                React.createElement(SimulatorLintBanner, {
                    warnings: [],
                }),
            );
        });
        expect(emptyBanner!.toJSON()).toBeNull();
        let listRenderer: ReactTestRenderer | null = null;
        await act(async () => {
            listRenderer = TestRenderer.create(
                React.createElement(SimulatorList, {
                    className: 'extra',
                    children: React.createElement(SimulatorListItem, {
                        onClick: vi.fn(),
                        active: true,
                        variant: 'compact',
                        className: 'row-extra',
                        children: 'List entry',
                    }),
                }),
            );
        });
        expect(listRenderer!.root.findByType('ul').props.className).toContain('extra');
        expect(listRenderer!.root.findByType('li').props.className).toContain('row-extra');
        expect(listRenderer!.root.findByType('button').children).toEqual(['List entry']);
    });
});
