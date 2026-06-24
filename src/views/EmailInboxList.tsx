/**
 * Reusable email inbox list: wireframe rows (profile icon, sender, snippet, date, Read/Unread tag).
 * Optional search bar and compose (pencil) button.
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { SimulatorInboxRow } from '../types/session';
import { SimulatorSearchInput } from '../components/SimulatorSearchInput';

export interface EmailInboxListProps {
    inbox: SimulatorInboxRow[];
    selectedMessageId: string | null;
    onSelectMessage: (messageId: string) => void;
    /** Optional folder label (e.g. "Inbox", "Outbox", "Trash"). */
    folderLabel?: string;
    /** When set, show pencil icon to open compose. */
    onCompose?: () => void;
    /** Optional controlled search; when omitted, local state is used and list is filtered. */
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    onSearchSubmit?: (query: string) => void;
}

function InboxProfileIcon({ className }: Readonly<{ className?: string }>) {
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

function matchesSearch(row: SimulatorInboxRow, q: string): boolean {
    if (!q.trim()) return true;
    const lower = q.toLowerCase().trim();
    const sub = (row.subject ?? '').toLowerCase();
    const from = (row.from ?? '').toLowerCase();
    const fromName = (row.from_display_name ?? '').toLowerCase();
    const snippet = (row.snippet ?? '').toLowerCase();
    return sub.includes(lower) || from.includes(lower) || fromName.includes(lower) || snippet.includes(lower);
}

export default function EmailInboxList({
    inbox,
    selectedMessageId,
    onSelectMessage,
    folderLabel = 'Inbox',
    onCompose,
    searchQuery: controlledQuery,
    onSearchChange: controlledSetQuery,
    onSearchSubmit,
}: Readonly<EmailInboxListProps>) {
    const [localQuery, setLocalQuery] = useState('');
    const isControlled = controlledQuery !== undefined && controlledSetQuery !== undefined;
    const searchQuery = isControlled ? controlledQuery : localQuery;
    const setSearchQuery = isControlled ? controlledSetQuery : setLocalQuery;

    const filtered = useMemo(
        () => inbox.filter((row) => matchesSearch(row, searchQuery)),
        [inbox, searchQuery]
    );
    let content: ReactNode;
    if (inbox.length === 0) {
        content = (
            <p className="text-muted small mb-0 pt-3 px-2 text-start">
                {folderLabel === 'Trash' ? 'No emails in Trash.' : 'No emails.'}
            </p>
        );
    } else if (filtered.length === 0) {
        content = <p className="text-muted small mb-0 pt-3 px-2 text-start">No results for &quot;{searchQuery}&quot;.</p>;
    } else {
        content = (
            <div className="list-group list-group-flush mt-2">
                {filtered.map((row) => (
                    <button
                        type="button"
                        key={row.id}
                        onClick={() => onSelectMessage(row.id)}
                        className={`d-flex w-100 align-items-start gap-3 py-3 px-2 border border-secondary rounded-0 text-start ${selectedMessageId === row.id ? 'bg-light' : 'bg-white'}`}
                        style={{ cursor: 'pointer' }}
                    >
                        <InboxProfileIcon />
                        <div className="d-flex flex-column min-w-0 flex-grow-1">
                            <span className={`fw-medium text-truncate ${row.unread ? 'fw-bold' : ''}`}>
                                {row.from_display_name != null && row.from_display_name !== ''
                                    ? row.from_display_name
                                    : row.from}
                            </span>
                            {row.snippet != null && row.snippet !== '' && (
                                <span className="small text-muted text-break mt-0" style={{ lineHeight: 1.35 }}>
                                    {row.snippet}
                                </span>
                            )}
                            {row.date_at != null && (
                                <span className="small text-muted mt-1">{row.date_at}</span>
                            )}
                        </div>
                        <span className={`badge rounded-0 flex-shrink-0 ${row.unread ? 'bg-primary' : 'bg-secondary'}`}>
                            {row.unread ? 'Unread' : 'Read'}
                        </span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between border-bottom border-secondary py-2 mb-2">
                <span className="flex-grow-1 text-center small fw-semibold text-body">{folderLabel}</span>
                {onCompose != null && (
                    <button
                        type="button"
                        className="btn btn-outline-primary btn-sm rounded-0 py-1 px-2 me-2"
                        onClick={onCompose}
                        aria-label="Compose email"
                    >
                        Compose
                    </button>
                )}
            </div>
            <SimulatorSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={onSearchSubmit ?? (() => {})}
                placeholder="Search"
                ariaLabel="Search"
                className="mb-2"
            />
            {content}
        </div>
    );
}
