import {
    SIM_BTN_SM,
    SIM_FLEX_COL,
    SIM_FLEX_GROW_1,
    SIM_FLEX_SHRINK_0,
    SIM_LIST_FLUSH_MOD,
    SIM_MIN_W_0,
    SIM_MUTED,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_WHITE,
    SIM_TEXT_BODY,
    SIM_TEXT_BOLD,
    SIM_TEXT_BREAK,
    SIM_TEXT_CENTER,
    SIM_TEXT_MEDIUM,
    SIM_TEXT_SEMIBOLD,
    SIM_TEXT_SM,
    SIM_TEXT_TRUNCATE,
    SimulatorButtonTone,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';
import SimulatorAvatar from '../../ui/media/SimulatorAvatar.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { usePhoneNumberFormatter } from '../../contract/phonePresentation.js';
import { SimulatorListGroup } from '../../ui/lists/SimulatorListGroup.js';
/**
 * Messages app: thread list. Wireframe: list header with plus/add action, search, rows with
 * profile icon, contact, snippet, date.
 */
import { useState, useMemo } from 'react';
import { SimulatorSearchInput } from '../../ui/lists/SimulatorSearchInput.js';
import { simLayout, simRowSurface, simSpacing } from '../../simulatorStyles.js';
import { matchesAnyField } from '../../utils/lists/textMatch.js';
import { SimulatorButton } from '../../ui/primitives.js';
import {
    SIM_MESSAGES,
    SIM_MESSAGES_COMPOSE_ACTION,
    SIM_MESSAGES_THREAD_LIST,
    SIM_MESSAGES_THREAD_ROW,
    SIM_SCREEN_HEADER_ROW,
} from '../../ui/styles/semanticSimulatorClasses.js';

export interface ThreadListRow {
    id: string;
    preview: string;
    senderName?: string;
    avatarUrl?: string;
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

function matchesSearch(row: ThreadListRow, q: string): boolean {
    return matchesAnyField(q, [row.senderName, row.senderNumber, row.preview]);
}

export default function MessagesThreadListView({
    threads,
    onSelectThread,
    onCompose,
}: Readonly<MessagesThreadListViewProps>) {
    const screenLocale = useSimulatorLocale();

    const formatNumber = usePhoneNumberFormatter();
    const [searchQuery, setSearchQuery] = useState('');
    const filtered = useMemo(
        () => threads.filter((row) => matchesSearch(row, searchQuery)),
        [threads, searchQuery],
    );
    // SimulatorListGroup renders the empty message in place of its children.
    const content = (
        <div className={joinClasses(SIM_LIST_FLUSH_MOD, simSpacing.mt1, SIM_MESSAGES_THREAD_LIST)}>
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
                    <SimulatorAvatar key={row.avatarUrl} avatarUrl={row.avatarUrl} />
                    <div className={joinClasses(SIM_FLEX_COL, SIM_MIN_W_0, SIM_FLEX_GROW_1)}>
                        <span
                            className={joinClasses(
                                'simulator-messages__thread-title',
                                SIM_TEXT_MEDIUM,
                                SIM_TEXT_TRUNCATE,
                                row.unread && SIM_TEXT_BOLD,
                            )}
                        >
                            {row.senderName ??
                                (row.senderNumber ? formatNumber(row.senderNumber) : 'Unknown')}
                        </span>
                        <span
                            className={joinClasses(
                                SIM_TEXT_SM,
                                SIM_MUTED,
                                'simulator-messages__thread-preview',
                                SIM_TEXT_BREAK,
                            )}
                            style={{ lineHeight: 1.35 }}
                        >
                            {row.preview}
                        </span>
                    </div>
                    {row.timestamp != null && (
                        <span
                            className={joinClasses(
                                SIM_TEXT_SM,
                                SIM_MUTED,
                                SIM_FLEX_SHRINK_0,
                                'simulator-messages__thread-time',
                                'simulator-flex--align-end',
                            )}
                        >
                            {row.timestamp}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );

    return (
        <div className={joinClasses(simLayout.stack, SIM_MESSAGES)}>
            <div className={joinClasses(simLayout.headerRowBetween, SIM_SCREEN_HEADER_ROW)}>
                <span
                    className={joinClasses(
                        SIM_FLEX_GROW_1,
                        SIM_TEXT_CENTER,
                        SIM_TEXT_SM,
                        SIM_TEXT_SEMIBOLD,
                        SIM_TEXT_BODY,
                    )}
                >
                    {screenLocale.t('screen.messagesThreadListView.threads')}
                </span>
                {onCompose != null && (
                    <SimulatorButton
                        tone={SimulatorButtonTone.PrimaryOutline}
                        className={joinClasses(
                            SIM_ROUNDED_NONE,
                            simSpacing.py1,
                            simSpacing.px2,
                            simSpacing.me2,
                            SIM_BTN_SM,
                            SIM_MESSAGES_COMPOSE_ACTION,
                        )}
                        onClick={onCompose}
                        aria-label={screenLocale.t('screen.messagesThreadListView.new.thread')}
                    >
                        {screenLocale.t('screen.messagesThreadListView.new.thread')}
                    </SimulatorButton>
                )}
            </div>
            <SimulatorListGroup
                empty={filtered.length === 0}
                emptyMessage={
                    threads.length === 0
                        ? screenLocale.t('screen.messagesThreadListView.no.conversations')
                        : screenLocale.t('screen.messagesThreadListView.no.results.for.value1', {
                              value1: String(searchQuery),
                          })
                }
                search={
                    <SimulatorSearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder={screenLocale.t('screen.messagesThreadListView.search.threads')}
                        ariaLabel={screenLocale.t('a11y.search.threads')}
                        className={simSpacing.mb3}
                    />
                }
            >
                {content}
            </SimulatorListGroup>
        </div>
    );
}
