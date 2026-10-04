import {
    SIM_INPUT,
    SIM_LIST_ERROR,
    SimulatorButtonTone,
    simBtnToneClass,
} from '../../ui/styles/simulatorClasses.js';
import { UserRound, Search } from 'lucide-react';
import { useDevicePage } from '../../hooks/device/useDevicePage.js';
import { useDeviceRecord } from '../../hooks/device/useDeviceRecord.js';
import { LoadMore } from '../../ui/lists/LoadMore.js';
import { useVisiblePage } from '../../hooks/device/useVisiblePage.js';
import { SimulatorListGroup } from '../../ui/lists/SimulatorListGroup.js';
import { useRef, useState, type ReactNode, type RefObject } from 'react';
import { DevicePage } from '../shared/DevicePage.js';
import { AppSecondaryNav, type AppNavAction } from '../shared/AppSecondaryNav.js';
import type { DeviceStore } from '@signalsafe/simulator-core/apps/store';
import {
    mailFolderSchema,
    mailSchema,
    type Asset,
    type Mail,
} from '@signalsafe/simulator-core/apps/contracts';
import { mailTime, newMail, replyMail } from '@signalsafe/simulator-core/apps/mail';
import {
    localEmailService,
    type SimulatorEmailService,
} from '@signalsafe/simulator-core/apps/emailService';
import { useSimulatorAppsHost } from '../shared/SimulatorAppsHost.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';

export interface MailboxSource {
    id: string;
    label: string;
    render: (onCompose: (mail: Mail) => void) => ReactNode;
}

type ReplyKind = 'reply' | 'reply-all' | 'forward';
type MailFolder = Mail['folder'];
type Translate = ReturnType<typeof useSimulatorLocale>['t'];
type MailPage = ReturnType<typeof useDevicePage<'mail'>>;
type VisiblePage = ReturnType<typeof useVisiblePage>;

const OUTLINE = simBtnToneClass(SimulatorButtonTone.NeutralOutline);
const DRAFT_FIELDS = ['to', 'cc', 'bcc', 'subject'] as const;
const MAX_ATTACHMENTS = 20;

function useMailPersist(store: DeviceStore) {
    const { t } = useSimulatorLocale();
    const [error, setError] = useState('');
    async function persist(next: Mail, edited = false): Promise<boolean> {
        const parsed = mailSchema.safeParse({
            ...next,
            updatedAt: edited ? new Date().toISOString() : next.updatedAt,
        });
        if (!parsed.success) {
            setError(t('app.mail.limits'));
            return false;
        }
        return store.put('mail', parsed.data);
    }
    return { error, setError, persist };
}

function useMailNav(onBack: () => void) {
    const [source, setSource] = useState<string | null>(null);
    const [folder, setFolder] = useState<MailFolder | null>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    function closeTo(next: MailFolder) {
        setSource(null);
        setSelected(null);
        setFolder(next);
    }
    function openFolder(next: MailFolder) {
        setFolder(next);
        setQuery('');
    }
    function back() {
        if (source) setSource(null);
        else if (selected) setSelected(null);
        else if (folder) {
            setFolder(null);
            setQuery('');
        } else onBack();
    }
    return {
        source,
        setSource,
        folder,
        selected,
        setSelected,
        query,
        setQuery,
        closeTo,
        openFolder,
        back,
    };
}

function useMailDraft({
    identity,
    storeBusy,
    emailService,
    setError,
    persist,
    onSaved,
}: Readonly<{
    identity: string;
    storeBusy: boolean;
    emailService: SimulatorEmailService;
    setError: (message: string) => void;
    persist: (next: Mail, edited?: boolean) => Promise<boolean>;
    onSaved: (folder: MailFolder) => void;
}>) {
    const { readAsset } = useSimulatorAppsHost();
    const { t } = useSimulatorLocale();
    const [draft, setDraft] = useState<Mail | null>(null);
    const baseline = useRef<Mail | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const [reading, setReading] = useState(false);
    const [sending, setSending] = useState(false);
    const busy = storeBusy || reading || sending;

    function edit(next: Mail) {
        baseline.current = next;
        setDraft(next);
        setError('');
    }
    function compose(source?: Mail, kind: ReplyKind = 'reply') {
        setError('');
        edit(source ? replyMail(source, identity, kind) : newMail(identity));
    }
    function leave() {
        if (
            JSON.stringify(draft) === JSON.stringify(baseline.current) ||
            window.confirm(t('app.mail.discardConfirm'))
        )
            setDraft(null);
    }
    async function commit(next: Mail, edited: boolean) {
        if (!(await persist(next, edited))) return;
        setDraft(null);
        onSaved(next.folder);
    }
    async function send(current: Mail) {
        if (busy) return;
        setSending(true);
        setError('');
        try {
            await commit(await emailService.send(current), false);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : t('app.mail.sendFailed'));
        } finally {
            setSending(false);
        }
    }
    async function attach(current: Mail, file: File) {
        if (current.attachments.length >= MAX_ATTACHMENTS) {
            setError(t('app.mail.attachmentLimit'));
            return;
        }
        setReading(true);
        try {
            const asset = await readAsset(file);
            setDraft((previous) =>
                previous?.id === current.id
                    ? { ...previous, attachments: [...previous.attachments, asset] }
                    : previous,
            );
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : t('app.mail.attachmentFailed'));
        } finally {
            setReading(false);
        }
    }
    return {
        draft,
        setDraft,
        busy,
        formRef,
        edit,
        compose,
        leave,
        send,
        attach,
        save: (current: Mail) => commit(current, true),
    };
}

function MailDraftAttachments({
    draft,
    busy,
    onChange,
}: Readonly<{ draft: Mail; busy: boolean; onChange: (draft: Mail) => void }>) {
    const { t } = useSimulatorLocale();
    const remove = (index: number) =>
        onChange({
            ...draft,
            attachments: draft.attachments.filter((_, offset) => index !== offset),
        });
    return (
        <ul className="prototype-list">
            {draft.attachments.map((asset, index) => (
                <li key={`${index}-${asset.name}`}>
                    {asset.name}
                    <button
                        className={OUTLINE}
                        type="button"
                        disabled={busy}
                        onClick={() => remove(index)}
                    >
                        {t('app.mail.removeAttachment', { name: asset.name })}
                    </button>
                </li>
            ))}
        </ul>
    );
}

function MailDraftForm({
    draft,
    busy,
    formRef,
    onChange,
    onSubmit,
    onAttach,
}: Readonly<{
    draft: Mail;
    busy: boolean;
    formRef: RefObject<HTMLFormElement>;
    onChange: (draft: Mail) => void;
    onSubmit: () => void;
    onAttach: (file: File) => void;
}>) {
    const { t } = useSimulatorLocale();
    const fieldLabels = {
        to: t('app.mail.fieldTo'),
        cc: t('app.mail.fieldCc'),
        bcc: t('app.mail.fieldBcc'),
        subject: t('app.mail.fieldSubject'),
    };
    return (
        <form
            ref={formRef}
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
            }}
        >
            <p>{t('app.mail.from', { value: draft.from })}</p>
            {DRAFT_FIELDS.map((field) => (
                <label key={field}>
                    {fieldLabels[field]}
                    <input
                        className={SIM_INPUT}
                        disabled={busy}
                        value={draft[field]}
                        onChange={(event) => onChange({ ...draft, [field]: event.target.value })}
                    />
                </label>
            ))}
            <label>
                {t('app.mail.body')}
                <textarea
                    className="simulator-textarea"
                    rows={10}
                    disabled={busy}
                    value={draft.body}
                    onChange={(event) => onChange({ ...draft, body: event.target.value })}
                />
            </label>
            <label>
                {t('app.mail.addAttachment')}
                <input
                    className={SIM_INPUT}
                    type="file"
                    disabled={busy}
                    accept="image/png,image/jpeg,image/webp,text/plain,application/pdf"
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = '';
                        if (file) onAttach(file);
                    }}
                />
            </label>
            <MailDraftAttachments draft={draft} busy={busy} onChange={onChange} />
        </form>
    );
}

function MailHeaders({
    message,
    formatDate,
}: Readonly<{ message: Mail; formatDate: (date: Date) => string }>) {
    const { t } = useSimulatorLocale();
    return (
        <>
            <h3>{message.subject || t('app.mail.noSubject')}</h3>
            <p>{t('app.mail.from', { value: message.from })}</p>
            {message.sourceRecordId && (
                <p>{t('app.mail.importedSource', { id: message.sourceRecordId })}</p>
            )}
            <p>{t('app.mail.to', { value: message.to })}</p>
            {message.cc && <p>{t('app.mail.cc', { value: message.cc })}</p>}
            {message.bcc && <p>{t('app.mail.bcc', { value: message.bcc })}</p>}
            <p>{formatDate(new Date(message.createdAt))}</p>
            <p className="prototype-message-body">{message.body}</p>
        </>
    );
}

function MailThread({
    thread,
    threadPage,
    busy,
    onOpen,
}: Readonly<{
    thread: MailPage;
    threadPage: VisiblePage;
    busy: boolean;
    onOpen: (id: string) => void;
}>) {
    const { t } = useSimulatorLocale();
    return (
        <details>
            <summary>{t('app.mail.thread')}</summary>
            {thread.records
                .filter((item) => item.folder !== mailFolderSchema.enum.trash)
                .map((item) => (
                    <button
                        className={OUTLINE}
                        key={item.id}
                        disabled={busy}
                        onClick={() => onOpen(item.id)}
                    >
                        {item.subject || t('app.mail.noSubject')}
                    </button>
                ))}
            {thread.error && (
                <p className={SIM_LIST_ERROR} role="alert">
                    {thread.error}
                </p>
            )}
            <LoadMore
                count={threadPage.count}
                hasMore={threadPage.count < thread.total}
                loading={thread.loading}
                error={thread.error}
                onLoadMore={thread.error ? thread.retry : threadPage.loadMore}
                label={t('app.mail.loadMoreThread')}
            />
        </details>
    );
}

function MailAttachmentLinks({ attachments }: Readonly<{ attachments: readonly Asset[] }>) {
    return (
        <ul className="prototype-list">
            {attachments.map((asset, index) => (
                <li key={`${index}-${asset.name}`}>
                    <a href={asset.data} download={asset.name}>
                        {asset.name}
                    </a>
                </li>
            ))}
        </ul>
    );
}

interface MessageActions {
    openThread: (id: string) => void;
    compose: (message: Mail, kind: ReplyKind) => void;
    toggleRead: (message: Mail) => void;
    moveToTrash: (message: Mail) => void;
    restore: (message: Mail) => void;
    remove: (message: Mail) => void;
}

function MailMessageActions({
    message,
    busy,
    storeBusy,
    actions,
}: Readonly<{ message: Mail; busy: boolean; storeBusy: boolean; actions: MessageActions }>) {
    const { t } = useSimulatorLocale();
    return (
        <div className="prototype-actions">
            {message.folder !== mailFolderSchema.enum.drafts && (
                <>
                    <button
                        className={OUTLINE}
                        disabled={busy}
                        onClick={() => actions.compose(message, 'reply-all')}
                    >
                        {t('app.mail.replyAll')}
                    </button>
                    <button
                        className={OUTLINE}
                        disabled={busy}
                        onClick={() => actions.compose(message, 'forward')}
                    >
                        {t('app.mail.forward')}
                    </button>
                </>
            )}
            <button
                className={OUTLINE}
                disabled={storeBusy}
                onClick={() => actions.toggleRead(message)}
            >
                {message.read ? t('app.mail.markUnread') : t('app.mail.markRead')}
            </button>
            {message.folder === mailFolderSchema.enum.trash ? (
                <>
                    <button
                        className={OUTLINE}
                        disabled={storeBusy}
                        onClick={() => actions.restore(message)}
                    >
                        {t('app.mail.restore')}
                    </button>
                    <button
                        className={OUTLINE}
                        disabled={storeBusy}
                        onClick={() => actions.remove(message)}
                    >
                        {t('app.mail.deletePermanently')}
                    </button>
                </>
            ) : (
                <button
                    className={OUTLINE}
                    disabled={storeBusy}
                    onClick={() => actions.moveToTrash(message)}
                >
                    {t('app.mail.moveToTrash')}
                </button>
            )}
        </div>
    );
}

function MailMessageView({
    message,
    thread,
    threadPage,
    busy,
    storeBusy,
    formatDate,
    actions,
}: Readonly<{
    message: Mail;
    thread: MailPage;
    threadPage: VisiblePage;
    busy: boolean;
    storeBusy: boolean;
    formatDate: (date: Date) => string;
    actions: MessageActions;
}>) {
    return (
        <article>
            <MailHeaders message={message} formatDate={formatDate} />
            <MailThread
                thread={thread}
                threadPage={threadPage}
                busy={busy}
                onOpen={actions.openThread}
            />
            <MailAttachmentLinks attachments={message.attachments} />
            <MailMessageActions
                message={message}
                busy={busy}
                storeBusy={storeBusy}
                actions={actions}
            />
        </article>
    );
}

function MailFolderList({
    sources,
    counts,
    folderLabels,
    onSource,
    onFolder,
}: Readonly<{
    sources: readonly MailboxSource[];
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
            <button className={OUTLINE} disabled={busy} onClick={() => onOpen(item)}>
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

function MailList({
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
            {page.error && (
                <p className={SIM_LIST_ERROR} role="alert">
                    {page.error}
                </p>
            )}
            <LoadMore
                count={visiblePage.count}
                hasMore={visiblePage.count < page.total}
                loading={page.loading}
                error={page.error}
                onLoadMore={page.error ? page.retry : visiblePage.loadMore}
                label={t('app.mail.loadMore')}
            />
            {!page.loading && !page.error && mails.length === 0 && (
                <p className="simulator-list-group__empty">
                    {query ? t('app.mail.noSearchResults') : t('app.mail.noMessages')}
                </p>
            )}
        </SimulatorListGroup>
    );
}

function mailTitle(
    t: Translate,
    hasDraft: boolean,
    hasMessage: boolean,
    folderName: string | null,
) {
    if (hasDraft) return t('app.mail.newEmail');
    return !hasMessage && folderName !== null ? folderName : t('app.mail.title');
}

function primaryLabel(t: Translate, message: Mail | null) {
    if (!message) return t('app.mail.compose');
    return message.folder === mailFolderSchema.enum.drafts
        ? t('app.mail.editDraft')
        : t('app.mail.reply');
}

function MailboxScreen({
    store,
    identity,
    onBack,
    emailService = localEmailService,
    sources = [],
    displayMail = (mail) => mail,
}: Readonly<{
    store: DeviceStore;
    identity: string;
    sources?: readonly MailboxSource[];
    displayMail?: (mail: Mail) => Mail;
    emailService?: SimulatorEmailService;
    onBack: () => void;
}>) {
    const { formatDate } = useSimulatorAppsHost();
    const { t } = useSimulatorLocale();
    const folderLabels = {
        inbox: t('app.mail.folder.inbox'),
        sent: t('app.mail.folder.sent'),
        drafts: t('app.mail.folder.drafts'),
        trash: t('app.mail.folder.trash'),
    } satisfies Record<MailFolder, string>;
    const nav = useMailNav(onBack);
    const { error, setError, persist } = useMailPersist(store);
    const editor = useMailDraft({
        identity,
        storeBusy: store.busy,
        emailService,
        setError,
        persist,
        onSaved: nav.closeTo,
    });
    const { draft, busy } = editor;
    const selectedSource = sources.find((item) => item.id === nav.source);
    const visiblePage = useVisiblePage(JSON.stringify([nav.folder, nav.query]));
    const page = useDevicePage(
        store,
        'mail',
        { folder: nav.folder ?? '', search: nav.query },
        visiblePage.count,
        nav.folder !== null,
    );
    const selectedRecord = useDeviceRecord(store, 'mail', nav.selected);
    const message = selectedRecord.record ? displayMail(selectedRecord.record) : null;
    const threadPage = useVisiblePage(message?.threadId ?? '');
    const thread = useDevicePage(
        store,
        'mail',
        { threadId: message?.threadId },
        threadPage.count,
        Boolean(message),
    );
    const mails = page.records.map(displayMail);

    async function commit(next: Mail) {
        if (await persist(next)) nav.closeTo(next.folder);
    }
    async function openMail(item: Mail) {
        if (!item.read) await persist({ ...item, read: true });
        nav.setSelected(item.id);
    }
    async function removeMessage(target: Mail) {
        if (window.confirm(t('app.mail.deleteConfirm')) && (await store.remove('mail', target.id)))
            nav.setSelected(null);
    }
    const actions: MessageActions = {
        openThread: nav.setSelected,
        compose: editor.compose,
        toggleRead: (target) => void persist({ ...target, read: !target.read }),
        moveToTrash: (target) =>
            void commit({
                ...target,
                previousFolder: target.folder as Mail['previousFolder'],
                folder: mailFolderSchema.enum.trash,
            }),
        restore: (target) => void commit({ ...target, folder: target.previousFolder }),
        remove: (target) => void removeMessage(target),
    };
    const back = () => {
        if (draft) editor.leave();
        else nav.back();
    };
    const folderName = nav.folder
        ? folderLabels[nav.folder]
        : (selectedSource?.label ?? t('app.mail.folders'));
    const primary = () => {
        if (!message) editor.compose();
        else if (message.folder === mailFolderSchema.enum.drafts) editor.edit(message);
        else editor.compose(message);
    };
    const navActions: AppNavAction[] = draft
        ? [
              {
                  label: t('action.send'),
                  icon: '➤',
                  disabled: busy,
                  onClick: () => editor.formRef.current?.requestSubmit(),
              },
              {
                  label: t('app.mail.saveDraft'),
                  icon: '✓',
                  disabled: busy,
                  onClick: () => void editor.save(draft),
              },
          ]
        : [
              {
                  label: message ? t('app.mail.message') : folderName,
                  icon: '📧',
                  active: true,
                  onClick: () => {},
              },
              { label: primaryLabel(t, message), icon: '✎', disabled: busy, onClick: primary },
          ];
    navActions.push({ label: t('app.back'), icon: '↩', disabled: busy, onClick: back });

    function renderBody(): ReactNode {
        if (draft)
            return (
                <MailDraftForm
                    draft={draft}
                    busy={busy}
                    formRef={editor.formRef}
                    onChange={editor.setDraft}
                    onSubmit={() => void editor.send(draft)}
                    onAttach={(file) => void editor.attach(draft, file)}
                />
            );
        if (selectedSource) return selectedSource.render(editor.edit);
        if (message)
            return (
                <MailMessageView
                    message={message}
                    thread={thread}
                    threadPage={threadPage}
                    busy={busy}
                    storeBusy={store.busy}
                    formatDate={formatDate}
                    actions={actions}
                />
            );
        if (nav.folder === null)
            return (
                <MailFolderList
                    sources={sources}
                    counts={store.counts}
                    folderLabels={folderLabels}
                    onSource={nav.setSource}
                    onFolder={nav.openFolder}
                />
            );
        return (
            <MailList
                folder={nav.folder}
                query={nav.query}
                onQuery={nav.setQuery}
                mails={mails}
                page={page}
                visiblePage={visiblePage}
                busy={busy}
                formatDate={formatDate}
                onOpen={(item) => void openMail(item)}
            />
        );
    }

    return (
        <DevicePage
            listLayout={!draft && !message}
            title={mailTitle(t, Boolean(draft), Boolean(message), nav.folder ? folderName : null)}
            onBack={back}
            navigation={<AppSecondaryNav actions={navActions} />}
        >
            {error && <p role="alert">{error}</p>}
            {selectedRecord.error && (
                <>
                    <p className={SIM_LIST_ERROR} role="alert">
                        {selectedRecord.error}
                    </p>
                    <LoadMore
                        count={0}
                        hasMore={false}
                        loading={selectedRecord.loading}
                        error={selectedRecord.error}
                        onLoadMore={selectedRecord.retry}
                        label={t('app.retry')}
                    />
                </>
            )}
            {renderBody()}
        </DevicePage>
    );
}

export default function Mailbox(
    props: Readonly<{
        store: DeviceStore;
        sources?: readonly MailboxSource[];
        displayMail?: (mail: Mail) => Mail;
        emailService?: SimulatorEmailService;
        onBack: () => void;
    }>,
) {
    const data = props.store.data;
    if (!data) return null;
    return <MailboxScreen {...props} identity={data.identity} />;
}
