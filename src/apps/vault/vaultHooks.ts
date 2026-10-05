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
import { RECOVERED_VAULT_FOLDER, type FolderPage } from './vaultShared.js';
import { currentIsoTime } from '../../utils/browser/browserEnvironment.js';

export function newSecret(folder: string): Secret {
    const now = currentIsoTime();
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

export interface VaultNavState {
    folder: string | null;
    folderPage: FolderPage | null;
    folderName: string | null;
    folderQuery: string;
    query: string;
    message: string;
}

const INITIAL_NAV: VaultNavState = {
    folder: null,
    folderPage: null,
    folderName: null,
    folderQuery: '',
    query: '',
    message: '',
};

export function useVaultNav(onBack: () => void) {
    const [state, setState] = useState<VaultNavState>(INITIAL_NAV);
    function update(patch: Partial<VaultNavState>) {
        setState((current) => ({ ...current, ...patch }));
    }
    function back() {
        if (state.folderPage) update({ folderPage: null, folderName: null, message: '' });
        else if (state.folder !== null)
            update({ folder: null, folderName: null, query: '', message: '' });
        else onBack();
    }
    return {
        state,
        setFolderName: (folderName: string | null) => update({ folderName }),
        setFolderQuery: (folderQuery: string) => update({ folderQuery }),
        setQuery: (query: string) => update({ query }),
        setMessage: (message: string) => update({ message }),
        back,
        openFolderPage: (folderPage: FolderPage) =>
            update({ folderPage, folderName: null, message: '' }),
        selectFolder: (name: string) =>
            update({ folder: name, folderName: name, query: '', message: '' }),
        renamed: (name: string) =>
            update({ folder: name, folderPage: null, folderName: null, query: '', message: '' }),
        deleted: () => update({ folder: null, folderPage: null, query: '', message: '' }),
        secretSaved: (name: string) => update({ folder: name, folderName: null, query: '' }),
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
        folder === DEFAULT_VAULT_FOLDER ? RECOVERED_VAULT_FOLDER : DEFAULT_VAULT_FOLDER;
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
            updatedAt: currentIsoTime(),
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
