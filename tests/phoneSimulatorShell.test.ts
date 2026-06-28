import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import PhoneSimulatorShell from '../src/shell/PhoneSimulatorShell';

import { TestRenderer, act } from './reactTestRenderer';

describe('PhoneSimulatorShell', () => {
    it('renders the primary channel nav when no secondary menu is present', async () => {
        const onChannelChange = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(PhoneSimulatorShell, {
                    activeChannel: 'email',
                    onChannelChange,
                    title: 'Device',
                })
            );
        });

        const root = renderer!.root;
        const nav = root.findByProps({ 'aria-label': 'Simulator channels' });
        expect(nav.props.role).toBe('tablist');

        const emailButton = root.findByProps({ 'aria-label': 'Email' });
        expect(emailButton.props['aria-selected']).toBe(true);

        await act(async () => {
            root.findByProps({ 'aria-label': 'Home' }).props.onClick();
        });

        expect(onChannelChange).toHaveBeenCalledWith('home');
    });

    it('renders the secondary menu and routes the back action separately', async () => {
        const onSelect = vi.fn();
        const onSecondaryBack = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(PhoneSimulatorShell, {
                    activeChannel: 'contacts',
                    onChannelChange: vi.fn(),
                    secondaryMenu: {
                        items: [
                            { id: 'contacts', label: 'Contacts', icon: 'C' },
                            { id: 'back', label: 'Back', icon: 'B' },
                        ],
                        activeId: 'contacts',
                        onSelect,
                        onSecondaryBack,
                    },
                })
            );
        });

        const root = renderer!.root;
        const nav = root.findByProps({ 'aria-label': 'App secondary menu' });
        expect(nav.props.role).toBe('tablist');

        await act(async () => {
            root.findByProps({ 'aria-label': 'Contacts' }).props.onClick();
        });
        expect(onSelect).toHaveBeenCalledWith('contacts');

        await act(async () => {
            root.findByProps({ 'aria-label': 'Back' }).props.onClick();
        });
        expect(onSecondaryBack).toHaveBeenCalledTimes(1);
    });

    it('renders exit links, header-only layout, and compact shell mode', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(PhoneSimulatorShell, {
                    activeChannel: 'contacts',
                    onChannelChange: vi.fn(),
                    exitTo: '/exit',
                    exitLabel: 'Close',
                    compact: true,
                    hideBottomNav: true,
                })
            );
        });

        const root = renderer!.root;
        const exitLink = root.findByType('a');
        expect(exitLink.props.href).toBe('/exit');
        expect(exitLink.props.children).toBe('Close');

        const header = root.findAllByType('div').find((node) => node.props.className?.includes('simulator-flex--end'));
        expect(header).toBeDefined();

        const shellBody = root.findAllByType('div').find((node) => node.props.className?.includes('simulator-surface--body-tertiary'))!;
        expect(shellBody.props.className).not.toContain('min-vh-100');
        expect(root.findAll((node) => node.props['aria-label'] === 'Simulator channels')).toHaveLength(0);
    });
});
