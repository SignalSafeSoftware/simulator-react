/**
 * Messages app: thread list. Wireframe: list header with plus/add action, search, rows with
 * profile icon, contact, snippet, date.
 */
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
import { SimulatorAvatar } from '../../ui/media/SimulatorAvatar.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { usePhoneNumberFormatter } from '../../contract/phonePresentation.js';
import { SimulatorListGroup } from '../../ui/lists/SimulatorListGroup.js';
import { useState, useMemo, type ReactNode } from 'react';
import { LoadMore } from '../../ui/lists/LoadMore.js';
import { useTimestampFormatter } from '../../contract/regionalPresentation.js';
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

export interface MessagesThreadContinuation {
    /** Number of matching local rows to show; hosts own the visible-page state. */
    visibleCount: number;
    hasMore: boolean;
    loading: boolean;
    error?: string;
    /** True requests a larger local page; false requests the host's next archive page/retry. */
    onLoadMore: (buffered: boolean) => unknown;
}

export interface MessagesThreadListViewProps {
    threads: readonly ThreadListRow[];
    /** Omit for an independently managed search field. */
    search?: { value: string; onChange: (value: string) => void };
    continuation?: MessagesThreadContinuation;
    /** Photo retrieval belongs to the host; the shared view retains avatar chrome. */
    renderAvatar?: (row: ThreadListRow, fallback: ReactNode) => ReactNode;
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
    search,
    continuation,
    renderAvatar,
}: Readonly<MessagesThreadListViewProps>) {
    const screenLocale = useSimulatorLocale();

    const formatNumber = usePhoneNumberFormatter();
    const formatTimestamp = useTimestampFormatter();
    const [localSearch, setLocalSearch] = useState('');
    const searchQuery = search?.value ?? localSearch;
    const setSearchQuery = search?.onChange ?? setLocalSearch;
    const filtered = useMemo(
        () => threads.filter((row) => matchesSearch(row, searchQuery)),
        [threads, searchQuery],
    );
    const visible = continuation ? filtered.slice(0, continuation.visibleCount) : filtered;
    const buffered = visible.length < filtered.length;
    const hasMore = buffered || Boolean(continuation?.hasMore);
    const loading = !buffered && Boolean(continuation?.loading);
    const error = buffered ? '' : (continuation?.error ?? '');
    const emptyMessage =
        threads.length === 0
            ? screenLocale.t('screen.messagesThreadListView.no.conversations')
            : screenLocale.t('screen.messagesThreadListView.no.results.for.value1', {
                  value1: searchQuery,
              });
    // Continuation controls remain reachable even when the current search has no matches.
    const content = (
        <div className={joinClasses(SIM_LIST_FLUSH_MOD, simSpacing.mt1, SIM_MESSAGES_THREAD_LIST)}>
            {visible.map((row, index) => {
                const sender =
                    row.senderName ??
                    (row.senderNumber
                        ? formatNumber(row.senderNumber)
                        : screenLocale.t('value.unknown'));
                const timestamp =
                    row.timestamp == null ? undefined : formatTimestamp(row.timestamp);
                return (
                    <button
                        type='button'
                        key={row.id}
                        onClick={() => onSelectThread(row.id)}
                        aria-label={[sender, row.preview, timestamp].filter(Boolean).join(' ')}
                        className={joinClasses(
                            simRowSurface.selectable,
                            SIM_SURFACE_WHITE,
                            index === 0 ? 'simulator-border--top' : 'simulator-border--top-none',
                            SIM_MESSAGES_THREAD_ROW,
                        )}
                    >
                        <SimulatorAvatar
                            key={row.avatarUrl}
                            avatarUrl={row.avatarUrl}
                            renderImage={
                                renderAvatar ? (fallback) => renderAvatar(row, fallback) : undefined
                            }
                        />
                        <div className={joinClasses(SIM_FLEX_COL, SIM_MIN_W_0, SIM_FLEX_GROW_1)}>
                            <span
                                className={joinClasses(
                                    'simulator-messages__thread-title',
                                    SIM_TEXT_MEDIUM,
                                    SIM_TEXT_TRUNCATE,
                                    row.unread && SIM_TEXT_BOLD,
                                )}
                            >
                                {sender}
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
                                {timestamp}
                            </span>
                        )}
                    </button>
                );
            })}
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
                loading={continuation ? threads.length === 0 && loading : undefined}
                empty={visible.length === 0 && !hasMore && !error}
                emptyMessage={emptyMessage}
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
                {visible.length === 0 && (hasMore || error) && (
                    <p className='simulator-list-group__empty'>{emptyMessage}</p>
                )}
                {error && (
                    <p className='simulator-list-error' role='alert'>
                        {error}
                    </p>
                )}
                {continuation && (
                    <LoadMore
                        count={visible.length}
                        hasMore={hasMore}
                        loading={loading}
                        error={error}
                        onLoadMore={() => continuation.onLoadMore(buffered)}
                        label={screenLocale.t('screen.messagesThreadListView.load.more')}
                        automatic={!searchQuery.trim()}
                    />
                )}
            </SimulatorListGroup>
        </div>
    );
}
