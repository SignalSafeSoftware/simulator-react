import { SIM_LIST_ERROR } from '../../ui/styles/simulatorClasses.js';
import { useDevicePage } from '../../hooks/device/useDevicePage.js';
import { useDeviceRecord } from '../../hooks/device/useDeviceRecord.js';
import { LoadMore } from '../../ui/lists/LoadMore.js';
import { useVisiblePage } from '../../hooks/device/useVisiblePage.js';
import type { ReactNode } from 'react';
import { DevicePage } from '../shared/DevicePage.js';
import { AppSecondaryNav, type AppNavAction } from '../shared/AppSecondaryNav.js';
import type { DeviceStore } from '@signalsafe/simulator-core/apps/store';
import { mailFolderSchema, type Mail } from '@signalsafe/simulator-core/apps/contracts';
import {
    localEmailService,
    type SimulatorEmailService,
} from '@signalsafe/simulator-core/apps/emailService';
import { useSimulatorAppsHost } from '../shared/SimulatorAppsHost.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { useMailDraft, useMailNav, useMailPersist } from './mailHooks.js';
import { MailDraftForm } from './MailDraftForm.js';
import { MailMessageView, type MessageActions } from './MailMessageView.js';
import { MailFolderList, MailList } from './MailLists.js';
import type { MailFolder, Translate } from './mailShared.js';

export interface MailboxSource {
    id: string;
    label: string;
    render: (onCompose: (mail: Mail) => void) => ReactNode;
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
    const { formatDate, confirm } = useSimulatorAppsHost();
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
        if (confirm(t('app.mail.deleteConfirm')) && (await store.remove('mail', target.id)))
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
