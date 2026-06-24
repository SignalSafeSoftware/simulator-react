import React from 'react';
import { describe, expect, it } from 'vitest';
import SimulatorReachabilityReport from '../src/components/SimulatorReachabilityReport';

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

describe('SimulatorReachabilityReport', () => {
    it('formats unreachable screen values without object default stringification', () => {
        const renderer = TestRenderer.create(
            React.createElement(SimulatorReachabilityReport, {
                defaultExpanded: true,
                report: {
                    entryApp: 'internet',
                    reachableApps: ['internet'],
                    reachableScreens: {
                        email: [],
                        messages: [],
                        internet: ['landing'],
                        phone: [],
                        home: [],
                    },
                    reachableEntities: {
                        contacts: [],
                        inboxMessageIds: [],
                        browserPageIds: ['landing'],
                    },
                    unreachable: {
                        screens: [{ app: { bad: true } as never, screen: { nested: 'pricing' } as never }],
                        contacts: [],
                        inboxMessageIds: [],
                        browserPageIds: [],
                    },
                    browserHasCycle: false,
                },
            })
        );

        const text = flattenText(renderer.toJSON());
        expect(text).toContain('{"app":{"bad":true},"screen":{"nested":"pricing"}}');
        expect(text).not.toContain('[object Object]');
    });

    it('covers toggle, primitive formatting, slash trimming, and unserializable refs', async () => {
        const circular: Record<string, unknown> = {};
        circular.self = circular;
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorReachabilityReport, {
                    defaultExpanded: false,
                    report: {
                        entryApp: null,
                        reachableApps: ['phone'],
                        reachableScreens: {
                            email: [],
                            messages: [],
                            internet: [],
                            phone: ['history'],
                            home: [],
                        },
                        reachableEntities: {
                            contacts: [],
                            inboxMessageIds: [],
                            browserPageIds: [],
                        },
                        unreachable: {
                            screens: [
                                { app: '/phone/', screen: '/history/' } as never,
                                true as never,
                                7 as never,
                                10n as never,
                                circular as never,
                            ],
                            contacts: ['c1'],
                            inboxMessageIds: ['m1'],
                            browserPageIds: ['landing'],
                        },
                        browserHasCycle: true,
                    },
                })
            );
        });

        expect(flattenText(renderer!.toJSON())).toContain('Reachability (8 unreachable)');
        await act(async () => {
            renderer!.root.findByType('button').props.onClick();
        });

        const text = flattenText(renderer!.toJSON());
        expect(text).toContain('Entry app: —');
        expect(text).toContain('phone///history');
        expect(text).toContain('true');
        expect(text).toContain('7');
        expect(text).toContain('10');
        expect(text).toContain('[unserializable]');
        expect(text).toContain('Contacts: c1');
        expect(text).toContain('Inbox: m1');
        expect(text).toContain('Pages: landing');
        expect(text).toContain('Browser navigation has a cycle');
    });

    it('covers empty reachable-screen buckets and mixed object screen refs', () => {
        const circular: Record<string, unknown> = {};
        circular.self = circular;
        const jsonUndefined = { toJSON: () => undefined };

        const renderer = TestRenderer.create(
            React.createElement(SimulatorReachabilityReport, {
                className: 'custom-report',
                defaultExpanded: true,
                report: {
                    entryApp: 'messages',
                    reachableApps: ['email', 'messages'],
                    reachableScreens: {
                        email: [],
                        messages: ['threads'],
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
                        screens: [
                            { app: jsonUndefined as never, screen: 'detail' } as never,
                            { app: 'phone', screen: null } as never,
                            { app: 'phone', screen: circular } as never,
                        ],
                        contacts: [],
                        inboxMessageIds: [],
                        browserPageIds: [],
                    },
                    browserHasCycle: false,
                },
            })
        );

        const text = flattenText(renderer.toJSON());
        expect(renderer.root.findByProps({ 'data-testid': 'simulator-reachability-report' }).props.className).toContain('custom-report');
        expect(text).toContain('Reachability (3 unreachable)');
        expect(text).toContain('Entry app: messages');
        expect(text).toContain('messages screens: threads');
        expect(text).not.toContain('email screens');
        expect(text).toContain('phone');
        expect(text).toContain('[unserializable]');
        expect(text).toContain('detail');
    });
});
