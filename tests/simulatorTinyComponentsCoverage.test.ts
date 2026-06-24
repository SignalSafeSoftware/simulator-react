import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SimulatorDetailBackBar, SimulatorDetailBlock } from '../src/components/SimulatorDetail';
import { SimulatorList, SimulatorListItem } from '../src/components/SimulatorList';
import SimulatorLocalNav from '../src/components/SimulatorLocalNav';
import SimulatorReachabilityReport from '../src/components/SimulatorReachabilityReport';
import DirectoryView from '../src/views/DirectoryView';
import PhoneVoicemailView from '../src/views/PhoneVoicemailView';

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

describe('simulator tiny component coverage', () => {
    it('covers detail helpers, list defaults, and empty local-nav state', async () => {
        const onBack = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(
                    React.Fragment,
                    null,
                    React.createElement(SimulatorDetailBackBar, {
                        onBack,
                        title: 'Detail',
                        ariaLabel: 'Go back',
                    }),
                    React.createElement(
                        SimulatorDetailBlock,
                        { variant: 'compact' },
                        React.createElement(
                            SimulatorList,
                            null,
                            React.createElement(
                                SimulatorListItem,
                                { active: false, variant: 'default' },
                                React.createElement('span', null, 'Row')
                            )
                        )
                    ),
                    React.createElement(SimulatorLocalNav, {
                        items: [],
                        activeId: 'none',
                        onSelect: vi.fn(),
                        'aria-label': 'Empty nav',
                    })
                )
            );
        });

        expect(flattenText(renderer!.toJSON())).toContain('Detail');
        expect(flattenText(renderer!.toJSON())).toContain('Row');
        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Go back' }).props.onClick();
        });
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('covers voicemail header variants, directory missing-contact guards, and reachability stringify fallback', async () => {
        const onAction = vi.fn();
        const onViewEntry = vi.fn();
        const jsonUndefined = { toJSON: () => undefined };
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(
                    React.Fragment,
                    null,
                    React.createElement(PhoneVoicemailView, {
                        transcript: 'Transcript body',
                        callerName: null,
                        timestamp: 'Today',
                        onBack: vi.fn(),
                    }),
                    React.createElement(DirectoryView, {
                        directory: [{ id: 'fraud', label: 'Fraud line', contact_id: '' }],
                        contacts: [{ id: 'c1', displayName: 'Helpdesk', number: '+1555' }],
                        onBack: vi.fn(),
                        onAction,
                        onViewEntry,
                    }),
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
                                browserPageIds: [],
                            },
                            unreachable: {
                                screens: [jsonUndefined as never],
                                contacts: [],
                                inboxMessageIds: [],
                                browserPageIds: [],
                            },
                            browserHasCycle: false,
                        },
                    })
                )
            );
        });

        expect(flattenText(renderer!.toJSON())).toContain('Today');
        expect(flattenText(renderer!.toJSON())).not.toContain(' · ');

        await act(async () => {
            renderer!.root.findByProps({ children: 'Fraud line' }).props.onClick();
        });
        expect(onViewEntry).toHaveBeenCalledWith('fraud');
        expect(flattenText(renderer!.toJSON())).not.toContain('Call');
        expect(flattenText(renderer!.toJSON())).toContain('Screens: ');
        expect(flattenText(renderer!.toJSON())).not.toContain('[object Object]');
        expect(onAction).not.toHaveBeenCalled();
    });

    it('covers directory contact lookup when contacts are absent', async () => {
        const onAction = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(DirectoryView, {
                    directory: [{ id: 'helpdesk', label: 'Helpdesk', contact_id: 'contact-1' }],
                    contacts: null,
                    onBack: vi.fn(),
                    onAction,
                })
            );
        });

        await act(async () => {
            renderer!.root.findByProps({ children: 'Helpdesk' }).props.onClick();
        });

        expect(flattenText(renderer!.toJSON())).not.toContain('Call');
        expect(onAction).not.toHaveBeenCalled();
    });
});
