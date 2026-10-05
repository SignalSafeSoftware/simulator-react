/**
 * Phone History tab: list of recent calls by kind (incoming, outgoing, missed, voicemail)
 * + optional scenario incoming-call row + optional Voicemail summary row.
 * All row kinds share the same avatar, identity, and status layout.
 */
import { SimulatorAvatar } from '../../ui/media/SimulatorAvatar.js';
import { PhoneHistoryEntryRow } from './PhoneHistoryEntryRow.js';
import { usePhoneNumberFormatter } from '../../contract/phonePresentation.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { SimulatorListGroup } from '../../ui/lists/SimulatorListGroup.js';
import { useState, useMemo, type ReactNode } from 'react';
import { type SimulatorCallHistoryEntry } from '../../types/session.js';
import { type PhoneSimulatorContent } from '../../types/template.js';
import { SimulatorSearchInput } from '../../ui/lists/SimulatorSearchInput.js';
import { simLayout, simSpacing } from '../../simulatorStyles.js';
import {
    SIM_FLEX_COL,
    SIM_FLEX_GROW_1,
    SIM_FLEX_SHRINK_0,
    SIM_LIST_FLUSH_MOD,
    SIM_MIN_W_0,
    SIM_MUTED,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_WHITE,
    SIM_TEXT_MEDIUM,
    SIM_TEXT_SM,
    SIM_TEXT_TRUNCATE,
    SimulatorBadgeTone,
    joinClasses,
    simBadgeToneClass,
} from '../../ui/styles/simulatorClasses.js';
import {
    SIM_PHONE_INCOMING_CALL_HISTORY,
    SIM_PHONE_HISTORY_INCOMING_ROW,
    SIM_PHONE_HISTORY_SEARCH,
    SIM_CALL_STATUS_BADGE,
    SIM_CALL_STATUS_BADGE_INCOMING,
} from '../../ui/styles/semanticSimulatorClasses.js';
import {
    matchesSearch,
    incomingMatchesSearch,
    listRowClass,
    PhoneHistoryRowButton,
} from './phoneHistoryHelpers.js';

export interface PhoneHistoryListProps {
    entries: SimulatorCallHistoryEntry[];
    /** When set, show an incoming-call row that navigates to incoming_call. */
    incomingCallContent?: PhoneSimulatorContent | null;
    /** When true, show a Voicemail row and allow opening voicemail (e.g. when transcript exists). */
    hasVoicemail?: boolean;
    onSelectIncoming: () => void;
    onSelectVoicemail: () => void;
    onSelectEntry?: (id: string) => void;
    /** Disable row navigation and selection for informational call-detail entries. */
    entriesSelectable?: boolean;
    /** Controlled search value. Omit to retain the built-in local search state. */
    searchQuery?: string;
    onSearchQueryChange?: (query: string) => void;
    searchAriaLabel?: string;
    /** Current selection is announced on its native row without changing navigation. */
    selectedEntryId?: string | null;
    /** Host actions render beside the native row, never inside its button. */
    renderEntryActions?: (entry: SimulatorCallHistoryEntry) => ReactNode;
}

export default function PhoneHistoryList({
    entries,
    incomingCallContent,
    hasVoicemail,
    onSelectIncoming,
    onSelectVoicemail,
    onSelectEntry,
    entriesSelectable = true,
    searchQuery: controlledSearchQuery,
    onSearchQueryChange,
    searchAriaLabel,
    selectedEntryId,
    renderEntryActions,
}: Readonly<PhoneHistoryListProps>) {
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
    const noHistory = entries.length === 0 && !incomingCallContent && !hasVoicemail;

    return (
        <div className={joinClasses(simLayout.stack, SIM_PHONE_INCOMING_CALL_HISTORY)}>
            <SimulatorListGroup
                empty={filteredEntries.length === 0 && !showIncoming && !showVoicemailRow}
                emptyMessage={
                    noHistory ? t('calls.empty') : t('search.empty', { query: searchQuery })
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
                        className={joinClasses(listRowClass, SIM_PHONE_HISTORY_INCOMING_ROW)}
                        ariaLabel={t('a11y.incoming.call')}
                    >
                        <SimulatorAvatar />
                        <div className={joinClasses(SIM_FLEX_COL, SIM_MIN_W_0, SIM_FLEX_GROW_1)}>
                            <span className={joinClasses(SIM_TEXT_MEDIUM, SIM_TEXT_TRUNCATE)}>
                                {incomingCallContent.caller_name ??
                                    incomingCallContent.phone_number ??
                                    t('screen.phoneHistoryList.unknown')}
                            </span>
                            {incomingCallContent.phone_number && (
                                <span className={joinClasses(SIM_TEXT_SM, SIM_MUTED)}>
                                    {formatNumber(incomingCallContent.phone_number)}
                                </span>
                            )}
                        </div>
                        <span
                            className={joinClasses(
                                simBadgeToneClass(SimulatorBadgeTone.Success),
                                SIM_CALL_STATUS_BADGE,
                                SIM_CALL_STATUS_BADGE_INCOMING,
                                SIM_ROUNDED_NONE,
                                SIM_FLEX_SHRINK_0,
                            )}
                        >
                            {t('screen.phoneHistoryList.incoming')}
                        </span>
                    </PhoneHistoryRowButton>
                )}
                {showVoicemailRow && (
                    <PhoneHistoryRowButton
                        onClick={onSelectVoicemail}
                        className={joinClasses(listRowClass, SIM_SURFACE_WHITE)}
                        ariaLabel={t('a11y.voicemail')}
                    >
                        <SimulatorAvatar />
                        <span className={joinClasses(SIM_TEXT_MEDIUM, SIM_FLEX_GROW_1)}>
                            {t('screen.phoneHistoryList.voicemail')}
                        </span>
                        <span
                            className={joinClasses(
                                simBadgeToneClass(SimulatorBadgeTone.Neutral),
                                SIM_ROUNDED_NONE,
                            )}
                        >
                            {t('screen.phoneHistoryList.new')}
                        </span>
                    </PhoneHistoryRowButton>
                )}
                <div className={SIM_LIST_FLUSH_MOD}>
                    {filteredEntries.map((entry) => (
                        <PhoneHistoryEntryRow
                            key={entry.id}
                            entry={entry}
                            entriesSelectable={entriesSelectable}
                            selectedEntryId={selectedEntryId}
                            onSelectEntry={onSelectEntry}
                            onSelectVoicemail={onSelectVoicemail}
                            renderEntryActions={renderEntryActions}
                        />
                    ))}
                </div>
            </SimulatorListGroup>
        </div>
    );
}
