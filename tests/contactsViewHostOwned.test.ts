import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ContactsView from '../src/views/ContactsView';
import { SIM_PHONE_CONTACT_DETAIL, SIM_PHONE_CONTACT_ROW } from '../src/ui/semanticSimulatorClasses';
import { TestRenderer, act } from './reactTestRenderer';

const CONTACTS = [
    { id: 'c1', displayName: 'Alex Chen', number: '+1-555-100-2000', email: 'alex@example.com' },
    { id: 'c2', displayName: 'Bob', number: '+1-555-200-3000' },
];

const PHONE_NAV = {
    phoneLocalNavItems: [{ id: 'contacts', label: 'Contacts' }],
    onPhoneNavSelect: vi.fn(),
};

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

describe('ContactsView host-owned phone contact detail', () => {
    let renderer: TestRenderer.ReactTestRenderer | null = null;

    afterEach(() => {
        renderer?.unmount();
        renderer = null;
    });

    it('default: clicking a row renders internal contact detail', async () => {
        const onOpenContact = vi.fn();
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(ContactsView, {
                    contacts: CONTACTS,
                    onBack: vi.fn(),
                    onOpenContact,
                    ...PHONE_NAV,
                }),
            );
        });

        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_DETAIL)).toBeNull();

        clickContactRow(renderer!.root, 'Alex Chen');

        expect(onOpenContact).toHaveBeenCalledWith('c1');
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_DETAIL)).toBeTruthy();
    });

    it('host-owned: clicking a row calls onPhoneContactOpen and does not render contact detail', async () => {
        const onOpenContact = vi.fn();
        const onPhoneContactOpen = vi.fn();
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(ContactsView, {
                    contacts: CONTACTS,
                    onBack: vi.fn(),
                    onOpenContact,
                    hostOwnsPhoneContactDetail: true,
                    onPhoneContactOpen,
                    ...PHONE_NAV,
                }),
            );
        });

        clickContactRow(renderer!.root, 'Bob');

        expect(onOpenContact).toHaveBeenCalledWith('c2');
        expect(onPhoneContactOpen).toHaveBeenCalledWith('c2', CONTACTS[1]);
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_DETAIL)).toBeNull();
    });

    it('host-owned: onOpenContact still fires when host owns detail', async () => {
        const onOpenContact = vi.fn();
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(ContactsView, {
                    contacts: CONTACTS,
                    onBack: vi.fn(),
                    onOpenContact,
                    hostOwnsPhoneContactDetail: true,
                    onPhoneContactOpen: vi.fn(),
                    ...PHONE_NAV,
                }),
            );
        });

        clickContactRow(renderer!.root, 'Alex Chen');

        expect(onOpenContact).toHaveBeenCalledTimes(1);
        expect(onOpenContact).toHaveBeenCalledWith('c1');
    });
});
