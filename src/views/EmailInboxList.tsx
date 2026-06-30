/**
 * Reusable email inbox list: wireframe rows (profile icon, sender, snippet, date, Read/Unread tag).
 * Optional search bar and compose (pencil) button.
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { SimulatorInboxRow } from '../types/session.js';
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
    SIM_TEXT_BOLD,
    SIM_TEXT_MEDIUM,
    SIM_TEXT_SM,
    simBadgeToneClass,
} from '../ui/simulatorClasses.js';
import {
    SIM_EMAIL_INBOX,
    SIM_EMAIL_MESSAGE_ROW,
    SIM_EMAIL_STATUS_BADGE,
} from '../ui/semanticSimulatorClasses.js';

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
            <p className={joinClasses(simTypo.emptyState, simSpacing.pt3, simSpacing.px2, 'simulator-text--start')}>
                {folderLabel === 'Trash' ? 'No emails in Trash.' : 'No emails.'}
            </p>
        );
    } else if (filtered.length === 0) {
        content = (
            <p className={joinClasses(simTypo.emptyState, simSpacing.pt3, simSpacing.px2, 'simulator-text--start')}>
                No results for &quot;{searchQuery}&quot;.
            </p>
        );
    } else {
        content = (
            <div className={joinClasses('simulator-list--flush', simSpacing.mt2)}>
                {filtered.map((row) => (
                    <button
                        type="button"
                        key={row.id}
                        onClick={() => onSelectMessage(row.id)}
                        className={joinClasses(
                            simRowSurface.selectable,
                            selectedMessageId === row.id ? simRowSurface.selected : simRowSurface.default,
                            SIM_EMAIL_MESSAGE_ROW,
                        )}
                        style={{ cursor: 'pointer' }}
                    >
                        <InboxProfileIcon />
                        <div className={joinClasses(SIM_FLEX_COL, 'simulator-min-w-0', SIM_FLEX_GROW_1)}>
                            <span className={joinClasses(SIM_TEXT_MEDIUM, 'simulator-text--truncate', row.unread && SIM_TEXT_BOLD)}>
                                {row.from_display_name != null && row.from_display_name !== ''
                                    ? row.from_display_name
                                    : row.from}
                            </span>
                            {row.snippet != null && row.snippet !== '' && (
                                <span className={joinClasses(SIM_TEXT_SM, SIM_MUTED, 'simulator-text--break')} style={{ lineHeight: 1.35 }}>
                                    {row.snippet}
                                </span>
                            )}
                            {row.date_at != null && (
                                <span className={joinClasses(SIM_TEXT_SM, SIM_MUTED, simSpacing.mt1)}>{row.date_at}</span>
                            )}
                        </div>
                        <span
                            className={joinClasses(
                                simBadgeToneClass(row.unread ? 'primary' : 'neutral'),
                                SIM_ROUNDED_NONE,
                                SIM_FLEX_SHRINK_0,
                                SIM_EMAIL_STATUS_BADGE,
                            )}
                        >
                            {row.unread ? 'Unread' : 'Read'}
                        </span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className={joinClasses(simLayout.stack, SIM_EMAIL_INBOX)}>
            <div className={simLayout.headerRowBetween}>
                <span className={joinClasses(SIM_FLEX_GROW_1, 'simulator-text--center', SIM_TEXT_SM, 'simulator-text--semibold', 'simulator-text--body')}>
                    {folderLabel}
                </span>
                {onCompose != null && (
                    <SimulatorButton
                        tone="outline-primary"
                        className={joinClasses(SIM_ROUNDED_NONE, simSpacing.py1, simSpacing.px2, simSpacing.me2, 'simulator-btn--sm')}
                        onClick={onCompose}
                        aria-label="Compose email"
                    >
                        Compose
                    </SimulatorButton>
                )}
            </div>
            <SimulatorSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={onSearchSubmit ?? (() => {})}
                placeholder="Search"
                ariaLabel="Search"
                className={simSpacing.mb2}
            />
            {content}
        </div>
    );
}
