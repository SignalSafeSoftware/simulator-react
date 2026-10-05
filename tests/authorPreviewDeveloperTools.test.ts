import type { ReactTestRenderer } from 'react-test-renderer';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SimulatorDeveloperToolsPanel from '../src/developer-tools/SimulatorDeveloperToolsPanel.js';
import SimulatorAuthorPreviewReport from '../src/developer-tools/SimulatorAuthorPreviewReport.js';
import { TestRenderer, act } from './reactTestRenderer';
import { flattenText } from './support/phonePanelsSupport';

afterEach(() => {
    vi.useRealTimers();
});

describe('author preview and developer tools', () => {
    it('covers author preview formatting branches and developer tools panel sections', async () => {
        let reportRenderer: ReactTestRenderer | null = null;
        await act(async () => {
            reportRenderer = TestRenderer.create(
                React.createElement(SimulatorAuthorPreviewReport, {
                    defaultExpanded: false,
                    report: {
                        entryPoint: { app: 'email', screen: 'detail' },
                        appsUsed: ['email', 'internet'],
                        contactsCount: 2,
                        inboxCount: 1,
                        threadMessageCount: 1,
                        browserPagesCount: 2,
                        directoryCount: 1,
                        keyActions: [
                            // @ts-expect-error Exercise rendering of a malformed report containing React nodes.
                            React.createElement('strong', { key: 'primary-action' }, 'Review'),
                            // @ts-expect-error Exercise rendering of a malformed nested report action.
                            [
                                'nested',
                                React.createElement('em', { key: 'secondary-action' }, 'Open'),
                            ],
                        ],
                        validationOk: true,
                        lintWarningCount: 0,
                        unreachableCount: 2,
                        browserHasCycle: true,
                    },
                }),
            );
        });
        await act(async () => {
            reportRenderer!.root.findByProps({ children: 'Template summary' }).props.onClick();
        });
        const reportText = flattenText(reportRenderer!.toJSON());
        expect(reportText).toContain(
            'email/detail · 2 apps · 2 contacts · 1 inbox · 1 SMS · 2 pages · 1 directory',
        );
        expect(reportText).toContain('Unreachable items');
        expect(reportText).toContain('Browser has navigation cycle.');

        let panelRenderer: ReactTestRenderer | null = null;
        await act(async () => {
            panelRenderer = TestRenderer.create(
                React.createElement(SimulatorDeveloperToolsPanel, {
                    developerTools: {
                        enabled: true,
                        defaultExpanded: true,
                        sections: {
                            summary: true,
                            reachability: true,
                            timeline: true,
                            runtimeIssues: true,
                        },
                    } as never,
                    payload: {
                        templateId: null,
                        templateKey: 'panel',
                        name: 'Panel Payload',
                        channel: 'email',
                        topicTags: [],
                        runId: null,
                        attemptId: null,
                        entryPoint: { app: 'email', screen: 'list' },
                        device: {
                            mainMenuItems: [
                                { id: 'email', label: 'Email' },
                                { id: 'internet', label: 'Internet' },
                            ],
                            secondaryDefaults: { email: 'list', internet: 'landing' },
                        },
                        email: {
                            inbox: [{ id: 'e1', subject: 'Alert', from: 'alert@example.test' }],
                            selectedMessage: {
                                subject: 'Alert',
                                from: 'alert@example.test',
                                body: 'Open this page',
                                links: [{ href: 'https://example.test', text: 'Open' }],
                            },
                            selectedMessageId: 'e1',
                        },
                        sms: null,
                        browser: {
                            defaultPageId: 'landing',
                            pages: [
                                {
                                    id: 'landing',
                                    url: 'https://example.test',
                                    title: 'Landing',
                                    layout: 'landing',
                                },
                            ],
                        },
                        phone: null,
                        contacts: [{ id: 'c1', displayName: 'Helpdesk', number: '+15550000001' }],
                        directory: [{ id: 'd1', label: 'Helpdesk', number: '+15550000001' }],
                        home: null,
                    },
                    timelineEntries: [
                        {
                            kind: 'session_started',
                            timestamp: '2026-01-01T10:00:00Z',
                            app: 'email',
                            screen: 'list',
                        },
                    ] as never,
                    runtimeIssues: [
                        { severity: 'warning', message: 'Potential issue', node_id: 'start' },
                    ] as never,
                    className: 'developer-tools',
                }),
            );
        });
        const panelText = flattenText(panelRenderer!.toJSON());
        expect(panelText).toContain('Template summary');
        expect(panelText).toContain('Reachability');
        expect(panelText).toContain('Session timeline');
        expect(panelText).toContain('Runtime issues');

        await act(async () => {
            panelRenderer!.update(
                React.createElement(SimulatorDeveloperToolsPanel, {
                    developerTools: { enabled: false } as never,
                }),
            );
        });
        expect(panelRenderer!.toJSON()).toBeNull();
    });
});
