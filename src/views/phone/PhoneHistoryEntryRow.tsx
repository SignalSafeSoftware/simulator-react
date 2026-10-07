import { Fragment, type ReactNode } from 'react';
import { usePhoneNumberFormatter } from '../../contract/phonePresentation.js';
import { useTimestampFormatter } from '../../contract/regionalPresentation.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { CallHistoryEntryKind, type SimulatorCallHistoryEntry } from '../../types/session.js';
import { SimulatorAvatar } from '../../ui/media/SimulatorAvatar.js';
import {
    SIM_PHONE_HISTORY_ACTIONS,
    SIM_PHONE_HISTORY_ENTRY,
    SIM_CALL_STATUS_BADGE,
} from '../../ui/styles/semanticSimulatorClasses.js';
import {
    SIM_FLEX_COL,
    SIM_FLEX_GROW_1,
    SIM_FLEX_SHRINK_0,
    SIM_MIN_W_0,
    SIM_MUTED,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_LIGHT,
    SIM_SURFACE_WHITE,
    SIM_TEXT_MEDIUM,
    SIM_TEXT_SM,
    SIM_TEXT_TRUNCATE,
    joinClasses,
    simBadgeToneClass,
} from '../../ui/styles/simulatorClasses.js';
import {
    kindStatusBadgeClass,
    kindBadgeTone,
    listRowClass,
    PhoneHistoryRowButton,
} from './phoneHistoryHelpers.js';

export interface PhoneHistoryEntryRowProps {
    entry: SimulatorCallHistoryEntry;
    entriesSelectable: boolean;
    selectedEntryId?: string | null;
    onSelectEntry?: (id: string) => void;
    onSelectVoicemail: () => void;
    renderEntryActions?: (entry: SimulatorCallHistoryEntry) => ReactNode;
}

/** One call-history row with its status badge and optional host actions. */
export function PhoneHistoryEntryRow({
    entry,
    entriesSelectable,
    selectedEntryId,
    onSelectEntry,
    onSelectVoicemail,
    renderEntryActions,
}: Readonly<PhoneHistoryEntryRowProps>) {
    const formatNumber = usePhoneNumberFormatter();
    const formatTimestamp = useTimestampFormatter();
    const { t } = useSimulatorLocale();
    const kind = entry.kind;
    const isVoicemail = kind === CallHistoryEntryKind.Voicemail;
    const handleClick = () => {
        if (isVoicemail) onSelectVoicemail();
        else onSelectEntry?.(entry.id);
    };
    const actionable = entriesSelectable && (isVoicemail || !!onSelectEntry);
    const primary = entry.name || (entry.number ? formatNumber(entry.number) : t('value.unknown'));
    const displayNumber =
        entry.displayNumber ?? (entry.number ? formatNumber(entry.number) : undefined);
    const secondary = [entry.numberLabel, displayNumber !== primary ? displayNumber : null]
        .filter(Boolean)
        .join(' · ');
    const rowSurface = joinClasses(
        listRowClass,
        kind === CallHistoryEntryKind.Incoming || kind === CallHistoryEntryKind.Missed
            ? SIM_SURFACE_LIGHT
            : SIM_SURFACE_WHITE,
    );
    const badgeClass = joinClasses(
        simBadgeToneClass(kindBadgeTone(kind)),
        SIM_CALL_STATUS_BADGE,
        kindStatusBadgeClass(kind),
        SIM_ROUNDED_NONE,
        SIM_FLEX_SHRINK_0,
    );
    const rowContent = (
        <>
            <SimulatorAvatar />
            <div className={joinClasses(SIM_FLEX_COL, SIM_MIN_W_0, SIM_FLEX_GROW_1)}>
                <span className={joinClasses(SIM_TEXT_MEDIUM, SIM_TEXT_TRUNCATE)}>{primary}</span>
                {secondary && (
                    <span className={joinClasses(SIM_TEXT_SM, SIM_MUTED, SIM_TEXT_TRUNCATE)}>
                        {secondary}
                    </span>
                )}
                {entry.durationSeconds != null && (
                    <span className={joinClasses(SIM_TEXT_SM, SIM_MUTED)}>
                        {t('calls.duration', {
                            minutes: Math.floor(entry.durationSeconds / 60),
                            seconds: entry.durationSeconds % 60,
                        })}
                    </span>
                )}
                {entry.timestamp != null && (
                    <span className={joinClasses(SIM_TEXT_SM, SIM_MUTED)}>
                        {formatTimestamp(entry.timestamp)}
                    </span>
                )}
            </div>
            <span className={badgeClass}>
                {t(
                    kind === CallHistoryEntryKind.Incoming ||
                        kind === CallHistoryEntryKind.Outgoing ||
                        kind === CallHistoryEntryKind.Missed ||
                        kind === CallHistoryEntryKind.Voicemail
                        ? `calls.${kind}`
                        : 'calls.unknown',
                )}
            </span>
        </>
    );
    const actions = renderEntryActions?.(entry);
    const row = actionable ? (
        <PhoneHistoryRowButton
            onClick={handleClick}
            className={rowSurface}
            selected={selectedEntryId === entry.id}
            entryId={entry.id}
        >
            {rowContent}
        </PhoneHistoryRowButton>
    ) : (
        <div
            className={rowSurface}
            aria-current={(entriesSelectable && selectedEntryId === entry.id) || undefined}
        >
            {rowContent}
        </div>
    );
    return actions != null ? (
        <div className={SIM_PHONE_HISTORY_ENTRY}>
            {row}
            <div className={SIM_PHONE_HISTORY_ACTIONS}>{actions}</div>
        </div>
    ) : (
        <Fragment>{row}</Fragment>
    );
}
