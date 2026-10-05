import { PagedListFooter } from '../shared/PagedListFooter.js';
import { SIM_BTN_OUTLINE } from '../../ui/styles/simulatorClasses.js';
import { mailFolderSchema, type Asset, type Mail } from '@signalsafe/simulator-core/apps/contracts';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { ReplyKind } from '@signalsafe/simulator-core/apps/mail';
import { type MailPage, type VisiblePage } from './mailShared.js';

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
            <p className='prototype-message-body'>{message.body}</p>
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
                        className={SIM_BTN_OUTLINE}
                        key={item.id}
                        disabled={busy}
                        onClick={() => onOpen(item.id)}
                    >
                        {item.subject || t('app.mail.noSubject')}
                    </button>
                ))}
            <PagedListFooter
                page={thread}
                visible={threadPage}
                label={t('app.mail.loadMoreThread')}
            />
        </details>
    );
}

function MailAttachmentLinks({ attachments }: Readonly<{ attachments: readonly Asset[] }>) {
    return (
        <ul className='prototype-list'>
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

export interface MessageActions {
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
        <div className='prototype-actions'>
            {message.folder !== mailFolderSchema.enum.drafts && (
                <>
                    <button
                        className={SIM_BTN_OUTLINE}
                        disabled={busy}
                        onClick={() => actions.compose(message, ReplyKind.ReplyAll)}
                    >
                        {t('app.mail.replyAll')}
                    </button>
                    <button
                        className={SIM_BTN_OUTLINE}
                        disabled={busy}
                        onClick={() => actions.compose(message, ReplyKind.Forward)}
                    >
                        {t('app.mail.forward')}
                    </button>
                </>
            )}
            <button
                className={SIM_BTN_OUTLINE}
                disabled={storeBusy}
                onClick={() => actions.toggleRead(message)}
            >
                {message.read ? t('app.mail.markUnread') : t('app.mail.markRead')}
            </button>
            {message.folder === mailFolderSchema.enum.trash ? (
                <>
                    <button
                        className={SIM_BTN_OUTLINE}
                        disabled={storeBusy}
                        onClick={() => actions.restore(message)}
                    >
                        {t('app.mail.restore')}
                    </button>
                    <button
                        className={SIM_BTN_OUTLINE}
                        disabled={storeBusy}
                        onClick={() => actions.remove(message)}
                    >
                        {t('app.mail.deletePermanently')}
                    </button>
                </>
            ) : (
                <button
                    className={SIM_BTN_OUTLINE}
                    disabled={storeBusy}
                    onClick={() => actions.moveToTrash(message)}
                >
                    {t('app.mail.moveToTrash')}
                </button>
            )}
        </div>
    );
}

export function MailMessageView({
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
