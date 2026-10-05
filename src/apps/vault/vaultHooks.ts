import { useRef, useState } from 'react';
import { createSimulatorId } from '@signalsafe/simulator-core/apps/id';
import type { DeviceStore } from '@signalsafe/simulator-core/apps/store';
import {
    DEFAULT_VAULT_FOLDER,
    secretSchema,
    type Secret,
} from '@signalsafe/simulator-core/apps/contracts';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { useSimulatorAppsHost } from '../shared/SimulatorAppsHost.js';
import { useDraftBaseline } from '../shared/useDraftBaseline.js';
import type { FolderPage } from './vaultShared.js';

export function newSecret(folder: string): Secret {
    const now = new Date().toISOString();
    return {
        id: createSimulatorId(),
        title: '',
        type: 'secret',
        folder,
        username: '',
        value: '',
        site: '',
        notes: '',
        createdAt: now,
        updatedAt: now,
    };
}

export function useVaultNav(onBack: () => void) {
    const [folder, setFolder] = useState<string | null>(null);
    const [folderPage, setFolderPage] = useState<FolderPage | null>(null);
    const [folderName, setFolderName] = useState<string | null>(null);
    const [folderQuery, setFolderQuery] = useState('');
    const [query, setQuery] = useState('');
    const [message, setMessage] = useState('');
    function back() {
        if (folderPage) {
            setFolderPage(null);
            setFolderName(null);
            setMessage('');
        } else if (folder !== null) {
            setFolder(null);
            setFolderName(null);
            setQuery('');
            setMessage('');
        } else onBack();
    }
    function openFolderPage(page: FolderPage) {
        setFolderPage(page);
        setFolderName(null);
        setMessage('');
    }
    function selectFolder(name: string) {
        setFolder(name);
        setFolderName(name);
        setQuery('');
        setMessage('');
    }
    function renamed(name: string) {
        setFolder(name);
        setFolderPage(null);
        setFolderName(null);
        setQuery('');
        setMessage('');
    }
    function deleted() {
        setFolder(null);
        setFolderPage(null);
        setQuery('');
        setMessage('');
    }
    function secretSaved(name: string) {
        setFolder(name);
        setFolderName(null);
        setQuery('');
    }
    return {
        folder,
        folderPage,
        folderName,
        setFolderName,
        folderQuery,
        setFolderQuery,
        query,
        setQuery,
        message,
        setMessage,
        back,
        openFolderPage,
        selectFolder,
        renamed,
        deleted,
        secretSaved,
    };
}

export function useVaultFolderActions({
    store,
    folders,
    folder,
    folderName,
    setMessage,
    onRenamed,
    onDeleted,
}: Readonly<{
    store: DeviceStore;
    folders: readonly string[];
    folder: string | null;
    folderName: string | null;
    setMessage: (message: string) => void;
    onRenamed: (name: string) => void;
    onDeleted: () => void;
}>) {
    const { t } = useSimulatorLocale();
    const destination =
        folder === DEFAULT_VAULT_FOLDER ? 'Recovered secrets' : DEFAULT_VAULT_FOLDER;
    async function saveFolder() {
        const name = (folderName ?? folder ?? '').trim();
        if (!name || name.length > 200) {
            setMessage(t('app.vault.folderNameInvalid'));
            return;
        }
        if (folders.some((item) => item !== folder && item.toLowerCase() === name.toLowerCase())) {
            setMessage(t('app.vault.folderExists'));
            return;
        }
        if (await store.folder(folder, name, DEFAULT_VAULT_FOLDER)) onRenamed(name);
    }
    async function deleteFolder() {
        if (await store.folder(folder, null, destination)) onDeleted();
    }
    return { destination, saveFolder, deleteFolder };
}

export function useVaultDraft({
    store,
    records,
    setMessage,
    onSaved,
}: Readonly<{
    store: DeviceStore;
    records: readonly Secret[];
    setMessage: (message: string) => void;
    onSaved: (folder: string) => void;
}>) {
    const { t } = useSimulatorLocale();
    const formRef = useRef<HTMLFormElement>(null);
    const [existing, setExisting] = useState(false);
    const [draft, setDraft] = useState<Secret | null>(null);
    const { setBaseline, confirmDiscard } = useDraftBaseline(draft);
    const { confirm, copyText } = useSimulatorAppsHost();
    const [reveal, setReveal] = useState(false);
    function close() {
        setDraft(null);
        setReveal(false);
        setMessage('');
    }
    function edit(next: Secret) {
        setBaseline(next);
        setExisting(records.some((record) => record.id === next.id));
        setDraft(next);
        setReveal(false);
        setMessage('');
    }
    function discard() {
        if (confirmDiscard(t('app.vault.discardConfirm'))) close();
    }
    async function save() {
        const parsed = secretSchema.safeParse({
            ...draft,
            updatedAt: new Date().toISOString(),
        });
        if (!parsed.success) {
            setMessage(t('app.vault.secretInvalid'));
            return;
        }
        if (await store.put('secrets', parsed.data)) {
            onSaved(parsed.data.folder);
            close();
        }
    }
    async function remove(current: Secret) {
        if (
            confirm(t('app.vault.deleteConfirm', { title: current.title })) &&
            (await store.remove('secrets', current.id))
        )
            close();
    }
    async function copy(value: string) {
        try {
            await copyText(value);
            setMessage(t('app.vault.copied'));
        } catch {
            setMessage(t('app.vault.clipboardUnavailable'));
        }
    }
    return {
        formRef,
        existing,
        draft,
        setDraft,
        reveal,
        setReveal,
        edit,
        discard,
        save,
        remove,
        copy,
    };
}
