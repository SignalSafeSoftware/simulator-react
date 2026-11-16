import { SIM_INPUT } from '../../ui/styles/simulatorClasses.js';
import { INPUT_TYPE_SEARCH } from '../../constants.js';
import { Search } from 'lucide-react';
import { MailMessageRow } from './MailMessageRow.js';
import { PagedListFooter } from '../shared/PagedListFooter.js';
import { SimulatorListGroup } from '../../ui/lists/SimulatorListGroup.js';
import type { DeviceStore } from '@signalsafe/simulator-core/apps/store';
import { mailFolderSchema, type Mail } from '@signalsafe/simulator-core/apps/contracts';
import { mailTime } from '@signalsafe/simulator-core/apps/mail';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { type MailFolder, type MailPage, type VisiblePage } from './mailShared.js';

export function MailFolderList({
    sources,
    counts,
    folderLabels,
    onSource,
    onFolder,
}: Readonly<{
    sources: readonly Readonly<{ id: string; label: string }>[];
    counts: DeviceStore['counts'];
    folderLabels: Record<MailFolder, string>;
    onSource: (id: string) => void;
    onFolder: (folder: MailFolder) => void;
}>) {
    const { t } = useSimulatorLocale();
    return (
        <ul
            className='prototype-list prototype-mail-folders'
            aria-label={t('app.mail.foldersList')}
        >
            {sources.map((item) => (
                <li key={item.id}>
                    <button type='button' onClick={() => onSource(item.id)}>
                        {item.label}
                    </button>
                </li>
            ))}
            {[
                ...mailFolderSchema.options,
                ...Object.keys(counts?.mail ?? {})
                    .filter((value) => !mailFolderSchema.safeParse(value).success)
                    .sort((a, b) => a.localeCompare(b)),
            ].map((value) => (
                <li key={value}>
                    <button type='button' onClick={() => onFolder(value)}>
                        <span>
                            {Object.hasOwn(folderLabels, value) ? folderLabels[value] : value}
                        </span>
                        <span className='prototype-folder-count'>{counts?.mail[value] ?? 0}</span>
                    </button>
                </li>
            ))}
        </ul>
    );
}

function MailListItem({
    item,
    folder,
    busy,
    formatDate,
    onOpen,
}: Readonly<{
    item: Mail;
    folder: MailFolder;
    busy: boolean;
    formatDate: (date: Date) => string;
    onOpen: (item: Mail) => void;
}>) {
    const { t } = useSimulatorLocale();
    const outgoing =
        folder === mailFolderSchema.enum.sent || folder === mailFolderSchema.enum.drafts;
    const dateTime = mailTime(item);
    return (
        <MailMessageRow
            id={item.id}
            subject={item.subject}
            address={outgoing ? item.to : item.from}
            snippet={item.body.slice(0, 100)}
            dateTime={dateTime || undefined}
            dateText={dateTime ? formatDate(new Date(dateTime)) : t('app.mail.dateUnknown')}
            unread={!item.read}
            disabled={busy}
            onOpen={() => onOpen(item)}
        />
    );
}

export function MailList({
    folder,
    query,
    onQuery,
    mails,
    page,
    visiblePage,
    busy,
    formatDate,
    onOpen,
}: Readonly<{
    folder: MailFolder;
    query: string;
    onQuery: (query: string) => void;
    mails: readonly Mail[];
    page: MailPage;
    visiblePage: VisiblePage;
    busy: boolean;
    formatDate: (date: Date) => string;
    onOpen: (item: Mail) => void;
}>) {
    const { t } = useSimulatorLocale();
    return (
        <SimulatorListGroup
            search={
                <div className='prototype-mail-search'>
                    <Search size={16} aria-hidden='true' />
                    <input
                        type={INPUT_TYPE_SEARCH}
                        className={SIM_INPUT}
                        value={query}
                        onChange={(event) => onQuery(event.target.value)}
                        placeholder={t('app.mail.search')}
                        aria-label={t('app.mail.search')}
                    />
                </div>
            }
        >
            <ul className='prototype-list prototype-mail-list'>
                {mails.map((item) => (
                    <MailListItem
                        key={item.id}
                        item={item}
                        folder={folder}
                        busy={busy}
                        formatDate={formatDate}
                        onOpen={onOpen}
                    />
                ))}
            </ul>
            <PagedListFooter page={page} visible={visiblePage} label={t('app.mail.loadMore')} />
            {!page.loading && !page.error && mails.length === 0 && (
                <p className='simulator-list-group__empty'>
                    {query ? t('app.mail.noSearchResults') : t('app.mail.noMessages')}
                </p>
            )}
        </SimulatorListGroup>
    );
}
