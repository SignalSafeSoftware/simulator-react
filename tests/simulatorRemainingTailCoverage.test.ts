import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    appToChannel,
    mapContacts,
    mapDevice,
    mapEmail,
    mapHome,
    mapInternet,
    mapMessages,
    mapPhone,
} from '../src/adapters/fullDeviceToSession';
import SimulatorErrorBoundary from '../src/SimulatorErrorBoundary';
import SimulatorLintBanner from '../src/components/SimulatorLintBanner';
import {
    SimulatorList,
    SimulatorListItem,
    SimulatorListUnreadDot,
} from '../src/components/SimulatorList';
import {
    getSimulatorActionCategory,
    isSimulatorActionType,
    SIMULATOR_ACTION_CATEGORY,
    validateSimulatorAction,
} from '../src/utils/simulatorActionTaxonomy';
import {
    focusSimulatorSearch,
    handleSimulatorKeyboard,
    isTypingTarget,
    SIMULATOR_LIST_NAV_EVENT,
} from '../src/utils/simulatorKeyboardCommands';

import { TestRenderer, act } from './reactTestRenderer';

const originalArgv = [...process.argv];
const originalCwd = process.cwd();
const originalDocument = globalThis.document;
const originalCustomEvent = (globalThis as { CustomEvent?: unknown }).CustomEvent;
const originalHTMLElement = (globalThis as { HTMLElement?: unknown }).HTMLElement;

async function importFixNodeScript() {
    vi.resetModules();
    return import('../scripts/fix-node-esm-relative-imports.ts');
}

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

afterEach(() => {
    process.argv = [...originalArgv];
    process.chdir(originalCwd);
    (globalThis as { document?: Document }).document = originalDocument;
    (globalThis as { CustomEvent?: unknown }).CustomEvent = originalCustomEvent;
    (globalThis as { HTMLElement?: unknown }).HTMLElement = originalHTMLElement;
    vi.restoreAllMocks();
});

describe('remaining tail coverage', () => {
    it('covers the ESM relative import fixer script success and error paths', async () => {
        const dir = mkdtempSync(path.join(tmpdir(), 'simreact-esm-'));
        const nestedDir = path.join(dir, 'nested');
        const indexDir = path.join(dir, 'utils');
        const { mkdirSync } = await import('node:fs');
        mkdirSync(nestedDir, { recursive: true });
        mkdirSync(indexDir, { recursive: true });
        writeFileSync(path.join(indexDir, 'index.js'), 'export const value = 1;\n');
        writeFileSync(path.join(dir, 'helper.js'), 'export const helper = 1;\n');
        writeFileSync(path.join(dir, 'entry.js'), 'import { helper } from "./helper";\nimport "./utils";\nconsole.log(helper);\n');
        writeFileSync(path.join(nestedDir, 'types.d.ts'), 'export * from "../helper";\n');

        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        process.argv = ['node', 'fix-node-esm-relative-imports.ts', dir];
        await importFixNodeScript();

        const updatedEntry = readFileSync(path.join(dir, 'entry.js'), 'utf8');
        const updatedTypes = readFileSync(path.join(nestedDir, 'types.d.ts'), 'utf8');
        expect(updatedEntry).toContain('./helper.js');
        expect(updatedEntry).toContain('./utils/index.js');
        expect(updatedTypes).toContain('../helper.js');
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('updated 2 file(s)'));

        process.argv = ['node', 'fix-node-esm-relative-imports.ts'];
        await expect(importFixNodeScript()).rejects.toThrow('Usage: tsx scripts/fix-node-esm-relative-imports.ts <dist-dir>');

        process.argv = ['node', 'fix-node-esm-relative-imports.ts', 'does-not-exist'];
        await expect(importFixNodeScript()).rejects.toThrow('Target dist directory does not exist');

        rmSync(dir, { recursive: true, force: true });
    });

    it('covers keyboard helpers, typing guards, and search focus', () => {
        class FakeHTMLElement {
            tagName = 'DIV';
            isContentEditable = false;
            roleValue: string | null = null;
            focus = vi.fn();
            getAttribute(name: string): string | null {
                return name === 'role' ? this.roleValue : null;
            }
        }
        (globalThis as { HTMLElement?: unknown }).HTMLElement = FakeHTMLElement;
        const dispatchEvent = vi.fn();
        const querySelector = vi.fn(() => new FakeHTMLElement());
        (globalThis as { document?: unknown }).document = {
            dispatchEvent,
            querySelector,
        } as never;
        (globalThis as { CustomEvent?: unknown }).CustomEvent = class {
            type: string;
            detail: unknown;
            constructor(type: string, init?: { detail?: unknown }) {
                this.type = type;
                this.detail = init?.detail;
            }
        };

        const input = new FakeHTMLElement();
        input.tagName = 'INPUT';
        const textarea = new FakeHTMLElement();
        textarea.tagName = 'TEXTAREA';
        const textbox = new FakeHTMLElement();
        textbox.roleValue = 'textbox';
        const searchbox = new FakeHTMLElement();
        searchbox.roleValue = 'searchbox';
        const contentEditable = new FakeHTMLElement();
        contentEditable.isContentEditable = true;

        expect(isTypingTarget(input as never)).toBe(true);
        expect(isTypingTarget(textarea as never)).toBe(true);
        expect(isTypingTarget(textbox as never)).toBe(true);
        expect(isTypingTarget(searchbox as never)).toBe(true);
        expect(isTypingTarget(contentEditable as never)).toBe(true);
        expect(isTypingTarget(new FakeHTMLElement() as never)).toBe(false);

        const onBack = vi.fn();
        const onSwitchApp = vi.fn();
        const onFocusSearch = vi.fn();
        const onListNav = vi.fn();
        const altDown = {
            key: 'ArrowDown',
            altKey: true,
            ctrlKey: false,
            metaKey: false,
            target: null,
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;
        const altUp = {
            key: 'ArrowUp',
            altKey: true,
            ctrlKey: false,
            metaKey: false,
            target: null,
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;
        const blocked = {
            key: '1',
            altKey: true,
            ctrlKey: true,
            metaKey: false,
            target: null,
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;

        expect(
            handleSimulatorKeyboard(
                altDown,
                { onBack, onSwitchApp, onFocusSearch, onListNav },
                { activeApp: 'email', activeScreen: 'list' }
            )
        ).toEqual({ handled: true });
        expect(onListNav).toHaveBeenCalledWith('next');

        expect(
            handleSimulatorKeyboard(
                altUp,
                { onBack, onSwitchApp, onFocusSearch },
                { activeApp: 'email', activeScreen: 'list' }
            )
        ).toEqual({ handled: true });
        expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: SIMULATOR_LIST_NAV_EVENT }));

        expect(
            handleSimulatorKeyboard(
                blocked,
                { onBack, onSwitchApp, onFocusSearch },
                { activeApp: 'email', activeScreen: 'list' }
            )
        ).toEqual({ handled: false });

        const escapeEvent = {
            key: 'Escape',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            target: null,
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;
        expect(
            handleSimulatorKeyboard(
                escapeEvent,
                { onBack, onSwitchApp, onFocusSearch },
                { activeApp: 'email', activeScreen: 'list' }
            )
        ).toEqual({ handled: true });
        expect(onBack).toHaveBeenCalledTimes(1);

        const switchEvent = {
            key: '4',
            altKey: true,
            ctrlKey: false,
            metaKey: false,
            target: null,
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;
        expect(
            handleSimulatorKeyboard(
                switchEvent,
                { onBack, onSwitchApp, onFocusSearch },
                { activeApp: 'email', activeScreen: 'list' }
            )
        ).toEqual({ handled: true });
        expect(onSwitchApp).toHaveBeenCalledWith('messages');

        const searchEvent = {
            key: '/',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            target: null,
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;
        expect(
            handleSimulatorKeyboard(
                searchEvent,
                { onBack, onSwitchApp, onFocusSearch },
                { activeApp: 'phone', activeScreen: 'contacts' }
            )
        ).toEqual({ handled: true });
        expect(onFocusSearch).toHaveBeenCalledTimes(1);

        const helpEvent = {
            key: '?',
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            target: null,
            preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;
        expect(
            handleSimulatorKeyboard(
                helpEvent,
                { onBack, onSwitchApp, onFocusSearch },
                { activeApp: 'email', activeScreen: 'list' }
            )
        ).toEqual({ handled: true, showHelp: true });

        focusSimulatorSearch();
        expect(querySelector).toHaveBeenCalledWith('[data-simulator-search]');
    });

    it('covers simulator error boundary fallback rendering and retry', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const onRetry = vi.fn();
        const Boom = () => {
            throw new Error('Boom');
        };

        let renderer: TestRenderer.ReactTestRenderer | null = null;
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(
                    SimulatorErrorBoundary,
                    { fallbackTitle: 'Custom error', onRetry },
                    React.createElement(Boom)
                )
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
        let bannerRenderer: TestRenderer.ReactTestRenderer | null = null;
        await act(async () => {
            bannerRenderer = TestRenderer.create(
                React.createElement(SimulatorLintBanner, {
                    warnings: [
                        { code: 'one', message: 'First warning', path: 'entry_point' },
                        { code: 'two', message: 'Second warning' },
                    ],
                })
            );
        });
        expect(flattenText(bannerRenderer!.toJSON())).toContain('Template suggestions (2)');
        await act(async () => {
            bannerRenderer!.root.findByType('button').props.onClick();
        });
        expect(bannerRenderer!.root.findByProps({ 'data-testid': 'simulator-lint-banner' })).toBeTruthy();

        let emptyBanner: TestRenderer.ReactTestRenderer | null = null;
        await act(async () => {
            emptyBanner = TestRenderer.create(
                React.createElement(SimulatorLintBanner, {
                    warnings: [],
                })
            );
        });
        expect(emptyBanner!.toJSON()).toBeNull();

        let listRenderer: TestRenderer.ReactTestRenderer | null = null;
        await act(async () => {
            listRenderer = TestRenderer.create(
                React.createElement(
                    SimulatorList,
                    { className: 'extra' },
                    React.createElement(
                        SimulatorListItem,
                        { onClick: vi.fn(), active: true, variant: 'compact', className: 'row-extra' },
                        React.createElement(SimulatorListUnreadDot)
                    )
                )
            );
        });
        expect(listRenderer!.root.findByType('ul').props.className).toContain('extra');
        expect(listRenderer!.root.findByType('li').props.className).toContain('row-extra');
        expect(listRenderer!.root.findByType('span').props['aria-hidden']).toBe(true);
    });

    it('covers simulator action taxonomy helpers and remaining adapter branches', () => {
        expect(getSimulatorActionCategory('open_store')).toBe(SIMULATOR_ACTION_CATEGORY.HOME_NAVIGATION);
        expect(isSimulatorActionType('open_email')).toBe(true);
        expect(isSimulatorActionType('not-real')).toBe(false);
        expect(validateSimulatorAction({ type: 7 })).toBe(false);
        expect(validateSimulatorAction({ type: 'navigate_screen', app: 'email', screen: 'list' })).toBe(true);
        expect(validateSimulatorAction({ type: 'open_app', app: 'internet' })).toBe(true);
        expect(validateSimulatorAction({ type: 'open_contact' })).toBe(false);
        expect(validateSimulatorAction({ type: 'open_thread', threadId: 't1' })).toBe(true);
        expect(validateSimulatorAction({ type: 'open_thread' })).toBe(false);
        expect(validateSimulatorAction({ type: 'open_email', messageId: 'm1' })).toBe(true);
        expect(validateSimulatorAction({ type: 'open_email' })).toBe(false);
        expect(validateSimulatorAction({ type: 'open_page', pageId: 'landing' })).toBe(true);
        expect(validateSimulatorAction({ type: 'open_page' })).toBe(false);
        expect(validateSimulatorAction({ type: 'view_directory_entry', entryId: 'd1' })).toBe(true);
        expect(validateSimulatorAction({ type: 'view_directory_entry' })).toBe(false);
        expect(validateSimulatorAction({ type: 'switch_channel', channel: 'email' })).toBe(true);
        expect(validateSimulatorAction({ type: 'switch_channel' })).toBe(false);
        expect(validateSimulatorAction({ type: 'report' })).toBe(true);
        expect(validateSimulatorAction(null)).toBe(false);

        expect(appToChannel('bogus' as never)).toBe('email');
        expect(
            mapDevice({
                main_menu_items: [{ id: 'email' }, { id: 'home', label: 'Home', app: 'home' }],
                secondary_defaults: { email: 'list' },
            } as never)
        ).toEqual({
            mainMenuItems: [
                { id: 'email', label: 'email', app: undefined },
                { id: 'home', label: 'Home', app: 'home' },
            ],
            secondaryDefaults: { email: 'list' },
        });
        expect(mapDevice({ main_menu_items: [null, { label: 'Missing id' }] } as never)).toBeNull();
        expect(
            mapContacts([
                null,
                { display_name: 'Ada Lovelace', number: '555-0100', email: 'ada@example.test' },
                { id: 'c2', display_name: 'Grace Hopper' },
            ] as never)
        ).toEqual([
            { id: 'c-0', displayName: 'Ada Lovelace', number: '555-0100', email: 'ada@example.test' },
            { id: 'c2', displayName: 'Grace Hopper', number: undefined, email: undefined },
        ]);
        expect(mapContacts(null as never)).toEqual([]);

        const mappedEmail = mapEmail({
            messages: [
                { id: 'm1', subject: 'Inbox', from: 'inbox@example.test', folder_id: 'INBOX', unread: true },
                { id: 'm2', subject: 'Outbox', from_addr: 'outbox@example.test', folder_id: 'OUTBOX' },
                { id: 'm3', subject: 'Trash', from: 'trash@example.test', folder_id: 'TRASH' },
            ],
            detail: {
                id: 'm1',
                subject: 'Detail',
                from_addr: 'detail@example.test',
                body: 'Body',
                to: 'you@example.test',
                cc: 'cc@example.test',
                date_at: 'Today',
                unread: true,
                reply_to: 'reply@example.test',
                return_path: 'return@example.test',
                links: [{ href: 'https://example.test', text: 'Open', title: 'Title' }, { href: '', text: '' }],
                attachment_name: 'invoice.pdf',
                attachment_type: 'pdf',
                attachment_behavior: 'macro_prompt',
            },
        } as never);
        expect(mappedEmail?.outbox).toHaveLength(1);
        expect(mappedEmail?.trash).toHaveLength(1);
        expect(mappedEmail?.selectedMessage?.attachment_behavior).toBe('macro_prompt');
        expect(mappedEmail?.selectedMessage?.links?.[0]?.title).toBe('Title');
        expect(mapEmail(null as never)).toBeNull();
        expect(
            mapEmail({
                messages: [],
                detail: {
                    subject: 'Detail only',
                    from: 'detail@example.test',
                    body: 'Body',
                    links: [{ href: '', text: '' }],
                    attachment_behavior: 'invalid',
                },
            } as never)
        ).toEqual({
            inbox: [
                {
                    id: '0',
                    subject: 'Detail only',
                    from: 'detail@example.test',
                    from_display_name: undefined,
                    snippet: undefined,
                    date_at: undefined,
                    unread: undefined,
                },
            ],
            outbox: undefined,
            trash: undefined,
            selectedMessage: {
                subject: 'Detail only',
                from: 'detail@example.test',
                body: 'Body',
                from_display_name: undefined,
                to: undefined,
                cc: undefined,
                date_at: undefined,
                unread: undefined,
                reply_to: undefined,
                return_path: undefined,
                links: undefined,
                attachment_name: undefined,
                attachment_type: undefined,
                attachment_behavior: undefined,
            },
            selectedMessageId: null,
        });

        expect(mapMessages({ thread_detail: null } as never)).toBeNull();
        const mappedMessages = mapMessages({
            thread_detail: {
                messages: [{ from: 'other', text: 'Reply', timestamp: 'Now', attachment: { label: 'Doc' } }],
                sender_display_name: 'Sender',
                last_at: 'Later',
            },
            threads: [{ id: 't1', snippet: 'Preview', contact_number: '+1555', last_at: 'Now' }],
        } as never);
        expect(mappedMessages?.thread.messages[0]).toEqual(expect.objectContaining({ from: 'them', text: 'Reply' }));
        expect(mappedMessages?.threads?.[0]?.senderNumber).toBe('+1555');
        expect(
            mapMessages({
                thread_detail: {
                    messages: [{ from: 'me', text: 'Sent', attachment: { label: 'Receipt', url: '/receipt.pdf' } }],
                },
                threads: [null, { id: 't2', snippet: 'Preview 2', unread: true }],
            } as never)?.thread.messages[0]
        ).toEqual({
            from: 'me',
            text: 'Sent',
            delay_seconds: undefined,
            timestamp: undefined,
            attachment: { label: 'Receipt', url: '/receipt.pdf' },
        });

        expect(mapPhone({ incoming_call: null } as never)).toBeNull();
        const mappedPhone = mapPhone({
            incoming_call: { transcript: '', phone_number: '+1555', caller_title: 'urgent', avatar_url: 'https://example.test/avatar.png' },
            history: [{ number: '+1555', direction: 'voicemail' }, { number: '+1666', direction: 'missed' }],
            voicemail_transcript: 'Legacy voicemail',
        } as never);
        expect(mappedPhone?.content.transcript).toBe('Incoming call.');
        expect(mappedPhone?.content.avatar_url).toBe('https://example.test/avatar.png');
        expect(mappedPhone?.callHistory?.[0]?.kind).toBe('voicemail');
        expect(mappedPhone?.callHistory?.[1]?.kind).toBe('missed');
        expect(mappedPhone?.voicemailTranscript).toBe('Legacy voicemail');
        expect(
            mapPhone({
                incoming_call: { transcript: 'Live call' },
                history: [{ number: '+1777', direction: 'out' }, { number: '+1888' }],
                voicemail: { transcript: '', caller_name: 'Caller', timestamp: 'Now' },
            } as never)
        ).toEqual({
            content: {
                transcript: 'Live call',
                choices: [],
                phone_number: undefined,
                caller_name: undefined,
                caller_title: undefined,
                avatar_url: undefined,
            },
            chosenIndex: null,
            callHistory: [
                { id: 'call-0', number: '+1777', name: undefined, kind: 'outgoing', timestamp: undefined },
                { id: 'call-1', number: '+1888', name: undefined, kind: 'incoming', timestamp: undefined },
            ],
            voicemailTranscript: undefined,
            voicemailCallerName: 'Caller',
            voicemailTimestamp: 'Now',
        });

        expect(mapInternet({ pages: [] } as never)).toBeNull();
        const typedFormInternet = mapInternet({
            pages: [{ id: 'p1', url: 'example.com', title: 'Login', layout: 'content' }],
            forms: [
                {
                    page_id: 'p1',
                    fields: [
                        { name: 'user', type: 'text', label: 'User' },
                        { name: 'pass', type: 'password', label: 'Password' },
                    ],
                },
            ],
        } as never);
        expect(typedFormInternet?.pages[0]?.formFields).toEqual([
            { name: 'user', type: 'text', label: 'User' },
            { name: 'pass', type: 'password', label: 'Password' },
        ]);

        const mappedInternet = mapInternet({
            pages: [
                { url: 'portal.example.test', title: '', layout: '', submit_target_page_id: '' },
                { id: 'result', url: 'https://portal.example.test/result', title: 'Result', layout: 'result' },
            ],
            forms: [
                { fields: [] },
            ],
        } as never);
        expect(mappedInternet?.pages[0]).toEqual(
            expect.objectContaining({
                id: 'page',
                url: 'https://portal.example.test/',
                title: '',
                layout: '',
            })
        );
        expect(mappedInternet?.pages[0]?.formFields).toEqual([
            { name: 'username', type: 'text', label: 'Username' },
            { name: 'password', type: 'password', label: 'Password' },
        ]);
        expect(mappedInternet?.pages.filter((page) => page.id === 'result')).toHaveLength(1);
        expect(
            mapInternet({
                pages: [
                    { id: 'login', url: 'https://portal.example.test', title: 'Login', layout: 'login', submit_target_page_id: 'done' },
                    { id: 'done', url: 'https://portal.example.test/done', title: 'Done', layout: 'result' },
                ],
                forms: [
                    {
                        page_id: 'login',
                        fields: [
                            { name: 'email', type: 'email', label: 'Email' },
                            { name: 'password', type: 'password', label: 'Password' },
                            { name: undefined, type: undefined, label: undefined },
                        ],
                    },
                ],
            } as never)
        ).toEqual({
            pages: [
                {
                    id: 'login',
                    url: 'https://portal.example.test',
                    title: 'Login',
                    layout: 'login',
                    formFields: [
                        { name: 'email', type: 'email', label: 'Email' },
                        { name: 'password', type: 'password', label: 'Password' },
                        { name: 'field', type: 'text', label: 'Field' },
                    ],
                    submitTargetPageId: 'done',
                },
                {
                    id: 'done',
                    url: 'https://portal.example.test/done',
                    title: 'Done',
                    layout: 'result',
                    formFields: [
                        { name: 'email', type: 'email', label: 'Email' },
                        { name: 'password', type: 'password', label: 'Password' },
                        { name: 'field', type: 'text', label: 'Field' },
                    ],
                    submitTargetPageId: undefined,
                },
                {
                    id: 'result',
                    url: 'https://portal.example.testresult',
                    title: 'Result',
                    layout: 'result',
                    content: 'Simulation complete.',
                },
            ],
            defaultPageId: 'login',
        });

        expect(mapHome(null as never)).toBeNull();
        expect(
            mapHome({
                home: { widgets: [{}, { id: 'w2', type: 'tile', label: 'Widget' }] },
                store: { featured_apps: [{}, { id: 'app-2', name: 'App' }] },
                settings: { sections: [{}, { id: 's2', title: 'Security' }] },
            } as never)
        ).toEqual({
            widgets: [
                { id: 'w-0', type: undefined, label: 'Widget' },
                { id: 'w2', type: 'tile', label: 'Widget' },
            ],
            featuredApps: [
                { id: 'app-0', name: 'App' },
                { id: 'app-2', name: 'App' },
            ],
            settingsSections: [
                { id: 's-0', title: 'Section' },
                { id: 's2', title: 'Security' },
            ],
        });
    });
});
