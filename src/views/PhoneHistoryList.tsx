import { usePhoneNumberFormatter } from '../contract/phonePresentation.js';
import { useSimulatorLocale } from '../i18n/SimulatorLocale.js';
import { SimulatorListGroup } from '../components/SimulatorListGroup.js';
/**
 * Phone History tab: list of recent calls by kind (incoming, outgoing, missed, voicemail)
 * + optional "Incoming call" card + optional Voicemail summary row.
 * Wireframe: search bar, profile icon (left), name/number, date, rectangular status tag.
 */
import { Fragment, useState, useMemo, type ReactNode } from 'react';
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
import {
    SIM_PHONE_INCOMING_CALL_HISTORY,
    SIM_PHONE_HISTORY_INCOMING_ROW,
    SIM_PHONE_HISTORY_ROW,
    SIM_PHONE_HISTORY_ENTRY,
    SIM_PHONE_HISTORY_ACTIONS,
    SIM_PHONE_HISTORY_SEARCH,
    SIM_CALL_STATUS_BADGE,
    SIM_CALL_STATUS_BADGE_INCOMING,
    SIM_CALL_STATUS_BADGE_MISSED,
    SIM_CALL_STATUS_BADGE_OUTBOUND,
    SIM_CALL_STATUS_BADGE_UNKNOWN,
} from '../ui/semanticSimulatorClasses.js';

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
            <span className="simulator-text--primary" style={{ fontSize: '1.25rem' }}>
                👤
            </span>
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
    /** Controlled search value. Omit to retain the built-in local search state. */
    searchQuery?: string;
    onSearchQueryChange?: (query: string) => void;
    searchAriaLabel?: string;
    /** Current selection is announced on its native row without changing navigation. */
    selectedEntryId?: string | null;
    /** Host actions render beside the native row, never inside its button. */
    renderEntryActions?: (entry: SimulatorCallHistoryEntry) => ReactNode;
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

function kindStatusBadgeClass(kind: CallHistoryEntryKind): string {
    switch (kind) {
        case 'missed':
            return SIM_CALL_STATUS_BADGE_MISSED;
        case 'outgoing':
            return SIM_CALL_STATUS_BADGE_OUTBOUND;
        case 'incoming':
            return SIM_CALL_STATUS_BADGE_INCOMING;
        default:
            return SIM_CALL_STATUS_BADGE_UNKNOWN;
    }
}

function kindBadgeTone(kind: CallHistoryEntryKind): string {
    switch (kind) {
        case 'missed':
            return 'danger';
        case 'voicemail':
            return 'neutral';
        case 'outgoing':
            return 'primary';
        case 'incoming':
            return 'success';
        default:
            return 'neutral';
    }
}

function matchesSearch(entry: SimulatorCallHistoryEntry, q: string): boolean {
    if (!q.trim()) return true;
    const lower = q.toLowerCase().trim();
    const name = (entry.name ?? '').toLowerCase();
    const number = (entry.number ?? '').toLowerCase();
    const timestamp = (entry.timestamp ?? '').toLowerCase();
    const label = (entry.label ?? '').toLowerCase();
    return (
        name.includes(lower) ||
        number.includes(lower) ||
        timestamp.includes(lower) ||
        label.includes(lower)
    );
}

function incomingMatchesSearch(
    content: PhoneSimulatorContent | null | undefined,
    q: string,
): boolean {
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
    selected,
    children,
}: Readonly<{
    onClick: () => void;
    className: string;
    ariaLabel?: string;
    selected?: boolean;
    children: React.ReactNode;
}>): JSX.Element {
    return (
        <button
            type="button"
            onClick={onClick}
            className={className}
            style={{ cursor: 'pointer' }}
            aria-label={ariaLabel}
            aria-current={selected || undefined}
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
    searchQuery: controlledSearchQuery,
    onSearchQueryChange,
    searchAriaLabel,
    selectedEntryId,
    renderEntryActions,
}: Readonly<PhoneHistoryListProps>) {
    const screenLocale = useSimulatorLocale();

    const formatNumber = usePhoneNumberFormatter();
    const { t } = useSimulatorLocale();
    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const searchQuery = controlledSearchQuery ?? localSearchQuery;
    const setSearchQuery = (query: string) => {
        if (controlledSearchQuery === undefined) setLocalSearchQuery(query);
        onSearchQueryChange?.(query);
    };
    const filteredEntries = useMemo(
        () => entries.filter((e) => matchesSearch(e, searchQuery)),
        [entries, searchQuery],
    );
    const showIncoming =
        incomingCallContent != null && incomingMatchesSearch(incomingCallContent, searchQuery);
    const showVoicemailRow =
        hasVoicemail &&
        (!searchQuery.trim() || 'voicemail'.includes(searchQuery.toLowerCase().trim()));

    return (
        <div className={joinClasses(simLayout.stack, SIM_PHONE_INCOMING_CALL_HISTORY)}>
            <SimulatorListGroup
                empty={filteredEntries.length === 0 && !showIncoming && !showVoicemailRow}
                emptyMessage={
                    entries.length === 0 && !incomingCallContent && !hasVoicemail
                        ? t('calls.empty')
                        : t('search.empty', { query: searchQuery })
                }
                search={
                    <SimulatorSearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder={t('calls.search')}
                        ariaLabel={searchAriaLabel ?? t('calls.search')}
                        className={joinClasses(simSpacing.mb2, SIM_PHONE_HISTORY_SEARCH)}
                    />
                }
            >
                {showIncoming && (
                    <PhoneHistoryRowButton
                        onClick={onSelectIncoming}
                        className={joinClasses(incomingCardClass, SIM_PHONE_HISTORY_INCOMING_ROW)}
                        ariaLabel={screenLocale.t('a11y.incoming.call')}
                    >
                        <ProfileIcon />
                        <div
                            className={joinClasses(
                                SIM_FLEX_COL,
                                'simulator-min-w-0',
                                SIM_FLEX_GROW_1,
                            )}
                        >
                            <span
                                className={joinClasses(
                                    'simulator-text--medium',
                                    'simulator-text--truncate',
                                )}
                            >
                                {incomingCallContent.caller_name ??
                                    incomingCallContent.phone_number ??
                                    screenLocale.t('screen.phoneHistoryList.unknown')}
                            </span>
                            {incomingCallContent.phone_number && (
                                <span className={joinClasses(SIM_TEXT_SM, SIM_MUTED)}>
                                    {formatNumber(incomingCallContent.phone_number)}
                                </span>
                            )}
                        </div>
                        <span
                            className={joinClasses(
                                simBadgeToneClass('neutral'),
                                SIM_CALL_STATUS_BADGE,
                                SIM_CALL_STATUS_BADGE_INCOMING,
                                SIM_ROUNDED_NONE,
                                SIM_FLEX_SHRINK_0,
                            )}
                        >
                            {screenLocale.t('screen.phoneHistoryList.incoming')}
                        </span>
                    </PhoneHistoryRowButton>
                )}
                {showVoicemailRow && (
                    <PhoneHistoryRowButton
                        onClick={onSelectVoicemail}
                        className={joinClasses(listRowClass, SIM_SURFACE_WHITE)}
                        ariaLabel={screenLocale.t('a11y.voicemail')}
                    >
                        <ProfileIcon />
                        <span className={joinClasses('simulator-text--medium', SIM_FLEX_GROW_1)}>
                            {screenLocale.t('screen.phoneHistoryList.voicemail')}
                        </span>
                        <span
                            className={joinClasses(simBadgeToneClass('neutral'), SIM_ROUNDED_NONE)}
                        >
                            {screenLocale.t('screen.phoneHistoryList.new')}
                        </span>
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
                        const primary =
                            entry.name ||
                            (entry.number ? formatNumber(entry.number) : t('value.unknown'));
                        const displayNumber =
                            entry.displayNumber ??
                            (entry.number ? formatNumber(entry.number) : undefined);
                        const secondary = [
                            entry.numberLabel,
                            displayNumber !== primary ? displayNumber : null,
                        ]
                            .filter(Boolean)
                            .join(' · ');
                        const rowSurface = joinClasses(
                            listRowClass,
                            SIM_PHONE_HISTORY_ROW,
                            kind === 'incoming' || kind === 'missed'
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
                                <ProfileIcon />
                                <div
                                    className={joinClasses(
                                        SIM_FLEX_COL,
                                        'simulator-min-w-0',
                                        SIM_FLEX_GROW_1,
                                    )}
                                >
                                    <span
                                        className={joinClasses(
                                            'simulator-text--medium',
                                            'simulator-text--truncate',
                                        )}
                                    >
                                        {primary}
                                    </span>
                                    {secondary && (
                                        <span
                                            className={joinClasses(
                                                SIM_TEXT_SM,
                                                SIM_MUTED,
                                                'simulator-text--truncate',
                                            )}
                                        >
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
                                            {entry.timestamp}
                                        </span>
                                    )}
                                </div>
                                <span className={badgeClass}>
                                    {t(
                                        kind === 'incoming' ||
                                            kind === 'outgoing' ||
                                            kind === 'missed' ||
                                            kind === 'voicemail'
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
                            >
                                {rowContent}
                            </PhoneHistoryRowButton>
                        ) : (
                            <div
                                className={rowSurface}
                                aria-current={selectedEntryId === entry.id || undefined}
                            >
                                {rowContent}
                            </div>
                        );
                        return actions != null ? (
                            <div key={entry.id} className={SIM_PHONE_HISTORY_ENTRY}>
                                {row}
                                <div className={SIM_PHONE_HISTORY_ACTIONS}>{actions}</div>
                            </div>
                        ) : (
                            <Fragment key={entry.id}>{row}</Fragment>
                        );
                    })}
                </div>
                {filteredEntries.length === 0 && !showIncoming && !showVoicemailRow && (
                    <p
                        className={joinClasses(
                            SIM_MUTED,
                            SIM_TEXT_SM,
                            simSpacing.mt2,
                            simSpacing.mb0,
                            simSpacing.px2,
                        )}
                    >
                        {entries.length === 0 && !incomingCallContent && !hasVoicemail
                            ? t('calls.empty')
                            : t('search.empty', { query: searchQuery })}
                    </p>
                )}
            </SimulatorListGroup>
        </div>
    );
}
