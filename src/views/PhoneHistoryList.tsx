/**
 * Phone History tab: list of recent calls by kind (incoming, outgoing, missed, voicemail)
 * + optional "Incoming call" card + optional Voicemail summary row.
 * Wireframe: search bar ("Q Search"), profile icon (left), name/number, date, rectangular status tag.
 */
import { useState, useMemo } from 'react';
import type { SimulatorCallHistoryEntry, CallHistoryEntryKind } from '../types/session.js';
import type { PhoneSimulatorContent } from '../types/portableSimulator.js';
import { SimulatorSearchInput } from '../components/SimulatorSearchInput.js';
import { simBorder, simLayout, simSpacing } from '../simulatorStyles.js';
import {
    joinClasses,
    SIM_AVATAR,
    SIM_FLEX_COL,
    SIM_FLEX_GROW_1,
    SIM_FLEX_SHRINK_0,
    SIM_MUTED,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_AVATAR,
    SIM_SURFACE_LIGHT,
    SIM_SURFACE_WHITE,
    SIM_TEXT_SM,
    SIM_TEXT_START,
    simBadgeToneClass,
} from '../ui/simulatorClasses.js';

/** Light blue profile icon for call/contact rows (wireframe). */
function ProfileIcon({ className }: Readonly<{ className?: string }>) {
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

function kindBadgeTone(kind: CallHistoryEntryKind): string {
    switch (kind) {
        case 'missed': return 'danger';
        case 'voicemail': return 'neutral';
        case 'outgoing': return 'primary';
        case 'incoming': return 'success';
        default: return 'neutral';
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

const rowButtonBase = joinClasses(
    simLayout.row,
    simSpacing.gap2,
    SIM_TEXT_START,
    'simulator-w-full',
);

const incomingCardClass = joinClasses(
    rowButtonBase,
    simSpacing.p3,
    simSpacing.mb2,
    simBorder.tile,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_LIGHT,
    'simulator-text--dark',
);

const listRowClass = joinClasses(
    rowButtonBase,
    simSpacing.py3,
    simSpacing.px2,
    simBorder.tile,
    'simulator-border--top-none',
    SIM_ROUNDED_NONE,
);

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
            className={className}
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
        <div className={simLayout.stack}>
            <SimulatorSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={() => {}}
                placeholder="Q Search"
                ariaLabel="Search calls"
                className={simSpacing.mb2}
            />
            {showIncoming && (
                <PhoneHistoryRowButton
                    onClick={onSelectIncoming}
                    className={incomingCardClass}
                    aria-label="Incoming call"
                >
                    <ProfileIcon />
                    <div className={joinClasses(SIM_FLEX_COL, 'simulator-min-w-0', SIM_FLEX_GROW_1)}>
                        <span className={joinClasses('simulator-text--medium', 'simulator-text--truncate')}>
                            {incomingCallContent.caller_name ?? incomingCallContent.phone_number ?? 'Unknown'}
                        </span>
                        {incomingCallContent.phone_number && (
                            <span className={joinClasses(SIM_TEXT_SM, SIM_MUTED)}>{incomingCallContent.phone_number}</span>
                        )}
                    </div>
                    <span className={joinClasses(simBadgeToneClass('neutral'), SIM_ROUNDED_NONE, SIM_FLEX_SHRINK_0)}>
                        Incoming
                    </span>
                </PhoneHistoryRowButton>
            )}
            {showVoicemailRow && (
                <PhoneHistoryRowButton
                    onClick={onSelectVoicemail}
                    className={joinClasses(listRowClass, SIM_SURFACE_WHITE)}
                    aria-label="Voicemail"
                >
                    <ProfileIcon />
                    <span className={joinClasses('simulator-text--medium', SIM_FLEX_GROW_1)}>Voicemail</span>
                    <span className={joinClasses(simBadgeToneClass('neutral'), SIM_ROUNDED_NONE)}>New</span>
                </PhoneHistoryRowButton>
            )}
            <div className="simulator-list--flush">
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
                    const rowSurface = joinClasses(
                        listRowClass,
                        kind === 'incoming' || kind === 'missed' ? SIM_SURFACE_LIGHT : SIM_SURFACE_WHITE,
                    );
                    const badgeClass = joinClasses(
                        simBadgeToneClass(kindBadgeTone(kind)),
                        SIM_ROUNDED_NONE,
                        SIM_FLEX_SHRINK_0,
                    );
                    const rowContent = (
                        <>
                            <ProfileIcon />
                            <div className={joinClasses(SIM_FLEX_COL, 'simulator-min-w-0', SIM_FLEX_GROW_1)}>
                                <span className={joinClasses('simulator-text--medium', 'simulator-text--truncate')}>{primary}</span>
                                {secondary && <span className={joinClasses(SIM_TEXT_SM, SIM_MUTED, 'simulator-text--truncate')}>{secondary}</span>}
                                {entry.timestamp != null && (
                                    <span className={joinClasses(SIM_TEXT_SM, SIM_MUTED)}>{entry.timestamp}</span>
                                )}
                            </div>
                            <span className={badgeClass}>{kindLabel(kind)}</span>
                        </>
                    );
                    return actionable ? (
                        <PhoneHistoryRowButton key={entry.id} onClick={handleClick} className={rowSurface}>
                            {rowContent}
                        </PhoneHistoryRowButton>
                    ) : (
                        <div key={entry.id} className={rowSurface}>{rowContent}</div>
                    );
                })}
            </div>
            {filteredEntries.length === 0 && !showIncoming && !showVoicemailRow && (
                <p className={joinClasses(SIM_MUTED, SIM_TEXT_SM, simSpacing.mt2, simSpacing.mb0, simSpacing.px2)}>
                    {entries.length === 0 && !incomingCallContent && !hasVoicemail
                        ? 'No recent calls.'
                        : `No results for "${searchQuery}".`}
                </p>
            )}
        </div>
    );
}
