import { MailMessageRow } from '../../apps/mail/MailMessageRow.js';
/**
 * Reusable email inbox list: wireframe rows (profile icon, sender, snippet, date, Read/Unread tag).
 * Optional search bar and compose (pencil) button.
 */
import {
    SIM_BTN_SM,
    SIM_FLEX_GROW_1,
    SIM_ROUNDED_NONE,
    SIM_TEXT_BODY,
    SIM_TEXT_CENTER,
    SIM_TEXT_SEMIBOLD,
    SIM_TEXT_SM,
    SIM_TEXT_START,
    SimulatorButtonTone,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { SimulatorListGroup } from '../../ui/lists/SimulatorListGroup.js';
import { useState, useMemo, type ReactNode } from 'react';
import type { SimulatorInboxRow } from '../../types/session.js';
import { SimulatorSearchInput } from '../../ui/lists/SimulatorSearchInput.js';
import { simLayout, simSpacing, simTypo } from '../../simulatorStyles.js';
import { matchesAnyField } from '../../utils/lists/textMatch.js';
import { SimulatorButton } from '../../ui/primitives.js';
import {
    SIM_EMAIL_INBOX,
    SIM_EMAIL_COMPOSE_ACTION,
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
        let emptyMessage: ReactNode = screenLocale.t('screen.emailInboxList.no.emails');
        if (inbox.length > 0) {
            emptyMessage = (
                <>
                    {screenLocale.t('screen.emailInboxList.no.results.for')}
                    {searchQuery}&quot;.
                </>
            );
        } else if (folder === 'trash') {
            emptyMessage = screenLocale.t('screen.emailInboxList.no.emails.in.trash');
        }
        content = (
            <p
                className={joinClasses(
                    simTypo.emptyState,
                    simSpacing.pt3,
                    simSpacing.px2,
                    SIM_TEXT_START,
                )}
            >
                {emptyMessage}
            </p>
        );
    } else {
        content = (
            <ul className='prototype-list prototype-mail-list'>
                {filtered.map((row) => (
                    <MailMessageRow
                        id={row.id}
                        key={row.id}
                        subject={row.subject}
                        address={row.from_display_name || row.from}
                        snippet={row.snippet ?? ''}
                        dateText={row.date_at ?? screenLocale.t('app.mail.dateUnknown')}
                        unread={row.unread === true}
                        selected={selectedMessageId === row.id}
                        onOpen={() => onSelectMessage(row.id)}
                    />
                ))}
            </ul>
        );
    }

    return (
        <div className={joinClasses(simLayout.stack, SIM_EMAIL_INBOX, 'prototype-mail-page')}>
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
