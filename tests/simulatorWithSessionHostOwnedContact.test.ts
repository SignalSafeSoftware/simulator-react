import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getInitialSessionState } from '../src/state/simulatorSessionReducer';
import { SIM_PHONE_CONTACT_DETAIL, SIM_PHONE_CONTACT_ROW } from '../src/ui/semanticSimulatorClasses';
import { minimalPhoneWorld } from './support/fixtureWorlds';
import { TestRenderer, act } from './reactTestRenderer';

vi.mock('../src/shell/PhoneSimulatorShell', () => ({
    default: ({ children }: { children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'simulator-shell' }, children),
}));

vi.mock('../src/SimulatorDeveloperToolsPanel', () => ({
    default: () => null,
}));

import SimulatorWithSession from '../src/SimulatorWithSession';

function findWithClass(root: TestRenderer.ReactTestInstance, className: string): TestRenderer.ReactTestInstance | null {
    const nodes = root.findAll(
        (node) => typeof node.props.className === 'string' && node.props.className.includes(className),
        { deep: true },
    );
    return nodes[0] ?? null;
}

function clickContactRow(root: TestRenderer.ReactTestInstance, displayName: string): void {
    const row = root
        .findAll(
            (node) =>
                node.type === 'button' &&
                typeof node.props.className === 'string' &&
                node.props.className.includes(SIM_PHONE_CONTACT_ROW),
            { deep: true },
        )
        .find((node) => {
            const spans = node.findAllByType('span', { deep: true });
            return spans.some((span) => span.children.includes(displayName));
        });
    if (row == null) {
        throw new Error(`Contact row not found: ${displayName}`);
    }
    act(() => {
        row.props.onClick();
    });
}

describe('SimulatorWithSession host-owned phone contact detail', () => {
    let renderer: TestRenderer.ReactTestRenderer | null = null;

    afterEach(() => {
        renderer?.unmount();
        renderer = null;
    });

    it('passes hostOwnsPhoneContactDetail and onPhoneContactOpen to ContactsView on phone contacts screen', async () => {
        const onPhoneContactOpen = vi.fn();
        const onSimulatorEvent = vi.fn();
        const dispatch = vi.fn();
        const state = getInitialSessionState(minimalPhoneWorld());
        state.view.activeApp = 'phone';
        state.view.phone.screen = 'contacts';
        state.view.showPrimaryMenu = true;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorWithSession, {
                    state,
                    dispatch,
                    onSimulatorEvent,
                    hostOwnsPhoneContactDetail: true,
                    onPhoneContactOpen,
                }),
            );
        });

        clickContactRow(renderer!.root, 'IT Helpdesk');

        expect(onPhoneContactOpen).toHaveBeenCalledWith(
            expect.objectContaining({
                state,
                dispatch,
                contactId: 'c1',
                contact: expect.objectContaining({ id: 'c1', displayName: 'IT Helpdesk' }),
            }),
        );
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_DETAIL)).toBeNull();
        expect(onSimulatorEvent).toHaveBeenCalled();
    });
});
