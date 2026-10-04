import { SimulatorButtonTone, simBtnToneClass } from '../../ui/simulatorClasses.js';
import { UserRound } from 'lucide-react';
import { useDevicePage } from '../../hooks/device/useDevicePage.js';
import { useDeviceRecord } from '../../hooks/device/useDeviceRecord.js';

import { LoadMore } from '../../ui/lists/LoadMore.js';
import { useVisiblePage } from '../../hooks/device/useVisiblePage.js';
import { Search } from 'lucide-react';
import { SimulatorListGroup } from '../../ui/lists/SimulatorListGroup.js';
import { useRef, useState, type ReactNode } from 'react';
import { DevicePage } from '../shared/DevicePage.js';
import { AppSecondaryNav, type AppNavAction } from '../shared/AppSecondaryNav.js';
import type { DeviceStore } from '@signalsafe/simulator-core/apps/store';
import { mailFolderSchema, mailSchema } from '@signalsafe/simulator-core/apps/contracts';
import type { Mail } from '@signalsafe/simulator-core/apps/contracts';
import { mailTime, newMail, replyMail } from '@signalsafe/simulator-core/apps/mail';
import { localEmailService } from '@signalsafe/simulator-core/apps/emailService';
import type { SimulatorEmailService } from '@signalsafe/simulator-core/apps/emailService';
import { useSimulatorAppsHost } from '../shared/SimulatorAppsHost.js';
import { capitalize } from '../../utils/capitalize.js';
export interface MailboxSource {
    id: string;
    label: string;
    render: (onCompose: (mail: Mail) => void) => ReactNode;
}
export default function Mailbox({
    store,
    onBack,
    emailService = localEmailService,
    sources = [],
    displayMail = (mail) => mail,
}: {
    store: DeviceStore;
    sources?: readonly MailboxSource[];
    displayMail?: (mail: Mail) => Mail;
    emailService?: SimulatorEmailService;
    onBack: () => void;
}) {
    const { formatDate: formatRegionalDateTime, readAsset } = useSimulatorAppsHost();
    const [source, setSource] = useState<string | null>(null);
    const selectedSource = sources.find((item) => item.id === source);
    const [folder, setFolder] = useState<Mail['folder'] | null>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const [draft, setDraft] = useState<Mail | null>(null);
    const baseline = useRef<Mail | null>(null);
    const composeForm = useRef<HTMLFormElement>(null);

    const [query, setQuery] = useState('');
    const visiblePage = useVisiblePage(JSON.stringify([folder, query]));
    const [error, setError] = useState('');
    const [reading, setReading] = useState(false);
    const [sending, setSending] = useState(false);
    const busy = store.busy || reading || sending;
    const data = store.data;
    const page = useDevicePage(
        store,
        'mail',
        { folder: folder ?? '', search: query },
        visiblePage.count,
        folder !== null,
    );
    const selectedRecord = useDeviceRecord(store, 'mail', selected);
    const message = selectedRecord.record ? displayMail(selectedRecord.record) : null;
    const threadPage = useVisiblePage(message?.threadId ?? '');
    const thread = useDevicePage(
        store,
        'mail',
        { threadId: message?.threadId },
        threadPage.count,
        Boolean(message),
    );
    const visibleMail = page.records.map(displayMail);
    if (!data) return null;
    async function persist(next: Mail, close = true, edited = false) {
        if (!data) return;
        const parsed = mailSchema.safeParse({
            ...next,
            updatedAt: edited ? new Date().toISOString() : next.updatedAt,
        });
        if (!parsed.success) {
            setError('Message or attachments exceed supported limits.');
            return;
        }
        if ((await store.put('mail', parsed.data)) && close) {
            setDraft(null);
            setSource(null);
            setSelected(null);
            setFolder(next.folder);
        }
    }
    function edit(next: Mail) {
        baseline.current = next;
        setDraft(next);
        setError('');
    }
    function leaveDraft() {
        if (busy) return;
        if (
            JSON.stringify(draft) === JSON.stringify(baseline.current) ||
            window.confirm('Discard unsaved draft changes?')
        )
            setDraft(null);
    }
    function compose(source?: Mail, kind: 'reply' | 'reply-all' | 'forward' = 'reply') {
        if (!data) return;
        setError('');
        edit(source ? replyMail(source, data.identity, kind) : newMail(data.identity));
    }
    const back = () => {
        if (busy) return;
        if (draft) {
            leaveDraft();
        } else if (source) setSource(null);
        else if (selected) setSelected(null);
        else if (folder) {
            setFolder(null);
            setQuery('');
        } else onBack();
    };
    const folderName = folder ? capitalize(folder) : (selectedSource?.label ?? 'Folders');
    const title = draft ? 'New email' : !message && folder ? folderName : 'Email';
    const isDraftMessage = message?.folder === mailFolderSchema.enum.drafts;
    const navActions: AppNavAction[] = draft
        ? [
              {
                  label: 'Send',
                  icon: '➤',
                  disabled: busy,
                  onClick: () => composeForm.current?.requestSubmit(),
              },
              {
                  label: 'Save draft',
                  icon: '✓',
                  disabled: busy,
                  onClick: () => {
                      if (!busy) void persist(draft, true, true);
                  },
              },
          ]
        : [
              {
                  label: message ? 'Message' : folderName,
                  icon: '📧',
                  active: true,
                  onClick: () => {},
              },
              {
                  label: message ? (isDraftMessage ? 'Edit draft' : 'Reply') : 'Compose',
                  icon: '✎',
                  disabled: busy,
                  onClick: () =>
                      message ? (isDraftMessage ? edit(message) : compose(message)) : compose(),
              },
          ];
    navActions.push({ label: 'Back', icon: '↩', disabled: busy, onClick: back });
    return (
        <DevicePage
            listLayout={!draft && !message}
            title={title}
            onBack={back}
            navigation={<AppSecondaryNav actions={navActions} />}
        >
            {error && <p role="alert">{error}</p>}
            {selectedRecord.error && (
                <>
                    <p className="simulator-list-error" role="alert">
                        {selectedRecord.error}
                    </p>
                    <LoadMore
                        count={0}
                        hasMore={false}
                        loading={selectedRecord.loading}
                        error={selectedRecord.error}
                        onLoadMore={selectedRecord.retry}
                        label="Retry"
                    />
                </>
            )}
            {draft ? (
                <form
                    ref={composeForm}
                    onSubmit={async (event) => {
                        event.preventDefault();
                        if (sending || busy) return;
                        setSending(true);
                        setError('');
                        try {
                            await persist(await emailService.send(draft));
                        } catch (reason) {
                            setError(
                                reason instanceof Error
                                    ? reason.message
                                    : 'Email could not be sent. Your draft is still open.',
                            );
                        } finally {
                            setSending(false);
                        }
                    }}
                >
                    <p>From: {draft.from}</p>
                    {(['to', 'cc', 'bcc', 'subject'] as const).map((field) => (
                        <label key={field}>
                            {field === 'subject' ? 'Subject' : field.toUpperCase()}
                            <input
                                className="simulator-input"
                                disabled={busy}
                                value={draft[field]}
                                onChange={(event) =>
                                    setDraft({ ...draft, [field]: event.target.value })
                                }
                            />
                        </label>
                    ))}
                    <label>
                        Body
                        <textarea
                            className="simulator-textarea"
                            rows={10}
                            disabled={busy}
                            value={draft.body}
                            onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                        />
                    </label>
                    <label>
                        Add attachment
                        <input
                            className="simulator-input"
                            type="file"
                            disabled={busy}
                            accept="image/png,image/jpeg,image/webp,text/plain,application/pdf"
                            onChange={async (event) => {
                                const file = event.target.files?.[0];
                                event.target.value = '';
                                if (!file) return;
                                if (draft.attachments.length >= 20) {
                                    setError('A message supports up to 20 attachments.');
                                    return;
                                }
                                const draftId = draft.id;
                                setReading(true);
                                try {
                                    const asset = await readAsset(file);
                                    setDraft((previous) =>
                                        previous?.id === draftId
                                            ? {
                                                  ...previous,
                                                  attachments: [...previous.attachments, asset],
                                              }
                                            : previous,
                                    );
                                } catch (reason) {
                                    setError(
                                        reason instanceof Error
                                            ? reason.message
                                            : 'Attachment could not be read.',
                                    );
                                } finally {
                                    setReading(false);
                                }
                            }}
                        />
                    </label>
                    <ul className="prototype-list">
                        {draft.attachments.map((asset, index) => (
                            <li key={`${index}-${asset.name}`}>
                                {asset.name}
                                <button
                                    className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
                                    type="button"
                                    disabled={busy}
                                    onClick={() =>
                                        setDraft({
                                            ...draft,
                                            attachments: draft.attachments.filter(
                                                (_, offset) => index !== offset,
                                            ),
                                        })
                                    }
                                >
                                    Remove {asset.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </form>
            ) : selectedSource ? (
                selectedSource.render(edit)
            ) : message ? (
                <article>
                    <h3>{message.subject || '(No subject)'}</h3>
                    <p>From: {message.from}</p>
                    {message.sourceRecordId && (
                        <p>
                            Based on imported source record {message.sourceRecordId}. The original
                            is unchanged.
                        </p>
                    )}
                    <p>To: {message.to}</p>
                    {message.cc && <p>CC: {message.cc}</p>}
                    {message.bcc && <p>BCC: {message.bcc}</p>}
                    <p>{formatRegionalDateTime(new Date(message.createdAt))}</p>
                    <p className="prototype-message-body">{message.body}</p>
                    <details>
                        <summary>Messages in this simulated thread</summary>
                        {thread.records
                            .filter((item) => item.folder !== mailFolderSchema.enum.trash)
                            .map((item) => (
                                <button
                                    className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
                                    key={item.id}
                                    disabled={busy}
                                    onClick={() => setSelected(item.id)}
                                >
                                    {item.subject || '(No subject)'}
                                </button>
                            ))}
                        {thread.error && (
                            <p className="simulator-list-error" role="alert">
                                {thread.error}
                            </p>
                        )}
                        <LoadMore
                            count={threadPage.count}
                            hasMore={threadPage.count < thread.total}
                            loading={thread.loading}
                            error={thread.error}
                            onLoadMore={thread.error ? thread.retry : threadPage.loadMore}
                            label="Load more thread messages"
                        />
                    </details>
                    <ul className="prototype-list">
                        {message.attachments.map((asset, index) => (
                            <li key={`${index}-${asset.name}`}>
                                <a href={asset.data} download={asset.name}>
                                    {asset.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                    <div className="prototype-actions">
                        {!isDraftMessage && (
                            <>
                                <button
                                    className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
                                    disabled={busy}
                                    onClick={() => compose(message, 'reply-all')}
                                >
                                    Reply all
                                </button>
                                <button
                                    className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
                                    disabled={busy}
                                    onClick={() => compose(message, 'forward')}
                                >
                                    Forward
                                </button>
                            </>
                        )}
                        <button
                            className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
                            disabled={store.busy}
                            onClick={() => void persist({ ...message, read: !message.read }, false)}
                        >
                            Mark {message.read ? 'unread' : 'read'}
                        </button>
                        {message.folder === mailFolderSchema.enum.trash ? (
                            <>
                                <button
                                    className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
                                    disabled={store.busy}
                                    onClick={() =>
                                        void persist({ ...message, folder: message.previousFolder })
                                    }
                                >
                                    Restore
                                </button>
                                <button
                                    className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
                                    disabled={store.busy}
                                    onClick={async () => {
                                        if (
                                            window.confirm(
                                                'Permanently delete this simulated email?',
                                            ) &&
                                            (await store.remove('mail', message.id))
                                        )
                                            setSelected(null);
                                    }}
                                >
                                    Delete permanently
                                </button>
                            </>
                        ) : (
                            <button
                                className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
                                disabled={store.busy}
                                onClick={() =>
                                    void persist({
                                        ...message,
                                        previousFolder:
                                            message.folder === mailFolderSchema.enum.trash
                                                ? message.previousFolder
                                                : message.folder,
                                        folder: mailFolderSchema.enum.trash,
                                    })
                                }
                            >
                                Move to trash
                            </button>
                        )}
                    </div>
                </article>
            ) : (
                <>
                    {folder === null ? (
                        <ul
                            className="prototype-list prototype-mail-folders"
                            aria-label="Email folders"
                        >
                            {sources.map((item) => (
                                <li key={item.id}>
                                    <button type="button" onClick={() => setSource(item.id)}>
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                            {mailFolderSchema.options.map((value) => (
                                <li key={value}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFolder(value);
                                            setQuery('');
                                        }}
                                    >
                                        <span>{capitalize(value)}</span>
                                        <span className="prototype-folder-count">
                                            {store.counts?.mail[value] ?? 0}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <SimulatorListGroup
                            search={
                                <div className="prototype-mail-search">
                                    <Search size={16} aria-hidden="true" />
                                    <input
                                        type="search"
                                        className="simulator-input"
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        placeholder="Search email"
                                        aria-label="Search email"
                                    />
                                </div>
                            }
                        >
                            <ul className="prototype-list prototype-mail-list">
                                {visibleMail.map((item) => (
                                    <li key={item.id}>
                                        <button
                                            className={simBtnToneClass(
                                                SimulatorButtonTone.NeutralOutline,
                                            )}
                                            disabled={busy}
                                            onClick={async () => {
                                                if (busy) return;
                                                if (item.read) setSelected(item.id);
                                                else {
                                                    await persist({ ...item, read: true }, false);
                                                    setSelected(item.id);
                                                }
                                            }}
                                        >
                                            <span
                                                className="prototype-mail-avatar simulator-avatar simulator-surface--avatar"
                                                aria-hidden="true"
                                            >
                                                <UserRound
                                                    size={24}
                                                    strokeWidth={1.5}
                                                    aria-hidden="true"
                                                />
                                            </span>
                                            <span className="prototype-mail-content">
                                                <span className="prototype-mail-heading">
                                                    <strong>
                                                        {!item.read && '● '}
                                                        {item.subject || '(No subject)'}
                                                    </strong>
                                                    <time dateTime={mailTime(item)}>
                                                        {formatRegionalDateTime(
                                                            new Date(mailTime(item)),
                                                        )}
                                                    </time>
                                                </span>
                                                <span>
                                                    {folder === mailFolderSchema.enum.sent ||
                                                    folder === mailFolderSchema.enum.drafts
                                                        ? item.to
                                                        : item.from}
                                                </span>
                                                <span>{item.body.slice(0, 100)}</span>
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            {page.error && (
                                <p className="simulator-list-error" role="alert">
                                    {page.error}
                                </p>
                            )}
                            <LoadMore
                                count={visiblePage.count}
                                hasMore={visiblePage.count < page.total}
                                loading={page.loading}
                                error={page.error}
                                onLoadMore={page.error ? page.retry : visiblePage.loadMore}
                                label="Load more email"
                            />
                            {!page.loading && !page.error && visibleMail.length === 0 && (
                                <p className="simulator-list-group__empty">
                                    {query
                                        ? 'No messages match your search.'
                                        : 'No messages in this folder.'}
                                </p>
                            )}
                        </SimulatorListGroup>
                    )}
                </>
            )}
        </DevicePage>
    );
}
