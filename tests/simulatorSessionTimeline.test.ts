import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import SimulatorSessionTimeline, {
    type SessionStartedEntry,
    type TimelineEntry,
} from '../src/components/SimulatorSessionTimeline';

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

function sessionStartedEntry(): SessionStartedEntry {
    return {
        kind: 'session_started',
        timestamp: '2026-01-01T10:00:00Z',
        app: 'internet',
        screen: 'landing',
    };
}

describe('SimulatorSessionTimeline', () => {
    it('renders singular event count and suppresses object metadata summaries', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;
        const entries: TimelineEntry[] = [
            {
                kind: 'link_clicked',
                timestamp: '2026-01-01T10:01:00Z',
                app: 'internet',
                screen: 'landing',
                action_key: '',
                metadata: { href: { nested: true } },
            } as TimelineEntry,
        ];

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorSessionTimeline, {
                    entries,
                    defaultExpanded: true,
                })
            );
        });

        const text = flattenText(renderer!.toJSON());
        expect(text).toContain('1 event');
        expect(text).toContain('Link clicked');
        expect(text).not.toContain('[object Object]');
    });

    it('renders plural event count and empty state text when expanded with no entries', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorSessionTimeline, {
                    entries: [],
                    defaultExpanded: true,
                })
            );
        });

        const text = flattenText(renderer!.toJSON());
        expect(text).toContain('0 events');
        expect(text).toContain('No events yet. Interact with the simulator to see the timeline.');
    });

    it('renders session-started entries without a target summary', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorSessionTimeline, {
                    entries: [sessionStartedEntry()],
                    defaultExpanded: true,
                })
            );
        });

        const text = flattenText(renderer!.toJSON());
        expect(text).toContain('Session started');
        expect(text).not.toContain('[object Object]');
    });

    it('toggles open state, truncates long hrefs, quotes search queries, and falls back when time formatting fails', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;
        const timeSpy = vi.spyOn(Date.prototype, 'toLocaleTimeString').mockImplementation(() => {
            throw new Error('bad clock');
        });

        try {
            await act(async () => {
                renderer = TestRenderer.create(
                    React.createElement(SimulatorSessionTimeline, {
                        entries: [
                            {
                                kind: 'link_clicked',
                                timestamp: '2026-01-01T10:02:03Z',
                                app: 'internet',
                                screen: 'landing',
                                metadata: { href: 'https://very-long.example.test/path/to/a/page/that/keeps/going' },
                            } as TimelineEntry,
                            {
                                kind: 'search_performed',
                                timestamp: '2026-01-01T11:12:13Z',
                                app: 'phone',
                                screen: 'contacts',
                                metadata: { query: 'Ada' },
                            } as TimelineEntry,
                        ],
                        defaultExpanded: false,
                    })
                );
            });

            expect(flattenText(renderer!.toJSON())).not.toContain('/page/that/keeps/going');

            await act(async () => {
                renderer!.root.findByProps({ children: 'Session timeline' }).props.onClick();
            });

            const text = flattenText(renderer!.toJSON());
            expect(text).toContain('10:02:03');
            expect(text).toContain('https://very-long.example.test/path/to/a…');
            expect(text).toContain('"Ada"');
        } finally {
            timeSpy.mockRestore();
        }
    });

    it('covers unknown labels, action-key precedence, numeric metadata, short hrefs, and missing metadata', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorSessionTimeline, {
                    entries: [
                        {
                            kind: 'custom_event',
                            timestamp: '2026-01-01T12:00:00Z',
                            app: 'internet',
                            screen: 'landing',
                            metadata: { href: 'https://s.example.test' },
                        } as unknown as TimelineEntry,
                        {
                            kind: 'screen_viewed',
                            timestamp: '2026-01-01T12:00:01Z',
                            app: 'phone',
                            screen: 'history',
                            action_key: 'keyboard:next',
                            metadata: { pageId: 7 },
                        } as TimelineEntry,
                        {
                            kind: 'app_opened',
                            timestamp: '2026-01-01T12:00:02Z',
                            app: 'home',
                            screen: 'home',
                        } as TimelineEntry,
                    ],
                    defaultExpanded: true,
                })
            );
        });

        const text = flattenText(renderer!.toJSON());
        expect(text).toContain('custom event');
        expect(text).toContain('https://s.example.test');
        expect(text).toContain('keyboard:next');
        expect(text).not.toContain('[object Object]');
    });

    it('covers boolean metadata filtering and short timestamp fallback strings', async () => {
        let renderer: TestRenderer.ReactTestRenderer | null = null;
        const timeSpy = vi.spyOn(Date.prototype, 'toLocaleTimeString').mockImplementation(() => {
            throw new Error('bad clock');
        });

        try {
            await act(async () => {
                renderer = TestRenderer.create(
                    React.createElement(SimulatorSessionTimeline, {
                        entries: [
                            {
                                kind: 'screen_viewed',
                                timestamp: 'bad',
                                app: 'email',
                                screen: 'list',
                                metadata: { messageId: false },
                            } as TimelineEntry,
                        ],
                        defaultExpanded: true,
                    })
                );
            });

            const text = flattenText(renderer!.toJSON());
            expect(text).toContain('bad');
            expect(text).toContain('false');
        } finally {
            timeSpy.mockRestore();
        }
    });
});
