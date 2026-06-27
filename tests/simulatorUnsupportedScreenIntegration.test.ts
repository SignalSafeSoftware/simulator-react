import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getInitialSessionState } from '../src/state/simulatorSessionReducer';
import { LEARNER_UNSUPPORTED_SCREEN_MESSAGE } from '../src/constants';
import { minimalPhoneWorld } from './support/fixtureWorlds';
import { TestRenderer, act } from './reactTestRenderer';

vi.mock('../src/shell/PhoneSimulatorShell', () => ({
    default: ({ children }: { children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'simulator-shell' }, children),
}));

vi.mock('../src/SimulatorDeveloperToolsPanel', () => ({
    default: () => null,
}));

vi.mock('../src/views/ContactsView', () => ({
    default: () => null,
}));

vi.mock('../src/screenRegistry', () => ({
    renderActiveScreen: () => null,
}));

import SimulatorWithSession from '../src/SimulatorWithSession';

function flattenText(node: TestRenderer.ReactTestRendererJSON | TestRenderer.ReactTestRendererJSON[] | null): string {
    if (node == null) return '';
    if (Array.isArray(node)) return node.map((child) => flattenText(child)).join('');
    return (node.children ?? [])
        .map((child) => (typeof child === 'string' ? child : flattenText(child)))
        .join('');
}

describe('SimulatorWithSession unsupported screen fallback', () => {
    let renderer: TestRenderer.ReactTestRenderer | null = null;

    afterEach(() => {
        renderer?.unmount();
        renderer = null;
    });

    it('shows learner-safe fallback copy when the screen registry returns null', async () => {
        const dispatch = vi.fn();
        const state = getInitialSessionState(minimalPhoneWorld());

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorWithSession, {
                    state,
                    dispatch,
                }),
            );
        });

        const text = flattenText(renderer!.toJSON());
        expect(text).toContain(LEARNER_UNSUPPORTED_SCREEN_MESSAGE);
        expect(text).not.toContain('incoming_call');
        expect(renderer!.root.findByProps({ 'data-testid': 'simulator-unsupported-screen' })).toBeTruthy();
    });
});
