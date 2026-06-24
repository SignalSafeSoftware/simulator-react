import React from 'react';
import { describe, expect, it } from 'vitest';
import SimulatorAuthorPreviewReport from '../src/components/SimulatorAuthorPreviewReport';

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

describe('SimulatorAuthorPreviewReport', () => {
    it('renders singular/plural summary text and avoids object default stringification', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorAuthorPreviewReport, {
                    defaultExpanded: true,
                    report: {
                        entryPoint: { app: 'internet', screen: 'landing' },
                        appsUsed: ['internet'],
                        contactsCount: 0,
                        inboxCount: 2,
                        threadMessageCount: 0,
                        browserPagesCount: 1,
                        directoryCount: 0,
                        keyActions: [{ unsafe: true } as never, 'report_clicked'],
                        validationOk: false,
                        lintWarningCount: 1,
                        unreachableCount: 0,
                        browserHasCycle: false,
                    },
                })
            );
        });

        const text = flattenText(renderer!.toJSON());
        expect(text).toContain('internet/landing · 1 app · 2 inbox · 1 page · 1 lint · invalid');
        expect(text).toContain('{"unsafe":true}, report_clicked');
        expect(text).not.toContain('[object Object]');
    });

    it('formats mixed preview values and toggles the collapsed body', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;
        const circular: Record<string, unknown> = {};
        circular.self = circular;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorAuthorPreviewReport, {
                    defaultExpanded: false,
                    report: {
                        entryPoint: { app: 'phone', screen: 'history' },
                        appsUsed: ['phone', 'email'],
                        contactsCount: 1,
                        inboxCount: 0,
                        threadMessageCount: 2,
                        browserPagesCount: 0,
                        directoryCount: 1,
                        keyActions: [
                            null,
                            true,
                            7,
                            React.createElement('strong', null, 'Inline'),
                            ['alpha', React.createElement('em', { key: 'keyed' }, 'Beta')],
                            { app: 'email', screen: 'detail' } as never,
                            { foo: 'bar' } as never,
                            circular as never,
                        ],
                        validationOk: true,
                        lintWarningCount: 0,
                        unreachableCount: 1,
                        browserHasCycle: false,
                    } as never,
                })
            );
        });

        expect(flattenText(renderer!.toJSON())).toContain('phone/history · 2 apps · 1 contact · 2 SMS · 1 directory');

        await act(async () => {
            renderer!.root.findByProps({ children: 'Template summary' }).props.onClick();
        });

        const text = flattenText(renderer!.toJSON());
        expect(text).toContain('phone / history');
        expect(text).toContain('7');
        expect(text).toContain('Inline');
        expect(text).toContain('alpha');
        expect(text).toContain('Beta');
        expect(text).toContain('email / detail');
        expect(text).toContain('{"foo":"bar"}');
        expect(text).toContain('Unreachable items');
        expect(text).toContain('OK');
        expect(text).not.toContain('[object Object]');
    });

    it('renders empty summaries, browser cycle warnings, and placeholder key actions', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorAuthorPreviewReport, {
                    defaultExpanded: true,
                    report: {
                        entryPoint: { app: 'email', screen: 'list' },
                        appsUsed: [],
                        contactsCount: 0,
                        inboxCount: 0,
                        threadMessageCount: 0,
                        browserPagesCount: 0,
                        directoryCount: 0,
                        keyActions: [],
                        validationOk: true,
                        lintWarningCount: 0,
                        unreachableCount: 0,
                        browserHasCycle: true,
                    },
                })
            );
        });

        const text = flattenText(renderer!.toJSON());
        expect(text).toContain('email/list');
        expect(text).toContain('Apps used: —');
        expect(text).toContain('Key actions: —');
        expect(text).toContain('Browser has navigation cycle.');
    });

    it('ignores unsupported key-action node types without leaking object strings', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorAuthorPreviewReport, {
                    defaultExpanded: true,
                    report: {
                        entryPoint: { app: 'messages', screen: 'threads' },
                        appsUsed: ['messages'],
                        contactsCount: 0,
                        inboxCount: 0,
                        threadMessageCount: 1,
                        browserPagesCount: 0,
                        directoryCount: 0,
                        keyActions: [(() => 'noop') as never, Symbol('ignored') as never, 'reply'],
                        validationOk: true,
                        lintWarningCount: 0,
                        unreachableCount: 0,
                        browserHasCycle: false,
                    } as never,
                })
            );
        });

        const text = flattenText(renderer!.toJSON());
        expect(text).toContain('messages/threads · 1 app · 1 SMS');
        expect(text).toContain('Key actions: , , reply');
        expect(text).not.toContain('[object Object]');
        expect(text).not.toContain('Symbol(ignored)');
    });

    it('renders bigint key actions with stable preview keys', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorAuthorPreviewReport, {
                    defaultExpanded: true,
                    report: {
                        entryPoint: { app: 'email', screen: 'list' },
                        appsUsed: ['email'],
                        contactsCount: 0,
                        inboxCount: 0,
                        threadMessageCount: 0,
                        browserPagesCount: 0,
                        directoryCount: 0,
                        keyActions: [BigInt(42) as never, 'reply'],
                        validationOk: true,
                        lintWarningCount: 0,
                        unreachableCount: 0,
                        browserHasCycle: false,
                    } as never,
                })
            );
        });

        const text = flattenText(renderer!.toJSON());
        expect(text).toContain('Key actions:');
        expect(text).toContain('reply');
    });

    it('stabilizes preview keys for repeated arrays, keyed elements, and serializable objects', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorAuthorPreviewReport, {
                    defaultExpanded: true,
                    report: {
                        entryPoint: { app: 'home', screen: 'home' },
                        appsUsed: ['home'],
                        contactsCount: 0,
                        inboxCount: 0,
                        threadMessageCount: 0,
                        browserPagesCount: 0,
                        directoryCount: 0,
                        keyActions: [
                            ['alpha', { nested: true } as never],
                            ['alpha', { nested: true } as never],
                            React.createElement('span', { key: 'stable-key' }, 'Keyed'),
                            { foo: 'bar' } as never,
                            false,
                        ],
                        validationOk: true,
                        lintWarningCount: 0,
                        unreachableCount: 0,
                        browserHasCycle: false,
                    } as never,
                })
            );
        });

        const text = flattenText(renderer!.toJSON());
        expect(text).toContain('alpha');
        expect(text).toContain('Keyed');
        expect(text).toContain('{"foo":"bar"}');
        expect(text).not.toContain('[object Object]');
    });
});
