/**
 * Phone History tab: list of recent calls by kind (incoming, outgoing, missed, voicemail)
 * + optional "Incoming call" card + optional Voicemail summary row.
 * Wireframe: search bar ("Q Search"), profile icon (left), name/number, date, rectangular status tag.
 */
import { useState, useMemo } from 'react';
import type { SimulatorCallHistoryEntry, CallHistoryEntryKind } from '../types/session';
import type { PhoneSimulatorContent } from '../types/portableSimulator';
import { SimulatorSearchInput } from '../components/SimulatorSearchInput';

/** Light blue profile icon for call/contact rows (wireframe). */
function ProfileIcon({ className }: Readonly<{ className?: string }>) {
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

export interface PhoneHistoryListProps {
    entries: SimulatorCallHistoryEntry[];
    /** When set, show a prominent "Incoming call" card that navigates to incoming_call. */
    incomingCallContent?: PhoneSimulatorContent | null;
    /** When true, show a Voicemail row and allow opening voicemail (e.g. when transcript exists). */
    hasVoicemail?: boolean;
    onSelectIncoming: () => void;
    onSelectVoicemail: () => void;
    onSelectEntry?: (id: string) => void;
}

/** Derive kind from entry for backward compat (label or default). */
function entryKind(entry: SimulatorCallHistoryEntry): CallHistoryEntryKind {
    if (entry.kind) return entry.kind;
    const l = (entry.label ?? '').toLowerCase();
    if (l.includes('missed')) return 'missed';
    if (l.includes('voicemail')) return 'voicemail';
    if (l.includes('out')) return 'outgoing';
    return 'incoming';
}

function kindLabel(kind: CallHistoryEntryKind): string {
    switch (kind) {
        case 'incoming': return 'Incoming';
        case 'outgoing': return 'Outbound';
        case 'missed': return 'Missed';
        case 'voicemail': return 'Voicemail';
        default: return 'Call';
    }
}

function kindBadgeVariant(kind: CallHistoryEntryKind): string {
    switch (kind) {
        case 'missed': return 'danger';
        case 'voicemail': return 'secondary';
        case 'outgoing': return 'primary';
        case 'incoming': return 'success';
        default: return 'secondary';
    }
}

function matchesSearch(entry: SimulatorCallHistoryEntry, q: string): boolean {
    if (!q.trim()) return true;
    const lower = q.toLowerCase().trim();
    const name = (entry.name ?? '').toLowerCase();
    const number = (entry.number ?? '').toLowerCase();
    const timestamp = (entry.timestamp ?? '').toLowerCase();
    const label = (entry.label ?? '').toLowerCase();
    return name.includes(lower) || number.includes(lower) || timestamp.includes(lower) || label.includes(lower);
}

function incomingMatchesSearch(content: PhoneSimulatorContent | null | undefined, q: string): boolean {
    if (!content || !q.trim()) return true;
    const lower = q.toLowerCase().trim();
    const name = (content.caller_name ?? '').toLowerCase();
    const number = (content.phone_number ?? '').toLowerCase();
    return name.includes(lower) || number.includes(lower);
}

function PhoneHistoryRowButton({
    onClick,
    className,
    ariaLabel,
    children,
}: Readonly<{
    onClick: () => void;
    className: string;
    ariaLabel?: string;
    children: React.ReactNode;
}>): JSX.Element {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`${className} text-start w-100`}
            style={{ cursor: 'pointer' }}
            aria-label={ariaLabel}
        >
            {children}
        </button>
    );
}

export default function PhoneHistoryList({
    entries,
    incomingCallContent,
    hasVoicemail,
    onSelectIncoming,
    onSelectVoicemail,
    onSelectEntry,
}: Readonly<PhoneHistoryListProps>) {
    const [searchQuery, setSearchQuery] = useState('');
    const filteredEntries = useMemo(
        () => entries.filter((e) => matchesSearch(e, searchQuery)),
        [entries, searchQuery]
    );
    const showIncoming =
        incomingCallContent != null && incomingMatchesSearch(incomingCallContent, searchQuery);
    const showVoicemailRow = hasVoicemail && (!searchQuery.trim() || 'voicemail'.includes(searchQuery.toLowerCase().trim()));

    return (
        <div className="d-flex flex-column">
            <SimulatorSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={() => {}}
                placeholder="Q Search"
                ariaLabel="Search calls"
                className="mb-2"
            />
            {showIncoming && (
                <PhoneHistoryRowButton
                    onClick={onSelectIncoming}
                    className="d-flex align-items-center gap-3 p-3 mb-2 border border-secondary rounded-0 bg-light text-dark"
                    aria-label="Incoming call"
                >
                    <ProfileIcon />
                    <div className="d-flex flex-column min-w-0 flex-grow-1">
                        <span className="fw-medium text-truncate">
                            {incomingCallContent.caller_name ?? incomingCallContent.phone_number ?? 'Unknown'}
                        </span>
                        {incomingCallContent.phone_number && (
                            <span className="small text-muted">{incomingCallContent.phone_number}</span>
                        )}
                    </div>
                    <span className="badge bg-secondary rounded-0 flex-shrink-0">Incoming</span>
                </PhoneHistoryRowButton>
            )}
            {showVoicemailRow && (
                <PhoneHistoryRowButton
                    onClick={onSelectVoicemail}
                    className="d-flex align-items-center gap-3 py-3 px-3 border border-secondary border-top-0 rounded-0 bg-white"
                    aria-label="Voicemail"
                >
                    <ProfileIcon />
                    <span className="fw-medium flex-grow-1">Voicemail</span>
                    <span className="badge bg-secondary rounded-0">New</span>
                </PhoneHistoryRowButton>
            )}
            <div className="list-group list-group-flush">
                {filteredEntries.map((entry) => {
                    const kind = entryKind(entry);
                    const isVoicemail = kind === 'voicemail';
                    const handleClick = () => {
                        if (isVoicemail) onSelectVoicemail();
                        else onSelectEntry?.(entry.id);
                    };
                    const actionable = isVoicemail || !!onSelectEntry;
                    const primary = entry.name ?? entry.number ?? 'Unknown';
                    const secondary = entry.name != null && entry.number ? entry.number : null;
                    return (
                        actionable ? (
                            <PhoneHistoryRowButton
                                key={entry.id}
                                onClick={handleClick}
                                className="d-flex align-items-center gap-3 py-3 px-2 border border-secondary border-top-0 rounded-0 bg-light"
                            >
                                <ProfileIcon />
                                <div className="d-flex flex-column min-w-0 flex-grow-1">
                                    <span className="fw-medium text-truncate">{primary}</span>
                                    {secondary && <span className="small text-muted text-truncate">{secondary}</span>}
                                    {entry.timestamp != null && (
                                        <span className="small text-muted mt-0">{entry.timestamp}</span>
                                    )}
                                </div>
                                <span className={`badge bg-${kindBadgeVariant(kind)} rounded-0 flex-shrink-0`}>
                                    {kindLabel(kind)}
                                </span>
                            </PhoneHistoryRowButton>
                        ) : (
                            <div
                                key={entry.id}
                                className="d-flex align-items-center gap-3 py-3 px-2 border border-secondary border-top-0 rounded-0 bg-white"
                            >
                                <ProfileIcon />
                                <div className="d-flex flex-column min-w-0 flex-grow-1">
                                    <span className="fw-medium text-truncate">{primary}</span>
                                    {secondary && <span className="small text-muted text-truncate">{secondary}</span>}
                                    {entry.timestamp != null && (
                                        <span className="small text-muted mt-0">{entry.timestamp}</span>
                                    )}
                                </div>
                                <span className={`badge bg-${kindBadgeVariant(kind)} rounded-0 flex-shrink-0`}>
                                    {kindLabel(kind)}
                                </span>
                            </div>
                        )
                    );
                })}
            </div>
            {filteredEntries.length === 0 && !showIncoming && !showVoicemailRow && (
                <p className="text-muted small mt-2 mb-0 px-2">
                    {entries.length === 0 && !incomingCallContent && !hasVoicemail
                        ? 'No recent calls.'
                        : `No results for "${searchQuery}".`}
                </p>
            )}
        </div>
    );
}
