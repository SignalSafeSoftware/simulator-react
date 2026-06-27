import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import SimulatorReachabilityReport from '../src/components/SimulatorReachabilityReport';
import BrowserPageRenderer from '../src/views/BrowserPageRenderer';
import ContactsView, {
    contactMatchesSearch,
    contextMatchesContact,
} from '../src/views/ContactsView';

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

describe('simulator UI hotspot coverage', () => {
    it('shows contact detail when initialSelectedContactId is set (title-only header optional)', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(ContactsView, {
                    contacts: [{ id: 'it-helpdesk', displayName: 'IT Helpdesk', number: '+1-555-012-3456' }],
                    onBack: vi.fn(),
                    initialSelectedContactId: 'it-helpdesk',
                    contactDetailTitleOnly: true,
                })
            );
        });
        const text = flattenText(renderer!.toJSON());
        expect(text).toContain('IT Helpdesk');
        expect(text).toContain('Number:');
        expect(text).toContain('+1-555-012-3456');
        expect(text).not.toContain('← Back');
    });

    it('covers contact search helpers and contacts view states', async () => {
        const contact = {
            id: 'c1',
            displayName: 'Ada Lovelace',
            number: '+1 (555) 0100',
            email: 'ada@example.test',
        };
        expect(contactMatchesSearch(contact, '')).toBe(true);
        expect(contactMatchesSearch(contact, 'Ada')).toBe(true);
        expect(contactMatchesSearch(contact, '0100')).toBe(true);
        expect(contactMatchesSearch(contact, 'example.test')).toBe(true);
        expect(contactMatchesSearch(contact, '!!!')).toBe(false);
        expect(contactMatchesSearch(contact, 'missing')).toBe(false);
        expect(contactMatchesSearch(contact, '   ')).toBe(false);
        expect(contactMatchesSearch({ ...contact, email: 'ADA@EXAMPLE.TEST' }, 'ADA@EXAMPLE.TEST')).toBe(true);

        expect(contextMatchesContact(contact, { number: '+15550100' })).toBe(true);
        expect(contextMatchesContact(contact, { name: 'ada lovelace' })).toBe(true);
        expect(contextMatchesContact(contact, { name: 'Grace Hopper', number: '+1999' })).toBe(false);
        expect(contextMatchesContact({ ...contact, number: undefined }, { number: '+15550100' })).toBe(false);

        const onBack = vi.fn();
        const onOpenContact = vi.fn();
        const onSearchSubmit = vi.fn();
        const onSearchChange = vi.fn();
        const onPhoneNavSelect = vi.fn();
        const onAddContact = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(ContactsView, {
                    contacts: null,
                    onBack,
                })
            );
        });
        expect(flattenText(renderer!.toJSON())).toContain('No contacts.');

        await act(async () => {
            renderer!.update(
                React.createElement(ContactsView, {
                    contacts: [
                        { id: 'c1', displayName: 'Ada Lovelace', number: '+15550100' },
                        { id: 'c2', displayName: 'Phish Sender', email: 'sender@example.test' },
                    ],
                    onBack,
                    onOpenContact,
                    onSearchSubmit,
                    phoneLocalNavItems: [{ id: 'history', label: 'History' }, { id: 'contacts', label: 'Contacts' }],
                    phoneActiveId: 'contacts',
                    onPhoneNavSelect,
                })
            );
        });
        expect(flattenText(renderer!.toJSON())).toContain('sender@example.test');

        await act(async () => {
            renderer!.root.findAllByType('button').find((node) => node.props['aria-label'] === 'History')!.props.onClick();
            renderer!.root.findAllByType('button').find((node) => node.props.className?.includes('border-top-0'))!.props.onClick();
        });
        expect(onPhoneNavSelect).toHaveBeenCalledWith('history');
        expect(onOpenContact).toHaveBeenCalledWith('c1');
        expect(flattenText(renderer!.toJSON())).toContain('Ada Lovelace');
        expect(flattenText(renderer!.toJSON())).toContain('Number:');

        await act(async () => {
            renderer!.update(
                React.createElement(ContactsView, {
                    contacts: [
                        { id: 'c2', displayName: 'Phish Sender', email: 'sender@example.test' },
                    ],
                    onBack,
                    onOpenContact,
                    searchQuery: 'zzz',
                    onSearchChange,
                    onSearchSubmit,
                    verificationContext: { name: 'Unknown Sender', number: '+1999' },
                    onAddContact,
                    title: 'Verify contact',
                })
            );
        });
        const searchInput = renderer!.root.findByProps({ 'aria-label': 'Search contacts' });
        await act(async () => {
            searchInput.props.onChange({ target: { value: 'Ada' } });
            searchInput.props.onKeyDown({ key: 'Enter', preventDefault: vi.fn() });
            renderer!.root.findByProps({ 'aria-label': 'Add contact' }).props.onClick();
        });
        expect(onSearchChange).toHaveBeenCalledWith('Ada');
        expect(onSearchSubmit).toHaveBeenCalledWith('zzz');
        expect(onAddContact).toHaveBeenCalledTimes(1);
        expect(flattenText(renderer!.toJSON())).toContain('No match in contacts for this number or name.');
        expect(flattenText(renderer!.toJSON())).toContain('No results for "zzz".');

        await act(async () => {
            renderer!.update(
                React.createElement(ContactsView, {
                    contacts: [
                        { id: 'c3', displayName: 'Saved Contact', email: 'saved@example.test' },
                    ],
                    onBack,
                    verificationContext: { name: 'Saved Contact' },
                })
            );
        });
        expect(flattenText(renderer!.toJSON())).toContain('Matches saved contact:');

        await act(async () => {
            renderer!.root.findAll((node) => typeof node.props.onClick === 'function')[0].props.onClick();
        });
        expect(flattenText(renderer!.toJSON())).toContain('Email:');

        await act(async () => {
            renderer!.update(
                React.createElement(ContactsView, {
                    contacts: [
                        { id: 'c4', displayName: 'Email Only', email: 'email-only@example.test' },
                        { id: 'c5', displayName: 'Numbered', number: '+15551230000' },
                    ],
                    onBack,
                    verificationContext: { name: 'Numbered', number: '+15551230000' },
                })
            );
        });
        expect(flattenText(renderer!.toJSON())).toContain('Matches saved contact:');
        expect(flattenText(renderer!.toJSON())).toContain('(+15551230000)');

        await act(async () => {
            renderer!.root.findAll(
                (node) => typeof node.props.onClick === 'function' && flattenText(node as never).includes('Numbered')
            )[0].props.onClick();
        });
        expect(flattenText(renderer!.toJSON())).toContain('Numbered');
        expect(flattenText(renderer!.toJSON())).toContain('Number:');
    });

    it('covers browser page renderer layout variants and fallback actions', async () => {
        const onAction = vi.fn();
        const onBack = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(BrowserPageRenderer, {
                    page: {
                        id: 'landing',
                        url: 'https://evil.example.test',
                        title: 'Landing',
                        layout: 'landing',
                        content: 'Enter your details',
                        logoUrl: 'https://example.test/logo.png',
                        formFields: [
                            { name: 'email', label: 'Email', type: 'email' },
                            { name: 'unknown', label: 'Unknown', type: 'weird' },
                        ],
                        buttons: [{ label: 'Continue', targetPageId: 'result' }],
                    },
                    onAction,
                    onBack,
                })
            );
        });
        expect(renderer!.root.findByType('img').props.src).toBe('https://example.test/logo.png');
        const highlighted = renderer!.root.findAll((node) => node.type === 'span' && node.props.style?.backgroundColor != null);
        expect(highlighted.length).toBeGreaterThan(0);
        await act(async () => {
            renderer!.root.findByType('form').props.onSubmit({ preventDefault: vi.fn() });
            renderer!.root.findByProps({ children: 'Continue' }).props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'submit_form' }));
        expect(onAction).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'click_link', href: 'https://evil.example.test', pageId: 'result' })
        );

        await act(async () => {
            renderer!.update(
                React.createElement(BrowserPageRenderer, {
                    page: {
                        id: 'content',
                        url: 'https://example.test/content',
                        title: 'Content',
                        layout: 'content',
                        content: 'Content body',
                        warningBanner: 'Suspicious page',
                        showMediaPlaceholder: true,
                    },
                    onAction,
                })
            );
        });
        expect(flattenText(renderer!.toJSON())).toContain('Suspicious page');
        expect(flattenText(renderer!.toJSON())).toContain('Content body');

        await act(async () => {
            renderer!.update(
                React.createElement(BrowserPageRenderer, {
                    page: {
                        id: 'download-label',
                        url: '',
                        title: '',
                        layout: 'download',
                        buttons: [{ label: 'Installer' }],
                    },
                    onAction,
                })
            );
        });
        expect(flattenText(renderer!.toJSON())).toContain('Web Page Title');
        await act(async () => {
            renderer!.root.findByProps({ children: 'Installer' }).props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'download_click', downloadTarget: 'Installer' }));

        await act(async () => {
            renderer!.update(
                React.createElement(BrowserPageRenderer, {
                    page: {
                        id: 'null-layout',
                        url: 'https://example.test/plain',
                        title: 'Plain',
                        layout: null as never,
                        content: 'Plain content',
                    },
                    onAction,
                })
            );
        });
        expect(flattenText(renderer!.toJSON())).toContain('Plain content');

        await act(async () => {
            renderer!.update(
                React.createElement(BrowserPageRenderer, {
                    page: {
                        id: 'login',
                        url: 'https://secure.example.test',
                        title: 'Secure',
                        layout: 'login',
                        content: 'Sign in',
                        formFields: [{ name: 'password', label: 'Password', type: 'password' }],
                    },
                    onAction,
                })
            );
        });
        await act(async () => {
            renderer!.root.findByType('form').props.onSubmit({ preventDefault: vi.fn() });
        });
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'submit_form' }));
        expect(renderer!.root.findAllByProps({ children: 'Cancel' })).toHaveLength(0);

        await act(async () => {
            renderer!.update(
                React.createElement(BrowserPageRenderer, {
                    page: {
                        id: 'landing',
                        url: 'https://sso.corporate-portal.com/',
                        title: 'Sign in again',
                        layout: 'centered',
                        formFields: [
                            { name: 'email', label: 'Work email', type: 'email' },
                            { name: 'password', label: 'Password', type: 'password' },
                        ],
                    },
                    onAction,
                })
            );
        });
        expect(flattenText(renderer!.toJSON())).toContain('Work email');
        expect(flattenText(renderer!.toJSON())).toContain('Password');

        await act(async () => {
            renderer!.update(
                React.createElement(BrowserPageRenderer, {
                    page: {
                        id: 'landing',
                        url: 'https://files.cloud-share.com/',
                        title: 'Shared file',
                        layout: 'split',
                        content: "You've been given access to a shared file. Sign in to view.",
                        formFields: [
                            { name: 'email', label: 'Email', type: 'email' },
                            { name: 'password', label: 'Password', type: 'password' },
                        ],
                    },
                    onAction,
                })
            );
        });
        expect(flattenText(renderer!.toJSON())).toContain('Email');
        expect(flattenText(renderer!.toJSON())).toContain('Password');

        await act(async () => {
            renderer!.update(
                React.createElement(BrowserPageRenderer, {
                    page: {
                        id: 'download-page',
                        url: 'https://example.test/file',
                        title: 'Download',
                        layout: 'download',
                        content: 'File download',
                    },
                    onAction,
                })
            );
        });
        await act(async () => {
            renderer!.root.findAllByType('button').find(
                (node) => node.props.children === 'Download' && node.props.className?.includes('simulator-btn--neutral-outline')
            )!.props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'download_click', downloadTarget: 'download-page' }));

        await act(async () => {
            renderer!.update(
                React.createElement(BrowserPageRenderer, {
                    page: {
                        id: 'result',
                        url: 'https://example.test/result',
                        title: 'Result',
                        layout: 'result',
                        content: 'Custom result message',
                    },
                    onAction,
                })
            );
        });
        expect(flattenText(renderer!.toJSON())).toContain('Custom result message');

        await act(async () => {
            renderer!.update(
                React.createElement(BrowserPageRenderer, {
                    page: {
                        id: 'fallback',
                        url: 'https://example.test/fallback',
                        title: 'Fallback',
                        layout: 'odd',
                        content: 'Fallback body',
                        warningBanner: 'Fallback warning',
                        buttons: [{ label: 'Open fallback' }],
                    },
                    onAction,
                    onBack,
                })
            );
        });
        await act(async () => {
            renderer!.root.findByProps({ children: 'Open fallback' }).props.onClick();
        });
        expect(flattenText(renderer!.toJSON())).toContain('Fallback warning');
        expect(onAction).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'click_link', href: 'https://example.test/fallback', pageId: undefined })
        );
    });

    it('covers reachability report empty, unreachable, cycle, and toggle states', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorReachabilityReport, {
                    report: {
                        entryApp: null,
                        reachableApps: [],
                        reachableScreens: {
                            email: [],
                            messages: [],
                            internet: [],
                            phone: [],
                            home: [],
                        },
                        reachableEntities: {
                            contacts: [],
                            inboxMessageIds: [],
                            browserPageIds: [],
                        },
                        unreachable: {
                            screens: [],
                            contacts: [],
                            inboxMessageIds: [],
                            browserPageIds: [],
                        },
                        browserHasCycle: false,
                    },
                })
            );
        });
        await act(async () => {
            renderer!.root.findByType('button').props.onClick();
        });
        expect(renderer!.root.findByType('button').props['aria-expanded']).toBe(true);
        expect(flattenText(renderer!.toJSON())).toContain('Entry app:');
        expect(flattenText(renderer!.toJSON())).toContain('Reachable apps:');

        await act(async () => {
            renderer!.update(
                React.createElement(SimulatorReachabilityReport, {
                    defaultExpanded: true,
                    report: {
                        entryApp: 'internet',
                        reachableApps: ['internet', 'email'],
                        reachableScreens: {
                            email: ['detail'],
                            messages: [],
                            internet: ['landing', 'pricing'],
                            phone: [],
                            home: [],
                        },
                        reachableEntities: {
                            contacts: ['c1'],
                            inboxMessageIds: ['m1'],
                            browserPageIds: ['landing'],
                        },
                        unreachable: {
                            screens: ['odd/screen', { app: 'email', screen: 'trash' } as never],
                            contacts: ['c2'],
                            inboxMessageIds: ['m2'],
                            browserPageIds: ['support'],
                        },
                        browserHasCycle: true,
                    },
                })
            );
        });
        const text = flattenText(renderer!.toJSON());
        expect(text).toContain('Reachability (5 unreachable)');
        expect(text).toContain('Reachable contacts');
        expect(text).toContain('Reachable inbox');
        expect(text).toContain('Reachable pages');
        expect(text).toContain('Screens: odd/screen, email/trash');
        expect(text).toContain('Contacts: c2');
        expect(text).toContain('Inbox: m2');
        expect(text).toContain('Pages: support');
        expect(text).toContain('Browser navigation has a cycle');
    });
});
