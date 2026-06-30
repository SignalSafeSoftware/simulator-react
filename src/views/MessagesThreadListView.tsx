/**
 * Messages app: thread list. Wireframe: list header with plus/add action, search, rows with
 * profile icon, contact, snippet, date.
 */
import { useState, useMemo, type ReactNode } from 'react';
import { SimulatorSearchInput } from '../components/SimulatorSearchInput.js';
import { simLayout, simRowSurface, simSpacing, simTypo } from '../simulatorStyles.js';
import { SimulatorButton } from '../ui/primitives.js';
import {
    joinClasses,
    SIM_AVATAR,
    SIM_FLEX_COL,
    SIM_FLEX_GROW_1,
    SIM_FLEX_SHRINK_0,
    SIM_MUTED,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_AVATAR,
    SIM_SURFACE_WHITE,
    SIM_TEXT_BOLD,
    SIM_TEXT_MEDIUM,
    SIM_TEXT_SM,
} from '../ui/simulatorClasses.js';
import {
    SIM_MESSAGES,
    SIM_MESSAGES_THREAD_LIST,
    SIM_MESSAGES_THREAD_ROW,
} from '../ui/semanticSimulatorClasses.js';

export interface ThreadListRow {
    id: string;
    preview: string;
    senderName?: string;
    senderNumber?: string;
    timestamp?: string;
    unread?: boolean;
}

export interface MessagesThreadListViewProps {
    threads: ThreadListRow[];
    onSelectThread: (threadId: string) => void;
    /** Optional compose handler (e.g. for future new-message flow); pencil icon shown when set. */
    onCompose?: () => void;
}

function ThreadProfileIcon({ className }: Readonly<{ className?: string }>) {
    return (
        <div
            className={joinClasses(
                SIM_AVATAR,
                SIM_SURFACE_AVATAR,
                'simulator-flex simulator-flex--center',
                SIM_FLEX_SHRINK_0,
                className,
            )}
            style={{ width: 40, height: 40 }}
            aria-hidden
        >
            <span className="simulator-text--primary" style={{ fontSize: '1.25rem' }}>👤</span>
        </div>
    );
}

function matchesSearch(row: ThreadListRow, q: string): boolean {
    if (!q.trim()) return true;
    const lower = q.toLowerCase().trim();
    const name = (row.senderName ?? '').toLowerCase();
    const num = (row.senderNumber ?? '').toLowerCase();
    const preview = (row.preview ?? '').toLowerCase();
    return name.includes(lower) || num.includes(lower) || preview.includes(lower);
}

export default function MessagesThreadListView({
    threads,
    onSelectThread,
    onCompose,
}: Readonly<MessagesThreadListViewProps>) {
    const [searchQuery, setSearchQuery] = useState('');
    const filtered = useMemo(
        () => threads.filter((row) => matchesSearch(row, searchQuery)),
        [threads, searchQuery]
    );
    let content: ReactNode;
    if (threads.length === 0) {
        content = <p className={joinClasses(simTypo.emptyState, simSpacing.px2)}>No conversations.</p>;
    } else if (filtered.length === 0) {
        content = (
            <p className={joinClasses(simTypo.emptyState, simSpacing.px2)}>
                No results for &quot;{searchQuery}&quot;.
            </p>
        );
    } else {
        content = (
            <div className={joinClasses('simulator-list--flush', simSpacing.mt1, SIM_MESSAGES_THREAD_LIST)}>
                {filtered.map((row, index) => (
                    <button
                        type="button"
                        key={row.id}
                        onClick={() => onSelectThread(row.id)}
                        className={joinClasses(
                            simRowSurface.selectable,
                            SIM_SURFACE_WHITE,
                            index === 0 ? 'simulator-border--top' : 'simulator-border--top-none',
                            SIM_MESSAGES_THREAD_ROW,
                        )}
                        style={{ cursor: 'pointer' }}
                    >
                        <ThreadProfileIcon />
                        <div className={joinClasses(SIM_FLEX_COL, 'simulator-min-w-0', SIM_FLEX_GROW_1)}>
                            <span className={joinClasses(SIM_TEXT_MEDIUM, 'simulator-text--truncate', row.unread && SIM_TEXT_BOLD)}>
                                {row.senderName ?? row.senderNumber ?? 'Unknown'}
                            </span>
                            <span className={joinClasses(SIM_TEXT_SM, SIM_MUTED, 'simulator-text--break')} style={{ lineHeight: 1.35 }}>
                                {row.preview}
                            </span>
                        </div>
                        {row.timestamp != null && (
                            <span className={joinClasses(SIM_TEXT_SM, SIM_MUTED, SIM_FLEX_SHRINK_0, 'simulator-flex--align-end')}>
                                {row.timestamp}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className={joinClasses(simLayout.stack, SIM_MESSAGES)}>
            <div className={simLayout.headerRowBetween}>
                <span className={joinClasses(SIM_FLEX_GROW_1, 'simulator-text--center', SIM_TEXT_SM, 'simulator-text--semibold', 'simulator-text--body')}>
                    Threads
                </span>
                {onCompose != null && (
                    <SimulatorButton
                        tone="outline-primary"
                        className={joinClasses(SIM_ROUNDED_NONE, simSpacing.py1, simSpacing.px2, simSpacing.me2, 'simulator-btn--sm')}
                        onClick={onCompose}
                        aria-label="New thread"
                    >
                        New thread
                    </SimulatorButton>
                )}
            </div>
            <SimulatorSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={() => {}}
                placeholder="Q Search"
                ariaLabel="Search threads"
                className={simSpacing.mb3}
            />
            {content}
        </div>
    );
}
