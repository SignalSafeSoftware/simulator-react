/**
 * Phone History tab: list of recent calls by kind (incoming, outgoing, missed, voicemail)
 * + optional scenario incoming-call row + optional Voicemail summary row.
 * All row kinds share the same avatar, identity, and status layout.
 */
import { CallHistoryEntryKind, type SimulatorCallHistoryEntry } from '../../types/session.js';
import { type PhoneSimulatorContent } from '../../types/template.js';
import { simLayout, simSpacing } from '../../simulatorStyles.js';
import { matchesAnyField } from '../../utils/lists/textMatch.js';
import {
    SIM_TEXT_START,
    SIM_W_FULL,
    SimulatorBadgeTone,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';
import {
    SIM_PHONE_HISTORY_ROW,
    SIM_CALL_STATUS_BADGE_INCOMING,
    SIM_CALL_STATUS_BADGE_MISSED,
    SIM_CALL_STATUS_BADGE_OUTBOUND,
    SIM_CALL_STATUS_BADGE_UNKNOWN,
} from '../../ui/styles/semanticSimulatorClasses.js';

export function kindStatusBadgeClass(kind: CallHistoryEntryKind): string {
    switch (kind) {
        case CallHistoryEntryKind.Missed:
            return SIM_CALL_STATUS_BADGE_MISSED;
        case CallHistoryEntryKind.Outgoing:
            return SIM_CALL_STATUS_BADGE_OUTBOUND;
        case CallHistoryEntryKind.Incoming:
            return SIM_CALL_STATUS_BADGE_INCOMING;
        default:
            return SIM_CALL_STATUS_BADGE_UNKNOWN;
    }
}

export function kindBadgeTone(kind: CallHistoryEntryKind): string {
    switch (kind) {
        case CallHistoryEntryKind.Missed:
            return SimulatorBadgeTone.Danger;
        case CallHistoryEntryKind.Voicemail:
            return SimulatorBadgeTone.Neutral;
        case CallHistoryEntryKind.Outgoing:
            return SimulatorBadgeTone.Primary;
        case CallHistoryEntryKind.Incoming:
            return SimulatorBadgeTone.Success;
        default:
            return SimulatorBadgeTone.Neutral;
    }
}

export function matchesSearch(entry: SimulatorCallHistoryEntry, q: string): boolean {
    return matchesAnyField(q, [entry.name, entry.number, entry.timestamp, entry.label]);
}

export function incomingMatchesSearch(
    content: PhoneSimulatorContent | null | undefined,
    q: string,
): boolean {
    return !content || matchesAnyField(q, [content.caller_name, content.phone_number]);
}

export const rowButtonBase = joinClasses(
    simLayout.row,
    simSpacing.gap2,
    SIM_TEXT_START,
    SIM_W_FULL,
);

export const listRowClass = joinClasses(rowButtonBase, SIM_PHONE_HISTORY_ROW);

export function PhoneHistoryRowButton({
    onClick,
    className,
    ariaLabel,
    selected,
    entryId,
    children,
}: Readonly<{
    onClick: () => void;
    className: string;
    ariaLabel?: string;
    selected?: boolean;
    entryId?: string;
    children: React.ReactNode;
}>): JSX.Element {
    return (
        <button
            type='button'
            onClick={onClick}
            className={className}
            style={{ cursor: 'pointer' }}
            aria-label={ariaLabel}
            aria-current={selected || undefined}
            data-simulator-history-id={entryId}
        >
            {children}
        </button>
    );
}
