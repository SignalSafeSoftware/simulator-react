import React from 'react';
import type { ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import BrowserPageRenderer from '../src/views/browser/BrowserPageRenderer';
import BrowserSimulatorView from '../src/views/browser/BrowserSimulatorView';
import EmailSimulatorView from '../src/views/email/EmailSimulatorView';
import { TestRenderer, act } from './reactTestRenderer';
import { flattenText } from './support/viewCoverageSupport';

describe('browser and email views', () => {
    it('covers browser simulator states and page renderer variants', async () => {
        const onAction = vi.fn();
        const onBack = vi.fn();

        const renderer = TestRenderer.create(
            React.createElement(BrowserSimulatorView, {
                payload: null,
                screen: 'landing',
                onAction,
            }),
        );
        expect(flattenText(renderer.toJSON())).toContain('No browser for this scenario.');

        await act(async () => {
            renderer.update(
                React.createElement(BrowserSimulatorView, {
                    payload: { pages: [], defaultPageId: 'landing' },
                    screen: 'landing',
                    onAction,
                }),
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
                                buttons: [
                                    {
                                        label: 'Continue',
                                        href: 'https://phish.example.test/next',
                                        targetPageId: 'next',
                                    },
                                ],
                            },
                        ],
                    },
                    screen: 'landing',
                    stack: ['previous'],
                    onAction,
                    onBack,
                }),
            );
        });
        expect(onAction).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'open_page', pageId: 'landing' }),
        );
        const browserRoot = renderer.root;
        await act(async () => {
            browserRoot.findByProps({ children: 'Continue' }).props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'click_link',
                href: 'https://phish.example.test/next',
                linkIndex: 0,
                pageId: 'next',
            }),
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
                }),
            );
        });
        expect(onAction.mock.calls).toHaveLength(callsAfterFirstOpen);

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
                }),
            );
        });
        expect(onAction).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'open_page', pageId: 'landing' }),
        );

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
                }),
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
                }),
            );
        });
        await act(async () => {
            pageRenderer!.root.findByProps({ children: 'Installer' }).props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'download_click', downloadTarget: '/installer.exe' }),
        );

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
                }),
            );
        });
        await act(async () => {
            pageRenderer!.root.findByProps({ children: 'Open' }).props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'click_link',
                href: '/open',
                linkIndex: 0,
                pageId: 'odd-target',
            }),
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
                }),
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
                        inbox: [
                            {
                                id: 'm1',
                                subject: 'Inbox subject',
                                from: 'inbox@example.test',
                                snippet: 'Inbox snippet',
                            },
                        ],
                        outbox: [
                            { id: 'm2', subject: 'Outbox subject', from: 'outbox@example.test' },
                        ],
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
                }),
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
                        inbox: [
                            {
                                id: 'm1',
                                subject: 'Inbox subject',
                                from: 'inbox@example.test',
                                snippet: 'Inbox snippet',
                            },
                        ],
                        outbox: [
                            { id: 'm2', subject: 'Outbox subject', from: 'outbox@example.test' },
                        ],
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
                }),
            );
        });
        expect(renderer!.root.findByProps({ 'aria-label': 'Body' }).props.value).toBe(
            'Inbox snippet',
        );

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
                }),
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
        expect(onAction).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'download_attachment' }),
        );
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
                }),
            );
        });
        expect(renderer!.root.findByProps({ 'aria-label': 'Send' }).props.disabled).toBe(true);
        onBack.mockClear();
        await act(async () => {
            renderer!.root.findByType('form').props.onSubmit({ preventDefault() {} });
        });
        expect(onBack).not.toHaveBeenCalled();
        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Cancel' }).props.onClick();
        });
        expect(onBack).toHaveBeenCalledOnce();

        await act(async () => {
            renderer!.update(
                React.createElement(EmailSimulatorView, {
                    payload: {
                        inbox: [
                            {
                                id: 'm1',
                                subject: 'Inbox subject',
                                from: 'inbox@example.test',
                                snippet: 'Inbox snippet',
                            },
                        ],
                        outbox: [
                            {
                                id: 'm2',
                                subject: 'Outbox subject',
                                from: 'outbox@example.test',
                                snippet: 'Outbox snippet',
                            },
                        ],
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
                }),
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
                }),
            );
        });
        expect(flattenText(renderer!.toJSON())).toContain('No emails in Trash.');

        await act(async () => {
            renderer!.update(
                React.createElement(EmailSimulatorView, {
                    payload: {
                        inbox: [
                            {
                                id: 'm1',
                                subject: 'Inbox subject',
                                from: 'inbox@example.test',
                                snippet: 'Inbox snippet',
                            },
                        ],
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
                }),
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
                        outbox: [
                            { id: 'm2', subject: 'Outbox subject', from: 'outbox@example.test' },
                        ],
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
                }),
            );
        });
        expect(renderer!.root.findByProps({ 'aria-label': 'Body' }).props.value).toBe('');
    });
});
