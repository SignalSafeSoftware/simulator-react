/**
 * Messages app: thread list. Wireframe: list header with plus/add action, search, rows with
 * profile icon, contact, snippet, date.
 */
import { useState, useMemo, type ReactNode } from 'react';
import { SimulatorSearchInput } from '../components/SimulatorSearchInput';

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
            className={`rounded bg-primary bg-opacity-25 d-flex align-items-center justify-content-center flex-shrink-0 ${className ?? ''}`}
            style={{ width: 40, height: 40 }}
            aria-hidden
        >
            <span className="text-primary" style={{ fontSize: '1.25rem' }}>👤</span>
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
        content = <p className="text-muted small mb-0 px-2">No conversations.</p>;
    } else if (filtered.length === 0) {
        content = <p className="text-muted small mb-0 px-2">No results for &quot;{searchQuery}&quot;.</p>;
    } else {
        content = (
            <div className="list-group list-group-flush mt-1">
                {filtered.map((row, index) => (
                    <button
                        type="button"
                        key={row.id}
                        onClick={() => onSelectThread(row.id)}
                        className={`d-flex w-100 align-items-start gap-3 py-3 px-3 border border-secondary rounded-0 bg-white text-start ${index === 0 ? 'border-top' : 'border-top-0'}`}
                        style={{ cursor: 'pointer' }}
                    >
                        <ThreadProfileIcon />
                        <div className="d-flex flex-column min-w-0 flex-grow-1">
                            <span className={`fw-medium text-truncate ${row.unread ? 'fw-bold' : ''}`}>
                                {row.senderName ?? row.senderNumber ?? 'Unknown'}
                            </span>
                            <span className="small text-muted text-break mt-0" style={{ lineHeight: 1.35 }}>
                                {row.preview}
                            </span>
                        </div>
                        {row.timestamp != null && (
                            <span className="small text-muted flex-shrink-0 align-self-end">{row.timestamp}</span>
                        )}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between border-bottom border-secondary py-2 mb-2">
                <span className="flex-grow-1 text-center small fw-semibold text-body">Threads</span>
                {onCompose != null && (
                    <button
                        type="button"
                        className="btn btn-outline-primary btn-sm rounded-0 py-1 px-2 me-2"
                        onClick={onCompose}
                        aria-label="New thread"
                    >
                        New thread
                    </button>
                )}
            </div>
            <SimulatorSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={() => {}}
                placeholder="Q Search"
                ariaLabel="Search threads"
                className="mb-3"
            />
            {content}
        </div>
    );
}
