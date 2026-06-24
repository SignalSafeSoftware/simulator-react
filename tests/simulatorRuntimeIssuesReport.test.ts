import React from 'react';
import { describe, expect, it } from 'vitest';
import SimulatorRuntimeIssuesReport from '../src/components/SimulatorRuntimeIssuesReport';

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

describe('SimulatorRuntimeIssuesReport', () => {
    it('renders the empty summary and empty-state text', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorRuntimeIssuesReport, {
                    issues: [],
                    defaultExpanded: true,
                })
            );
        });

        const text = flattenText(renderer!.toJSON());
        expect(text).toContain('Runtime issues— none');
        expect(text).toContain('No runtime issues detected.');
    });

    it('renders plural issue counts and node/choice locations', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorRuntimeIssuesReport, {
                    defaultExpanded: true,
                    issues: [
                        { severity: 'error', message: 'Broken branch', node_id: 'start', choice_id: 'open' },
                        { severity: 'warning', message: 'Dangling node', node_id: 'review' },
                    ] as never,
                })
            );
        });

        const text = flattenText(renderer!.toJSON());
        expect(text).toContain('Runtime issues— 2 issues, 1 error');
        expect(text).toContain('Broken branch (start / open)');
        expect(text).toContain('Dangling node (review)');
    });

    it('covers plural error summaries, fallback locations, and toggle behavior', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorRuntimeIssuesReport, {
                    className: 'custom-runtime-report',
                    defaultExpanded: false,
                    issues: [
                        { severity: 'error', message: 'Choice without node', choice_id: 'open' },
                        { severity: 'error', message: 'No location fields' },
                    ] as never,
                })
            );
        });

        const root = renderer!.root;
        expect(root.findByProps({ 'data-testid': 'simulator-runtime-issues-report' }).props.className).toContain('custom-runtime-report');
        expect(flattenText(renderer!.toJSON())).toContain('Runtime issues— 2 issues, 2 errors');

        await act(async () => {
            root.findByType('button').props.onClick();
        });

        const text = flattenText(renderer!.toJSON());
        expect(text).toContain('Choice without node (node ? / open)');
        expect(text).toContain('No location fields');
        expect(text).not.toContain('No location fields (');
    });
});
