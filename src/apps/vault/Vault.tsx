import { useRef, type ReactNode } from 'react';
import { useDevicePage } from '../../hooks/device/useDevicePage.js';
import { useVisiblePage } from '../../hooks/device/useVisiblePage.js';
import type { DeviceStore } from '@signalsafe/simulator-core/apps/store';
import type { Secret } from '@signalsafe/simulator-core/apps/contracts';
import { DevicePage } from '../shared/DevicePage.js';
import { AppSecondaryNav, type AppNavAction } from '../shared/AppSecondaryNav.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { newSecret, useVaultDraft, useVaultFolderActions, useVaultNav } from './vaultHooks.js';
import { SecretForm } from './VaultSecretForm.js';
import { FolderEditor, FolderList, FolderNameForm } from './VaultFolders.js';
import { SecretList } from './VaultSecretList.js';
import { FolderPage, type Translate, type TypeLabels } from './vaultShared.js';

function vaultTitle(
    t: Translate,
    folder: string | null,
    folderPage: FolderPage | null,
    draft: Secret | null,
) {
    if (folderPage === FolderPage.Create) return t('app.vault.createFolder');
    if (folderPage === FolderPage.Delete) return t('app.vault.deleteFolder');
    if (draft) return draft.title || t('app.vault.newSecret');
    return folder ?? t('app.vault.folders');
}

function folderNavAction(
    t: Translate,
    folder: string | null,
    folderPage: FolderPage | null,
    handlers: Readonly<{ remove: () => void; submit: () => void; create: () => void }>,
): AppNavAction[] {
    if (folderPage === FolderPage.Delete)
        return [{ label: t('app.vault.deleteFolder'), icon: '🗑', onClick: handlers.remove }];
    if (folderPage)
        return [{ label: t('app.vault.saveFolder'), icon: '✓', onClick: handlers.submit }];
    if (folder === null)
        return [{ label: t('app.vault.newFolder'), icon: '+', onClick: handlers.create }];
    return [];
}

function VaultScreen({
    store,
    vaultFolders,
    onBack,
}: Readonly<{ store: DeviceStore; vaultFolders: readonly string[]; onBack: () => void }>) {
    const { t } = useSimulatorLocale();
    const typeLabels = {
        note: t('app.vault.type.note'),
        secret: t('app.vault.type.secret'),
        credentials: t('app.vault.type.credentials'),
    } satisfies TypeLabels;
    const nav = useVaultNav(onBack);
    const { folder, folderPage } = nav;
    const folderFormRef = useRef<HTMLFormElement>(null);
    const visiblePage = useVisiblePage(JSON.stringify([folder, nav.query]));
    const secrets = useDevicePage(
        store,
        'secrets',
        { folder: folder ?? '', search: nav.query },
        visiblePage.count,
        folder !== null,
    );
    const folders = [
        ...new Set([...vaultFolders, ...Object.keys(store.counts?.secrets ?? {})]),
    ].sort((a, b) => a.localeCompare(b));
    const folderActions = useVaultFolderActions({
        store,
        folders,
        folder,
        folderName: nav.folderName,
        setMessage: nav.setMessage,
        onRenamed: nav.renamed,
        onDeleted: nav.deleted,
    });
    const editor = useVaultDraft({
        store,
        records: secrets.records,
        setMessage: nav.setMessage,
        onSaved: nav.secretSaved,
    });
    const { draft } = editor;
    const activeFolder = folder ?? '';

    const navActions: AppNavAction[] = [];
    if (draft) {
        navActions.push({
            label: t('app.vault.saveSecret'),
            icon: '✓',
            onClick: () => editor.formRef.current?.requestSubmit(),
        });
        if (editor.existing)
            navActions.push({
                label: t('app.vault.deleteSecret'),
                icon: '🗑',
                onClick: () => void editor.remove(draft),
            });
        navActions.push({ label: t('app.back'), icon: '↩', onClick: editor.discard });
    } else {
        if (!folderPage && folder !== null)
            navActions.push({
                label: t('app.vault.newSecret'),
                icon: '+',
                onClick: () => editor.edit(newSecret(folder)),
            });
        navActions.push(
            ...folderNavAction(t, folder, folderPage, {
                remove: () => void folderActions.deleteFolder(),
                submit: () => folderFormRef.current?.requestSubmit(),
                create: () => nav.openFolderPage(FolderPage.Create),
            }),
            { label: t('app.back'), icon: '↩', onClick: nav.back },
        );
    }

    function renderBody(): ReactNode {
        if (folderPage === FolderPage.Delete)
            return (
                <p>
                    {t('app.vault.deleteFolderNotice', {
                        folder: activeFolder,
                        count: store.counts?.secrets[activeFolder] ?? 0,
                        destination: folderActions.destination,
                    })}
                </p>
            );
        if (folderPage)
            return (
                <FolderNameForm
                    formRef={folderFormRef}
                    value={nav.folderName ?? ''}
                    busy={store.busy}
                    onChange={nav.setFolderName}
                    onSubmit={() => void folderActions.saveFolder()}
                />
            );
        if (draft)
            return (
                <SecretForm
                    draft={draft}
                    folders={folders}
                    typeLabels={typeLabels}
                    busy={store.busy}
                    formRef={editor.formRef}
                    reveal={editor.reveal}
                    onReveal={() => editor.setReveal(!editor.reveal)}
                    onChange={editor.setDraft}
                    onNotes={(notes) =>
                        editor.setDraft((current) => current && { ...current, notes })
                    }
                    onSubmit={() => void editor.save()}
                    onCopy={() => void editor.copy(draft.value)}
                />
            );
        if (folder === null)
            return (
                <FolderList
                    folders={folders}
                    counts={store.counts}
                    query={nav.folderQuery}
                    onQuery={nav.setFolderQuery}
                    busy={store.busy}
                    onOpen={nav.selectFolder}
                />
            );
        return (
            <>
                <FolderEditor
                    value={nav.folderName ?? folder}
                    busy={store.busy}
                    onChange={nav.setFolderName}
                    onSubmit={() => void folderActions.saveFolder()}
                    onDelete={() => nav.openFolderPage(FolderPage.Delete)}
                />
                <SecretList
                    secrets={secrets}
                    visiblePage={visiblePage}
                    query={nav.query}
                    onQuery={nav.setQuery}
                    busy={store.busy}
                    typeLabels={typeLabels}
                    onEdit={editor.edit}
                />
            </>
        );
    }

    return (
        <DevicePage
            listLayout={!draft && !folderPage}
            title={vaultTitle(t, folder, folderPage, draft)}
            onBack={nav.back}
            navigation={
                <AppSecondaryNav
                    actions={navActions.map((action) => ({ ...action, disabled: store.busy }))}
                />
            }
        >
            {nav.message && <output>{nav.message}</output>}
            {renderBody()}
        </DevicePage>
    );
}

export default function Vault({
    store,
    onBack,
}: Readonly<{ store: DeviceStore; onBack: () => void }>) {
    const data = store.data;
    if (!data) return null;
    return <VaultScreen store={store} vaultFolders={data.vaultFolders} onBack={onBack} />;
}
