import { SIM_INPUT, SIM_BTN_OUTLINE } from '../../ui/styles/simulatorClasses.js';
import { UserRound, Search } from 'lucide-react';
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
            className="prototype-list prototype-mail-folders"
            aria-label={t('app.mail.foldersList')}
        >
            {sources.map((item) => (
                <li key={item.id}>
                    <button type="button" onClick={() => onSource(item.id)}>
                        {item.label}
                    </button>
                </li>
            ))}
            {mailFolderSchema.options.map((value) => (
                <li key={value}>
                    <button type="button" onClick={() => onFolder(value)}>
                        <span>{folderLabels[value]}</span>
                        <span className="prototype-folder-count">{counts?.mail[value] ?? 0}</span>
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
    return (
        <li>
            <button className={SIM_BTN_OUTLINE} disabled={busy} onClick={() => onOpen(item)}>
                <span
                    className="prototype-mail-avatar simulator-avatar simulator-surface--avatar"
                    aria-hidden="true"
                >
                    <UserRound size={24} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span className="prototype-mail-content">
                    <span className="prototype-mail-heading">
                        <strong>
                            {!item.read && '● '}
                            {item.subject || t('app.mail.noSubject')}
                        </strong>
                        <time dateTime={mailTime(item)}>
                            {formatDate(new Date(mailTime(item)))}
                        </time>
                    </span>
                    <span>{outgoing ? item.to : item.from}</span>
                    <span>{item.body.slice(0, 100)}</span>
                </span>
            </button>
        </li>
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
                <div className="prototype-mail-search">
                    <Search size={16} aria-hidden="true" />
                    <input
                        type="search"
                        className={SIM_INPUT}
                        value={query}
                        onChange={(event) => onQuery(event.target.value)}
                        placeholder={t('app.mail.search')}
                        aria-label={t('app.mail.search')}
                    />
                </div>
            }
        >
            <ul className="prototype-list prototype-mail-list">
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
                <p className="simulator-list-group__empty">
                    {query ? t('app.mail.noSearchResults') : t('app.mail.noMessages')}
                </p>
            )}
        </SimulatorListGroup>
    );
}
