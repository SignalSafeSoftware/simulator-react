import React from 'react';
import type { ReactTestRenderer, ReactTestRendererJSON } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import BrowserPageRenderer from '../src/views/BrowserPageRenderer';
import BrowserSimulatorView from '../src/views/BrowserSimulatorView';
import DirectoryView from '../src/views/DirectoryView';
import EmailComposeView from '../src/views/EmailComposeView';
import EmailSimulatorView from '../src/views/EmailSimulatorView';
import HomeSimulatorView from '../src/views/HomeSimulatorView';
import MessagesNewThreadView from '../src/views/MessagesNewThreadView';
import PhoneIncomingScene from '../src/views/PhoneIncomingScene';

import { TestRenderer, act } from './reactTestRenderer';

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

describe('simulator view coverage', () => {
    it('covers browser simulator states and page renderer variants', async () => {
        const onAction = vi.fn();
        const onBack = vi.fn();

        let renderer = TestRenderer.create(
            React.createElement(BrowserSimulatorView, {
                payload: null,
                screen: 'landing',
                onAction,
            })
        );
        expect(flattenText(renderer.toJSON())).toContain('No browser for this scenario.');

        await act(async () => {
            renderer.update(
                React.createElement(BrowserSimulatorView, {
                    payload: { pages: [], defaultPageId: 'landing' },
                    screen: 'landing',
                    onAction,
                })
            );
        });
        expect(flattenText(renderer.toJSON())).toContain('No pages for this site.');

        await act(async () => {
            renderer.update(
                React.createElement(BrowserSimulatorView, {
                    payload: {
                        defaultPageId: 'landing',
                        pages: [
                            {
                                id: 'landing',
                                url: 'https://phish.example.test',
                                title: 'Landing',
                                layout: 'content',
                                content: 'Read this first',
                                warningBanner: 'Warning',
                                showMediaPlaceholder: true,
                                buttons: [{ label: 'Continue', href: 'https://phish.example.test/next', targetPageId: 'next' }],
                            },
                        ],
                    },
                    screen: 'landing',
                    stack: ['previous'],
                    onAction,
                    onBack,
                })
            );
        });
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'open_page', pageId: 'landing' }));
        const browserRoot = renderer.root;
        await act(async () => {
            browserRoot.findByProps({ children: 'Continue' }).props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'click_link', href: 'https://phish.example.test/next', linkIndex: 0, pageId: 'next' })
        );

        const callsAfterFirstOpen = onAction.mock.calls.length;
        await act(async () => {
            renderer.update(
                React.createElement(BrowserSimulatorView, {
                    payload: {
                        defaultPageId: 'landing',
                        pages: [
                            {
                                id: 'landing',
                                url: 'https://phish.example.test',
                                title: 'Landing',
                                layout: 'content',
                                content: 'Read this first',
                            },
                        ],
                    },
                    screen: 'landing',
                    onAction,
                })
            );
        });
        expect(onAction.mock.calls.length).toBe(callsAfterFirstOpen);

        await act(async () => {
            renderer.update(
                React.createElement(BrowserSimulatorView, {
                    payload: {
                        defaultPageId: 'landing',
                        pages: [
                            {
                                id: 'landing',
                                url: 'https://fallback.example.test',
                                title: 'Fallback Landing',
                                layout: 'content',
                                content: 'Fallback content',
                            },
                        ],
                    },
                    screen: 'missing-page',
                    onAction,
                })
            );
        });
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'open_page', pageId: 'landing' }));

        let pageRenderer: ReactTestRenderer | null = null;
        await act(async () => {
            pageRenderer = TestRenderer.create(
                React.createElement(BrowserPageRenderer, {
                    page: {
                        id: 'login',
                        url: 'https://secure.example.test/login',
                        title: 'Secure Login',
                        layout: 'login',
                        content: 'Sign in',
                        formFields: [
                            { name: 'email', label: 'Email', type: 'email' },
                            { name: 'password', label: 'Password', type: 'password' },
                        ],
                    },
                    onAction,
                    onBack,
                })
            );
        });
        await act(async () => {
            pageRenderer!.root.findByProps({ type: 'submit' }).props.onClick?.();
            pageRenderer!.root.findByProps({ children: 'Cancel' }).props.onClick();
        });
        expect(onBack).toHaveBeenCalled();

        await act(async () => {
            pageRenderer!.update(
                React.createElement(BrowserPageRenderer, {
                    page: {
                        id: 'download',
                        url: 'https://files.example.test/download',
                        title: 'Download',
                        layout: 'download',
                        content: 'Download now',
                        buttons: [{ label: 'Installer', href: '/installer.exe' }],
                        warningBanner: 'Verify the source',
                        showMediaPlaceholder: true,
                    },
                    onAction,
                })
            );
        });
        await act(async () => {
            pageRenderer!.root.findByProps({ children: 'Installer' }).props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'download_click', downloadTarget: '/installer.exe' }));

        await act(async () => {
            pageRenderer!.update(
                React.createElement(BrowserPageRenderer, {
                    page: {
                        id: 'fallback',
                        url: 'https://odd.example.test',
                        title: 'Odd',
                        layout: 'weird-layout',
                        content: 'Fallback page',
                        buttons: [{ label: 'Open', href: '/open', targetPageId: 'odd-target' }],
                    },
                    onAction,
                })
            );
        });
        await act(async () => {
            pageRenderer!.root.findByProps({ children: 'Open' }).props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'click_link', href: '/open', linkIndex: 0, pageId: 'odd-target' })
        );

        await act(async () => {
            pageRenderer!.update(
                React.createElement(BrowserPageRenderer, {
                    page: {
                        id: 'result',
                        url: 'https://secure.example.test/result',
                        title: 'Done',
                        layout: 'result',
                    },
                    onAction,
                })
            );
        });
        expect(flattenText(pageRenderer!.toJSON())).toContain('Simulation complete.');
    });

    it('covers email simulator list, detail fallback, and compose flows', async () => {
        const onAction = vi.fn();
        const onSelectMessage = vi.fn();
        const onBack = vi.fn();
        const onNavigate = vi.fn();
        let renderer: ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(EmailSimulatorView, {
                    payload: {
                        inbox: [{ id: 'm1', subject: 'Inbox subject', from: 'inbox@example.test', snippet: 'Inbox snippet' }],
                        outbox: [{ id: 'm2', subject: 'Outbox subject', from: 'outbox@example.test' }],
                        trash: [{ id: 'm3', subject: 'Trash subject', from: 'trash@example.test' }],
                        selectedMessage: null,
                        selectedMessageId: null,
                    },
                    screen: 'list',
                    selectedMessageId: null,
                    onAction,
                    onSelectMessage,
                    onBack,
                    onNavigate,
                })
            );
        });
        expect(flattenText(renderer!.toJSON())).toContain('Inbox snippet');

        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Compose email' }).props.onClick();
        });
        expect(onNavigate).toHaveBeenCalledWith('compose');

        await act(async () => {
            renderer!.update(
                React.createElement(EmailSimulatorView, {
                    payload: {
                        inbox: [{ id: 'm1', subject: 'Inbox subject', from: 'inbox@example.test', snippet: 'Inbox snippet' }],
                        outbox: [{ id: 'm2', subject: 'Outbox subject', from: 'outbox@example.test' }],
                        trash: [{ id: 'm3', subject: 'Trash subject', from: 'trash@example.test' }],
                        selectedMessage: null,
                        selectedMessageId: null,
                    },
                    screen: 'detail',
                    selectedMessageId: 'm1',
                    onAction,
                    onSelectMessage,
                    onBack,
                    onNavigate,
                })
            );
        });
        expect(renderer!.root.findByProps({ 'aria-label': 'Body' }).props.value).toBe('Inbox snippet');

        await act(async () => {
            renderer!.update(
                React.createElement(EmailSimulatorView, {
                    payload: {
                        inbox: [],
                        outbox: [],
                        trash: [],
                        selectedMessage: {
                            subject: 'Detail subject',
                            from: 'detail@example.test',
                            body: 'Body text',
                            links: [{ href: 'https://detail.example.test', text: 'Open detail' }],
                            attachment_name: 'invoice.pdf',
                            attachment_type: 'pdf',
                        },
                        selectedMessageId: 'detail-1',
                    },
                    screen: 'detail',
                    selectedMessageId: 'detail-1',
                    onAction,
                    onSelectMessage,
                    onBack,
                    onNavigate,
                })
            );
        });
        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Open detail' }).props.onClick();
            renderer!.root.findByProps({ 'aria-label': 'Open attachment' }).props.onClick();
            renderer!.root.findByProps({ 'aria-label': 'Download attachment' }).props.onClick();
            renderer!.root.findByProps({ 'aria-label': 'Reply' }).props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'click_link' }));
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'open_attachment' }));
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'download_attachment' }));
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'send_reply' }));

        await act(async () => {
            renderer!.update(
                React.createElement(EmailSimulatorView, {
                    payload: null,
                    screen: 'compose',
                    selectedMessageId: null,
                    onAction,
                    onSelectMessage,
                    onBack,
                    onNavigate,
                })
            );
        });
        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Send' }).props.onClick();
        });
        expect(onBack).toHaveBeenCalled();

        await act(async () => {
            renderer!.update(
                React.createElement(EmailSimulatorView, {
                    payload: {
                        inbox: [{ id: 'm1', subject: 'Inbox subject', from: 'inbox@example.test', snippet: 'Inbox snippet' }],
                        outbox: [{ id: 'm2', subject: 'Outbox subject', from: 'outbox@example.test', snippet: 'Outbox snippet' }],
                        trash: [],
                        selectedMessage: null,
                        selectedMessageId: null,
                    },
                    screen: 'outbox',
                    selectedMessageId: null,
                    onAction,
                    onSelectMessage,
                    onBack,
                    onNavigate,
                })
            );
        });
        expect(flattenText(renderer!.toJSON())).toContain('Outbox snippet');
        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Compose email' }).props.onClick();
            renderer!.root.findByProps({ 'aria-label': 'Trash' }).props.onClick();
            renderer!.root.findByProps({ 'aria-label': 'Back' }).props.onClick();
        });
        expect(onNavigate).toHaveBeenCalledWith('compose');
        expect(onNavigate).toHaveBeenCalledWith('trash');
        expect(onBack).toHaveBeenCalled();

        await act(async () => {
            renderer!.update(
                React.createElement(EmailSimulatorView, {
                    payload: {
                        inbox: [],
                        outbox: [],
                        trash: [],
                        selectedMessage: null,
                        selectedMessageId: null,
                    },
                    screen: 'trash',
                    selectedMessageId: null,
                    onAction,
                    onSelectMessage,
                    onBack,
                    onNavigate,
                })
            );
        });
        expect(flattenText(renderer!.toJSON())).toContain('No emails in Trash.');

        await act(async () => {
            renderer!.update(
                React.createElement(EmailSimulatorView, {
                    payload: {
                        inbox: [{ id: 'm1', subject: 'Inbox subject', from: 'inbox@example.test', snippet: 'Inbox snippet' }],
                        outbox: [],
                        trash: [],
                        selectedMessage: null,
                        selectedMessageId: null,
                    },
                    screen: 'detail',
                    selectedMessageId: 'missing-message',
                    onAction,
                    onSelectMessage,
                    onBack,
                    onNavigate,
                })
            );
        });
        expect(flattenText(renderer!.toJSON())).toContain('Inbox snippet');

        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Compose email' }).props.onClick();
        });
        expect(onNavigate).toHaveBeenCalledWith('compose');

        await act(async () => {
            renderer!.update(
                React.createElement(EmailSimulatorView, {
                    payload: {
                        inbox: [],
                        outbox: [{ id: 'm2', subject: 'Outbox subject', from: 'outbox@example.test' }],
                        trash: [],
                        selectedMessage: null,
                        selectedMessageId: null,
                    },
                    screen: 'detail',
                    selectedMessageId: 'm2',
                    onAction,
                    onSelectMessage,
                    onBack,
                    onNavigate,
                })
            );
        });
        expect(renderer!.root.findByProps({ 'aria-label': 'Body' }).props.value).toBe('');
    });

    it('covers standalone compose, new-thread, and incoming-call views', async () => {
        const onCancel = vi.fn();
        const onSend = vi.fn();
        let composeRenderer: ReactTestRenderer | null = null;
        await act(async () => {
            composeRenderer = TestRenderer.create(
                React.createElement(EmailComposeView, {
                    onSend,
                    onCancel,
                })
            );
        });
        await act(async () => {
            composeRenderer!.root.findByProps({ 'aria-label': 'Recipient' }).props.onChange({ target: { value: ' user@example.test ' } });
            composeRenderer!.root.findByProps({ 'aria-label': 'Subject' }).props.onChange({ target: { value: ' Subject ' } });
            composeRenderer!.root.findByProps({ 'aria-label': 'Body' }).props.onChange({ target: { value: ' Body ' } });
            composeRenderer!.root.findByProps({ 'aria-label': 'Send' }).props.onClick();
        });
        expect(onSend).toHaveBeenCalledWith(expect.objectContaining({ to: expect.any(String), subject: expect.any(String), body: expect.any(String) }));
        expect(onCancel).toHaveBeenCalled();

        const onBack = vi.fn();
        let threadRenderer: ReactTestRenderer | null = null;
        await act(async () => {
            threadRenderer = TestRenderer.create(
                React.createElement(MessagesNewThreadView, { onBack })
            );
        });
        const threadInputs = threadRenderer!.root.findAllByType('input');
        await act(async () => {
            threadInputs[0].props.onChange({ target: { value: '+15551230000' } });
            threadRenderer!.root.findByProps({ 'aria-label': 'Message body' }).props.onChange({ target: { value: 'Hello' } });
            threadRenderer!.root.findByProps({ 'aria-label': 'Send' }).props.onClick();
            threadRenderer!.root.findByProps({ 'aria-label': 'Cancel' }).props.onClick();
        });
        expect(onBack).toHaveBeenCalledTimes(2);

        const onAnswer = vi.fn();
        const onIgnore = vi.fn();
        let incomingRenderer: ReactTestRenderer | null = null;
        await act(async () => {
            incomingRenderer = TestRenderer.create(
                React.createElement(PhoneIncomingScene, {
                    content: {
                        transcript: 'Incoming call.',
                        choices: [],
                        phone_number: '+15550000000',
                        caller_name: 'Security Team',
                        caller_title: 'urgent',
                        avatar_url: 'https://example.test/avatar.png',
                    },
                    onAnswer,
                    onIgnore,
                })
            );
        });
        await act(async () => {
            incomingRenderer!.root.findByProps({ 'aria-label': 'Answer' }).props.onClick();
            incomingRenderer!.root.findByProps({ 'aria-label': 'Ignore' }).props.onClick();
        });
        expect(onAnswer).toHaveBeenCalledTimes(1);
        expect(onIgnore).toHaveBeenCalledTimes(1);

        await act(async () => {
            incomingRenderer!.update(
                React.createElement(PhoneIncomingScene, {
                    content: {
                        transcript: 'Incoming call.',
                        choices: [],
                        urgency: 'urgent',
                    } as never,
                    onAnswer,
                    onIgnore,
                })
            );
        });
        expect(flattenText(incomingRenderer!.toJSON())).toContain('Unknown calling (URGENT)');
        expect(flattenText(incomingRenderer!.toJSON())).toContain('+1 555 000-0000');
    });

    it('shows directory entry detail when initialSelectedDirectoryId is set', async () => {
        let directoryRenderer: ReactTestRenderer | null = null;
        await act(async () => {
            directoryRenderer = TestRenderer.create(
                React.createElement(DirectoryView, {
                    directory: [
                        { id: 'helpdesk', label: 'IT Helpdesk', number: '+15550123456', description: 'Password resets.' },
                    ],
                    contacts: null,
                    onBack: vi.fn(),
                    onAction: vi.fn(),
                    initialSelectedDirectoryId: 'helpdesk',
                })
            );
        });
        const tree = directoryRenderer!.toJSON();
        expect(flattenText(tree)).toContain('IT Helpdesk');
        expect(flattenText(tree)).toContain('Password resets.');
        expect(flattenText(tree)).toContain('Change');
    });

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
                })
            );
        });
        expect(flattenText(directoryRenderer!.toJSON())).toContain('No directory for this scenario.');

        await act(async () => {
            directoryRenderer!.update(
                React.createElement(DirectoryView, {
                    directory: [
                        { id: 'helpdesk', label: 'Helpdesk', contact_id: 'contact-1', description: 'Trusted number' },
                        { id: 'bank', label: 'Bank', number: '+1555010101', url: 'https://bank.example.test' },
                    ],
                    contacts: [{ id: 'contact-1', displayName: 'Helpdesk', number: '+15550001111' }],
                    onBack: vi.fn(),
                    onAction,
                    onViewEntry,
                })
            );
        });
        await act(async () => {
            directoryRenderer!.root.findByProps({ children: 'Helpdesk' }).props.onClick();
        });
        expect(onViewEntry).toHaveBeenCalledWith('helpdesk');
        await act(async () => {
            directoryRenderer!.root.findByProps({ children: 'Call' }).props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'open_contact', contactId: 'contact-1' }));

        await act(async () => {
            directoryRenderer!.update(
                React.createElement(DirectoryView, {
                    directory: [
                        { id: 'bank', label: 'Bank', number: '+1555010101', url: 'https://bank.example.test' },
                    ],
                    contacts: [{ id: 'contact-1', displayName: 'Helpdesk', number: '+15550001111' }],
                    onBack: vi.fn(),
                    onAction,
                    onViewEntry,
                })
            );
        });
        await act(async () => {
            directoryRenderer!.root.findAll((node) => typeof node.props.onClick === 'function')[0].props.onClick();
        });
        await act(async () => {
            directoryRenderer!.root.findByProps({ children: 'Call' }).props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'dial_phone', dialedNumber: '+1555010101' }));
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
                })
            );
        });
        expect(flattenText(homeRenderer!.toJSON())).toContain('News');
        await act(async () => {
            homeRenderer!.root.findByProps({ 'aria-label': 'Search' }).props.onKeyDown({
                key: 'Enter',
                preventDefault: vi.fn(),
            });
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
                })
            );
        });
        await act(async () => {
            homeRenderer!.root.findByProps({ 'aria-label': 'Search store' }).props.onChange({ target: { value: 'zzz' } });
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
                })
            );
        });
        await act(async () => {
            homeRenderer!.root.findByProps({ 'aria-label': 'Download Security App' }).props.onClick();
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
                })
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
                })
            );
        });
        expect(flattenText(homeRenderer!.toJSON())).toContain('General');
        await act(async () => {
            homeRenderer!.root.findByProps({ 'aria-label': 'Search settings' }).props.onKeyDown({
                key: 'Enter',
                preventDefault: vi.fn(),
            });
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
                })
            );
        });
        expect(flattenText(homeRenderer!.toJSON())).toContain('No content on home.');

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
                })
            );
        });
        expect(flattenText(homeRenderer!.toJSON())).toContain('No settings.');
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
                    contacts: [{ id: 'contact-1', displayName: 'Helpdesk', number: '+15550001111' }],
                    onBack: vi.fn(),
                    onAction,
                    onViewEntry,
                    phoneLocalNavItems: [
                        { id: 'history', label: 'History' },
                        { id: 'directory', label: 'Directory' },
                    ],
                    phoneActiveId: 'directory',
                    onPhoneNavSelect,
                })
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
