import React from 'react';
import type { ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import DirectoryView from '../src/views/contacts/DirectoryView';
import HomeSimulatorView from '../src/views/home/HomeSimulatorView';
import { TestRenderer, act } from './reactTestRenderer';
import { flattenText } from './support/viewCoverageSupport';

describe('directory and home views', () => {
    it('covers directory and home screens across empty and populated states', async () => {
        const onAction = vi.fn();
        const onViewEntry = vi.fn();
        const onPhoneNavSelect = vi.fn();
        let directoryRenderer: ReactTestRenderer | null = null;

        await act(async () => {
            directoryRenderer = TestRenderer.create(
                React.createElement(DirectoryView, {
                    directory: null,
                    contacts: null,
                    onBack: vi.fn(),
                    onAction,
                    phoneLocalNavItems: [{ id: 'directory', label: 'Directory' }],
                    onPhoneNavSelect,
                }),
            );
        });
        expect(flattenText(directoryRenderer!.toJSON())).toContain(
            'No directory for this scenario.',
        );

        await act(async () => {
            directoryRenderer!.update(
                React.createElement(DirectoryView, {
                    directory: [
                        {
                            id: 'helpdesk',
                            label: 'Helpdesk',
                            contact_id: 'contact-1',
                            description: 'Trusted number',
                        },
                        {
                            id: 'bank',
                            label: 'Bank',
                            number: '+1555010101',
                            url: 'https://bank.example.test',
                        },
                    ],
                    contacts: [
                        { id: 'contact-1', displayName: 'Helpdesk', number: '+15550001111' },
                    ],
                    onBack: vi.fn(),
                    onAction,
                    onViewEntry,
                }),
            );
        });
        await act(async () => {
            directoryRenderer!.root.findByProps({ children: 'Helpdesk' }).props.onClick();
        });
        expect(onViewEntry).toHaveBeenCalledWith('helpdesk');
        await act(async () => {
            directoryRenderer!.root.findByProps({ children: 'Call' }).props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'open_contact', contactId: 'contact-1' }),
        );

        await act(async () => {
            directoryRenderer!.update(
                React.createElement(DirectoryView, {
                    directory: [
                        {
                            id: 'bank',
                            label: 'Bank',
                            number: '+1555010101',
                            url: 'https://bank.example.test',
                        },
                    ],
                    contacts: [
                        { id: 'contact-1', displayName: 'Helpdesk', number: '+15550001111' },
                    ],
                    onBack: vi.fn(),
                    onAction,
                    onViewEntry,
                }),
            );
        });
        await act(async () => {
            directoryRenderer!.root
                .findAll((node) => typeof node.props.onClick === 'function')[0]!
                .props.onClick();
        });
        await act(async () => {
            directoryRenderer!.root.findByProps({ children: 'Call' }).props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'dial_phone', dialedNumber: '+1555010101' }),
        );
        expect(flattenText(directoryRenderer!.toJSON())).toContain('https://bank.example.test');

        const onNavigate = vi.fn();
        const onBack = vi.fn();
        let homeRenderer: ReactTestRenderer | null = null;
        await act(async () => {
            homeRenderer = TestRenderer.create(
                React.createElement(HomeSimulatorView, {
                    payload: {
                        widgets: [{ id: 'widget-1', label: 'News' }],
                        featuredApps: [],
                        settingsSections: [],
                    },
                    homeCapabilities: { store: true, settings: true },
                    screen: 'home',
                    onNavigate,
                    onAction,
                    onBack,
                }),
            );
        });
        expect(flattenText(homeRenderer!.toJSON())).toContain('News');
        await act(async () => {
            homeRenderer!.root.findByProps({ 'aria-label': 'Store' }).props.onClick();
            homeRenderer!.root.findByProps({ 'aria-label': 'Settings' }).props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'open_store' }));
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'open_settings' }));
        expect(onNavigate).toHaveBeenCalledWith('store');
        expect(onNavigate).toHaveBeenCalledWith('settings');

        await act(async () => {
            homeRenderer!.update(
                React.createElement(HomeSimulatorView, {
                    key: 'store-reset',
                    payload: {
                        widgets: [],
                        featuredApps: [{ id: 'app-1', name: 'Security App' }],
                        settingsSections: [],
                    },
                    homeCapabilities: { store: true, settings: true },
                    screen: 'store',
                    onNavigate,
                    onAction,
                    onBack,
                }),
            );
        });
        await act(async () => {
            homeRenderer!.root
                .findByProps({ 'aria-label': 'Search store' })
                .props.onChange({ target: { value: 'zzz' } });
            homeRenderer!.root.findByProps({ 'aria-label': 'Search store' }).props.onKeyDown({
                key: 'Enter',
                preventDefault: vi.fn(),
            });
        });
        expect(flattenText(homeRenderer!.toJSON())).toContain('No results.');
        await act(async () => {
            homeRenderer!.update(
                React.createElement(HomeSimulatorView, {
                    payload: {
                        widgets: [],
                        featuredApps: [{ id: 'app-1', name: 'Security App' }],
                        settingsSections: [],
                    },
                    homeCapabilities: { store: true, settings: true },
                    screen: 'store',
                    onNavigate,
                    onAction,
                    onBack,
                }),
            );
        });
        await act(async () => {
            homeRenderer!.root
                .findByProps({ 'aria-label': 'Download Security App' })
                .props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'open_store' }));

        await act(async () => {
            homeRenderer!.update(
                React.createElement(HomeSimulatorView, {
                    payload: {
                        widgets: [],
                        featuredApps: [],
                        settingsSections: [],
                    },
                    homeCapabilities: { store: true, settings: true },
                    screen: 'store',
                    onNavigate,
                    onAction,
                    onBack,
                }),
            );
        });
        expect(flattenText(homeRenderer!.toJSON())).toContain('No apps.');

        await act(async () => {
            homeRenderer!.update(
                React.createElement(HomeSimulatorView, {
                    payload: {
                        widgets: [],
                        featuredApps: [],
                        settingsSections: [{ id: 'general', title: 'General' }],
                    },
                    homeCapabilities: { store: true, settings: true },
                    screen: 'settings',
                    onNavigate,
                    onAction,
                    onBack,
                }),
            );
        });
        expect(flattenText(homeRenderer!.toJSON())).toContain('General');
        await act(async () => {
            homeRenderer!.root
                .findByProps({ 'aria-label': 'Search settings' })
                .props.onChange({ target: { value: 'missing' } });
        });
        expect(flattenText(homeRenderer!.toJSON())).toContain('No matching settings.');
        await act(async () => {
            homeRenderer!.root.findByProps({ 'aria-label': 'Back to Home' }).props.onClick();
        });
        expect(onBack).toHaveBeenCalled();

        await act(async () => {
            homeRenderer!.update(
                React.createElement(HomeSimulatorView, {
                    payload: {
                        widgets: [],
                        featuredApps: [],
                        settingsSections: [],
                    },
                    homeCapabilities: { store: false, settings: false },
                    screen: 'home',
                    onNavigate,
                    onAction,
                    onBack,
                }),
            );
        });
        expect(flattenText(homeRenderer!.toJSON())).toContain('Vault');
        expect(homeRenderer!.root.findByType('time')).toBeDefined();
        expect(homeRenderer!.root.findByProps({ 'aria-label': 'Settings' }).props.disabled).toBe(
            true,
        );

        await act(async () => {
            homeRenderer!.update(
                React.createElement(HomeSimulatorView, {
                    payload: {
                        widgets: [],
                        featuredApps: [],
                        settingsSections: [],
                    },
                    homeCapabilities: { store: true, settings: true },
                    screen: 'settings',
                    onNavigate,
                    onAction,
                    onBack,
                }),
            );
        });
        expect(flattenText(homeRenderer!.toJSON())).toContain(
            'No settings are configured for this scenario.',
        );
    });

    it('covers populated directory local-nav rendering and missing-contact detail fallback', async () => {
        const onAction = vi.fn();
        const onViewEntry = vi.fn();
        const onPhoneNavSelect = vi.fn();
        let renderer: ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(DirectoryView, {
                    directory: [
                        {
                            id: 'fraud',
                            label: 'Fraud line',
                            contact_id: 'missing-contact',
                            description: 'Trusted but not saved',
                        },
                    ],
                    contacts: [
                        { id: 'contact-1', displayName: 'Helpdesk', number: '+15550001111' },
                    ],
                    onBack: vi.fn(),
                    onAction,
                    onViewEntry,
                    phoneLocalNavItems: [
                        { id: 'history', label: 'History' },
                        { id: 'directory', label: 'Directory' },
                    ],
                    phoneActiveId: 'directory',
                    onPhoneNavSelect,
                }),
            );
        });

        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'History' }).props.onClick();
            renderer!.root.findByProps({ children: 'Fraud line' }).props.onClick();
        });

        expect(onPhoneNavSelect).toHaveBeenCalledWith('history');
        expect(onViewEntry).toHaveBeenCalledWith('fraud');
        const text = flattenText(renderer!.toJSON());
        expect(text).toContain('Trusted but not saved');
        expect(text).not.toContain('Call');

        await act(async () => {
            renderer!.root.findByProps({ children: 'Change' }).props.onClick();
        });
        expect(flattenText(renderer!.toJSON())).toContain('Fraud line');
        expect(onAction).not.toHaveBeenCalled();
    });
});
