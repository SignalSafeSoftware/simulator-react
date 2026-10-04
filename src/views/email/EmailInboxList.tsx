import {
    SIM_BTN_SM,
    SIM_FLEX_COL,
    SIM_FLEX_GROW_1,
    SIM_FLEX_SHRINK_0,
    SIM_LIST_FLUSH_MOD,
    SIM_MIN_W_0,
    SIM_MUTED,
    SIM_ROUNDED_NONE,
    SIM_TEXT_BODY,
    SIM_TEXT_BOLD,
    SIM_TEXT_BREAK,
    SIM_TEXT_CENTER,
    SIM_TEXT_MEDIUM,
    SIM_TEXT_SEMIBOLD,
    SIM_TEXT_SM,
    SIM_TEXT_START,
    SIM_TEXT_TRUNCATE,
    SimulatorBadgeTone,
    SimulatorButtonTone,
    joinClasses,
    simBadgeToneClass,
} from '../../ui/styles/simulatorClasses.js';
import SimulatorAvatar from '../../ui/media/SimulatorAvatar.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { SimulatorListGroup } from '../../ui/lists/SimulatorListGroup.js';
/**
 * Reusable email inbox list: wireframe rows (profile icon, sender, snippet, date, Read/Unread tag).
 * Optional search bar and compose (pencil) button.
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { SimulatorInboxRow } from '../../types/session.js';
import { SimulatorSearchInput } from '../../ui/lists/SimulatorSearchInput.js';
import { simLayout, simRowSurface, simSpacing, simTypo } from '../../simulatorStyles.js';
import { matchesAnyField } from '../../utils/lists/textMatch.js';
import { SimulatorButton } from '../../ui/primitives.js';
import {
    SIM_EMAIL_INBOX,
    SIM_EMAIL_COMPOSE_ACTION,
    SIM_EMAIL_MESSAGE_ROW,
    SIM_EMAIL_STATUS_BADGE,
    SIM_SCREEN_HEADER_ROW,
} from '../../ui/styles/semanticSimulatorClasses.js';

export interface EmailInboxListProps {
    inbox: SimulatorInboxRow[];
    selectedMessageId: string | null;
    onSelectMessage: (messageId: string) => void;
    /** Optional folder label (e.g. "Inbox", "Outbox", "Trash"). */
    folderLabel?: string;
    /** Folder behavior is independent of its displayed label. */
    folder?: 'inbox' | 'outbox' | 'trash';
    /** When set, show pencil icon to open compose. */
    onCompose?: () => void;
    /** Optional controlled search; when omitted, local state is used and list is filtered. */
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    onSearchSubmit?: (query: string) => void;
}

function matchesSearch(row: SimulatorInboxRow, q: string): boolean {
    return matchesAnyField(q, [row.subject, row.from, row.from_display_name, row.snippet]);
}

export default function EmailInboxList({
    inbox,
    selectedMessageId,
    onSelectMessage,
    folderLabel,
    folder = 'inbox',
    onCompose,
    searchQuery: controlledQuery,
    onSearchChange: controlledSetQuery,
    onSearchSubmit,
}: Readonly<EmailInboxListProps>) {
    const screenLocale = useSimulatorLocale();

    const [localQuery, setLocalQuery] = useState('');
    const isControlled = controlledQuery !== undefined && controlledSetQuery !== undefined;
    const searchQuery = isControlled ? controlledQuery : localQuery;
    const setSearchQuery = isControlled ? controlledSetQuery : setLocalQuery;

    const filtered = useMemo(
        () => inbox.filter((row) => matchesSearch(row, searchQuery)),
        [inbox, searchQuery],
    );
    let content: ReactNode;
    if (inbox.length === 0 || filtered.length === 0) {
        content = (
            <p
                className={joinClasses(
                    simTypo.emptyState,
                    simSpacing.pt3,
                    simSpacing.px2,
                    SIM_TEXT_START,
                )}
            >
                {inbox.length > 0 ? (
                    <>
                        {screenLocale.t('screen.emailInboxList.no.results.for')}
                        {searchQuery}&quot;.
                    </>
                ) : folder === 'trash' ? (
                    screenLocale.t('screen.emailInboxList.no.emails.in.trash')
                ) : (
                    screenLocale.t('screen.emailInboxList.no.emails')
                )}
            </p>
        );
    } else {
        content = (
            <div className={joinClasses(SIM_LIST_FLUSH_MOD, simSpacing.mt2)}>
                {filtered.map((row) => (
                    <button
                        type="button"
                        key={row.id}
                        onClick={() => onSelectMessage(row.id)}
                        className={joinClasses(
                            simRowSurface.selectable,
                            selectedMessageId === row.id
                                ? simRowSurface.selected
                                : simRowSurface.default,
                            SIM_EMAIL_MESSAGE_ROW,
                        )}
                        style={{ cursor: 'pointer' }}
                    >
                        <SimulatorAvatar />
                        <div className={joinClasses(SIM_FLEX_COL, SIM_MIN_W_0, SIM_FLEX_GROW_1)}>
                            <span
                                className={joinClasses(
                                    SIM_TEXT_MEDIUM,
                                    SIM_TEXT_TRUNCATE,
                                    row.unread && SIM_TEXT_BOLD,
                                )}
                            >
                                {row.from_display_name != null && row.from_display_name !== ''
                                    ? row.from_display_name
                                    : row.from}
                            </span>
                            {row.snippet != null && row.snippet !== '' && (
                                <span
                                    className={joinClasses(SIM_TEXT_SM, SIM_MUTED, SIM_TEXT_BREAK)}
                                    style={{ lineHeight: 1.35 }}
                                >
                                    {row.snippet}
                                </span>
                            )}
                            {row.date_at != null && (
                                <span
                                    className={joinClasses(SIM_TEXT_SM, SIM_MUTED, simSpacing.mt1)}
                                >
                                    {row.date_at}
                                </span>
                            )}
                        </div>
                        <span
                            className={joinClasses(
                                simBadgeToneClass(
                                    row.unread
                                        ? SimulatorBadgeTone.Primary
                                        : SimulatorBadgeTone.Neutral,
                                ),
                                SIM_ROUNDED_NONE,
                                SIM_FLEX_SHRINK_0,
                                SIM_EMAIL_STATUS_BADGE,
                            )}
                        >
                            {row.unread
                                ? screenLocale.t('screen.emailInboxList.unread')
                                : screenLocale.t('screen.emailInboxList.read')}
                        </span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className={joinClasses(simLayout.stack, SIM_EMAIL_INBOX)}>
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
                    {folderLabel ?? screenLocale.t(`nav.${folder}`)}
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
                            SIM_EMAIL_COMPOSE_ACTION,
                        )}
                        onClick={onCompose}
                        aria-label={screenLocale.t('screen.emailInboxList.compose.email')}
                    >
                        {screenLocale.t('screen.emailInboxList.compose')}
                    </SimulatorButton>
                )}
            </div>
            <SimulatorListGroup
                search={
                    <SimulatorSearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onSubmit={onSearchSubmit ?? (() => {})}
                        placeholder={screenLocale.t('screen.emailInboxList.search')}
                        ariaLabel={screenLocale.t('list.search')}
                        className={simSpacing.mb2}
                    />
                }
            >
                {content}
            </SimulatorListGroup>
        </div>
    );
}
