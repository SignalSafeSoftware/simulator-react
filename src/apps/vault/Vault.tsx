import {
    SIM_INPUT,
    SIM_LIST_ERROR,
    SimulatorButtonTone,
    simBtnToneClass,
} from '../../ui/styles/simulatorClasses.js';
import { useDevicePage } from '../../hooks/device/useDevicePage.js';
import { LoadMore } from '../../ui/lists/LoadMore.js';
import { useVisiblePage } from '../../hooks/device/useVisiblePage.js';
import { createSimulatorId } from '@signalsafe/simulator-core/apps/id';
import { useId, useRef, useState } from 'react';
import { Copy, Eye, EyeOff, ChevronRight, Save, Trash2 } from 'lucide-react';
import type { DeviceStore } from '@signalsafe/simulator-core/apps/store';
import {
    DEFAULT_VAULT_FOLDER,
    SECRET_TYPES,
    secretTypeSchema,
    secretSchema,
    type Secret,
} from '@signalsafe/simulator-core/apps/contracts';
import { DevicePage } from '../shared/DevicePage.js';
import { AppSecondaryNav, type AppNavAction } from '../shared/AppSecondaryNav.js';
import { useSimulatorAppsHost } from '../shared/SimulatorAppsHost.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';

function SearchBox({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="vault-folder-search">
            <input
                className={SIM_INPUT}
                type="search"
                aria-label={label}
                placeholder={label}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

function newSecret(folder: string): Secret {
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
const FolderPage = Object.freeze({ Create: 'create', Delete: 'delete' } as const);
type FolderPage = (typeof FolderPage)[keyof typeof FolderPage];

export default function Vault({ store, onBack }: { store: DeviceStore; onBack: () => void }) {
    const { NotesEditor } = useSimulatorAppsHost();
    const { t } = useSimulatorLocale();
    const typeLabels = {
        note: t('app.vault.type.note'),
        secret: t('app.vault.type.secret'),
        credentials: t('app.vault.type.credentials'),
    } satisfies Record<Secret['type'], string>;
    const secretId = useId();
    const formRef = useRef<HTMLFormElement>(null);
    const [folder, setFolder] = useState<string | null>(null);
    const [folderPage, setFolderPage] = useState<FolderPage | null>(null);
    const folderFormRef = useRef<HTMLFormElement>(null);
    const [folderQuery, setFolderQuery] = useState('');
    const [folderName, setFolderName] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const visiblePage = useVisiblePage(JSON.stringify([folder, query]));
    const secrets = useDevicePage(
        store,
        'secrets',
        { folder: folder ?? '', search: query },
        visiblePage.count,
        folder !== null,
    );
    const [existing, setExisting] = useState(false);
    const [draft, setDraft] = useState<Secret | null>(null);
    const baseline = useRef<Secret | null>(null);
    const [reveal, setReveal] = useState(false);
    const [message, setMessage] = useState('');
    const data = store.data;
    if (!data) return null;
    const folders = [
        ...new Set([...data.vaultFolders, ...Object.keys(store.counts?.secrets ?? {})]),
    ].sort((a, b) => a.localeCompare(b));
    const deletionDestination =
        folder === DEFAULT_VAULT_FOLDER ? 'Recovered secrets' : DEFAULT_VAULT_FOLDER;
    const visibleSecrets = secrets.records;
    const folderFilter = folderQuery.trim().toLowerCase();
    const matchingFolders = folders.filter((name) => name.toLowerCase().includes(folderFilter));
    function back() {
        if (store.busy) return;
        if (folderPage) {
            setFolderPage(null);
            setFolderName(null);
            setMessage('');
        } else if (draft) discard();
        else if (folder !== null) {
            setFolder(null);
            setFolderName(null);
            setQuery('');
            setMessage('');
        } else onBack();
    }
    async function saveFolder() {
        if (!data || store.busy || folderPage === FolderPage.Delete) return;
        const editing = folderPage !== FolderPage.Create;
        if (editing && !folder) return;
        const name = (folderName ?? (editing ? folder : '') ?? '').trim();
        if (!name || name.length > 200) {
            setMessage(t('app.vault.folderNameInvalid'));
            return;
        }
        if (
            folders.some(
                (item) =>
                    (!editing || item !== folder) && item.toLowerCase() === name.toLowerCase(),
            )
        ) {
            setMessage(t('app.vault.folderExists'));
            return;
        }
        if (await store.folder(editing ? folder : null, name, DEFAULT_VAULT_FOLDER)) {
            setFolder(name);
            setFolderPage(null);
            setFolderName(null);
            setQuery('');
            setMessage('');
        }
    }
    async function deleteFolder() {
        if (!data || store.busy || !folder) return;
        if (await store.folder(folder, null, deletionDestination)) {
            setFolder(null);
            setFolderPage(null);
            setQuery('');
            setMessage('');
        }
    }
    function openFolderPage(page: FolderPage) {
        setFolderPage(page);
        setFolderName(null);
        setMessage('');
    }
    function edit(next: Secret) {
        baseline.current = next;
        setExisting(secrets.records.some((record) => record.id === next.id));
        setDraft(next);
        setReveal(false);
        setMessage('');
    }
    function discard() {
        if (store.busy) return;
        if (
            JSON.stringify(draft) === JSON.stringify(baseline.current) ||
            window.confirm(t('app.vault.discardConfirm'))
        )
            close();
    }
    function close() {
        setDraft(null);
        setReveal(false);
        setMessage('');
    }
    async function save() {
        if (!data || store.busy) return;
        const parsed = secretSchema.safeParse({
            ...draft,
            updatedAt: new Date().toISOString(),
        });
        if (!parsed.success) {
            setMessage(t('app.vault.secretInvalid'));
            return;
        }
        if (await store.put('secrets', parsed.data)) {
            setFolder(parsed.data.folder);
            setFolderName(null);
            setQuery('');
            close();
        }
    }
    let title = folder ?? t('app.vault.folders');
    if (folderPage === FolderPage.Create) title = t('app.vault.createFolder');
    else if (folderPage === FolderPage.Delete) title = t('app.vault.deleteFolder');
    else if (draft) title = draft.title || t('app.vault.newSecret');

    const navActions: AppNavAction[] = [];
    if (draft) {
        navActions.push({
            label: t('app.vault.saveSecret'),
            icon: '✓',
            onClick: () => formRef.current?.requestSubmit(),
        });
        if (existing)
            navActions.push({
                label: t('app.vault.deleteSecret'),
                icon: '🗑',
                onClick: async () => {
                    if (
                        window.confirm(t('app.vault.deleteConfirm', { title: draft.title })) &&
                        (await store.remove('secrets', draft.id))
                    )
                        close();
                },
            });
        navActions.push({ label: t('app.back'), icon: '↩', onClick: discard });
    } else {
        if (!folderPage && folder !== null)
            navActions.push({
                label: t('app.vault.newSecret'),
                icon: '+',
                onClick: () => edit(newSecret(folder)),
            });
        if (folderPage === FolderPage.Delete)
            navActions.push({
                label: t('app.vault.deleteFolder'),
                icon: '🗑',
                onClick: () => void deleteFolder(),
            });
        else if (folderPage)
            navActions.push({
                label: t('app.vault.saveFolder'),
                icon: '✓',
                onClick: () => folderFormRef.current?.requestSubmit(),
            });
        else if (folder === null)
            navActions.push({
                label: t('app.vault.newFolder'),
                icon: '+',
                onClick: () => openFolderPage(FolderPage.Create),
            });
        navActions.push({ label: t('app.back'), icon: '↩', onClick: back });
    }

    return (
        <DevicePage
            listLayout={!draft && !folderPage}
            title={title}
            onBack={back}
            navigation={
                <AppSecondaryNav
                    actions={navActions.map((action) => ({ ...action, disabled: store.busy }))}
                />
            }
        >
            {message && <output>{message}</output>}
            {folderPage === FolderPage.Delete ? (
                <p>
                    {t('app.vault.deleteFolderNotice', {
                        folder: folder ?? '',
                        count: store.counts?.secrets[folder ?? ''] ?? 0,
                        destination: deletionDestination,
                    })}
                </p>
            ) : folderPage ? (
                <form
                    ref={folderFormRef}
                    onSubmit={(event) => {
                        event.preventDefault();
                        void saveFolder();
                    }}
                >
                    <label>
                        {t('app.vault.folderName')}
                        <input
                            className={SIM_INPUT}
                            required
                            maxLength={200}
                            disabled={store.busy}
                            value={folderName ?? ''}
                            onChange={(event) => setFolderName(event.target.value)}
                        />
                    </label>
                </form>
            ) : draft ? (
                <form
                    className="vault-entry-form"
                    ref={formRef}
                    onSubmit={(event) => {
                        event.preventDefault();
                        void save();
                    }}
                >
                    <label>
                        {t('app.vault.type')}
                        <select
                            disabled={store.busy}
                            value={draft.type}
                            onChange={(event) =>
                                setDraft({
                                    ...draft,
                                    type: secretTypeSchema.parse(event.target.value),
                                })
                            }
                        >
                            {SECRET_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {typeLabels[type]}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        {t('app.vault.title')}
                        <input
                            className={SIM_INPUT}
                            required
                            maxLength={200}
                            disabled={store.busy}
                            value={draft.title}
                            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                        />
                    </label>
                    <label>
                        {t('app.vault.folder')}
                        <select
                            disabled={store.busy}
                            value={draft.folder}
                            onChange={(event) => setDraft({ ...draft, folder: event.target.value })}
                        >
                            {folders.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </label>
                    {draft.type === 'credentials' && (
                        <label>
                            {t('app.vault.username')}
                            <input
                                className={SIM_INPUT}
                                autoComplete="off"
                                disabled={store.busy}
                                value={draft.username}
                                onChange={(event) =>
                                    setDraft({ ...draft, username: event.target.value })
                                }
                            />
                        </label>
                    )}
                    {draft.type !== 'note' && (
                        <div className="vault-entry-field">
                            <label htmlFor={secretId}>{t('app.vault.secret')}</label>
                            <div className="vault-secret-group">
                                <button
                                    className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
                                    type="button"
                                    aria-label={t('app.vault.copySecret')}
                                    title={t('app.vault.copySecret')}
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(draft.value);
                                            setMessage(t('app.vault.copied'));
                                        } catch {
                                            setMessage(t('app.vault.clipboardUnavailable'));
                                        }
                                    }}
                                >
                                    <Copy size={18} aria-hidden="true" />
                                </button>
                                <input
                                    id={secretId}
                                    className={SIM_INPUT}
                                    autoComplete="new-password"
                                    type={reveal ? 'text' : 'password'}
                                    required
                                    disabled={store.busy}
                                    value={draft.value}
                                    onChange={(event) =>
                                        setDraft({ ...draft, value: event.target.value })
                                    }
                                />
                                <button
                                    className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
                                    type="button"
                                    aria-label={
                                        reveal
                                            ? t('app.vault.hideSecret')
                                            : t('app.vault.revealSecret')
                                    }
                                    title={
                                        reveal
                                            ? t('app.vault.hideSecret')
                                            : t('app.vault.revealSecret')
                                    }
                                    aria-pressed={reveal}
                                    onClick={() => setReveal(!reveal)}
                                >
                                    {reveal ? (
                                        <EyeOff size={18} aria-hidden="true" />
                                    ) : (
                                        <Eye size={18} aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                    {draft.type === 'credentials' && (
                        <label>
                            {t('app.vault.site')}
                            <input
                                className={SIM_INPUT}
                                disabled={store.busy}
                                value={draft.site}
                                onChange={(event) =>
                                    setDraft({ ...draft, site: event.target.value })
                                }
                            />
                        </label>
                    )}

                    <NotesEditor
                        key={draft.id}
                        label={t('app.vault.notes')}
                        placeholder={t('app.vault.notesPlaceholder')}
                        markdown={draft.notes}
                        readOnly={store.busy}
                        onChange={(notes, initialNormalization) => {
                            if (!initialNormalization)
                                setDraft((current) => current && { ...current, notes });
                        }}
                    />
                </form>
            ) : folder === null ? (
                <div className="vault-folder-group">
                    <SearchBox
                        label={t('app.vault.searchFolders')}
                        value={folderQuery}
                        onChange={setFolderQuery}
                    />
                    <ul className="vault-list-group" aria-label={t('app.vault.folders')}>
                        {matchingFolders.map((name) => (
                            <li key={name}>
                                <button
                                    type="button"
                                    disabled={store.busy}
                                    onClick={() => {
                                        setFolder(name);
                                        setFolderName(name);
                                        setQuery('');
                                        setMessage('');
                                    }}
                                >
                                    <span className="vault-folder-name">{name}</span>
                                    <span
                                        className="vault-folder-count"
                                        aria-label={t('app.vault.secretsCount')}
                                    >
                                        {store.counts?.secrets[name] ?? 0}
                                    </span>
                                    <ChevronRight size={18} aria-hidden="true" />
                                </button>
                            </li>
                        ))}
                    </ul>
                    {matchingFolders.length === 0 && <p>{t('app.vault.noMatchingFolders')}</p>}
                </div>
            ) : (
                <>
                    <section className="vault-folder-editor" aria-label={t('app.vault.editFolder')}>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                void saveFolder();
                            }}
                        >
                            <label>
                                {t('app.vault.folderName')}
                                <input
                                    className={SIM_INPUT}
                                    required
                                    maxLength={200}
                                    disabled={store.busy}
                                    value={folderName ?? folder}
                                    onChange={(event) => setFolderName(event.target.value)}
                                />
                            </label>
                            <div className="prototype-actions">
                                <button
                                    className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
                                    type="submit"
                                    aria-label={t('app.vault.saveFolder')}
                                    title={t('app.vault.saveFolder')}
                                    disabled={store.busy}
                                >
                                    <Save size={20} aria-hidden="true" />
                                </button>
                                <button
                                    className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
                                    type="button"
                                    aria-label={t('app.vault.deleteFolder')}
                                    title={t('app.vault.deleteFolder')}
                                    disabled={store.busy}
                                    onClick={() => openFolderPage(FolderPage.Delete)}
                                >
                                    <Trash2 size={20} aria-hidden="true" />
                                </button>
                            </div>
                        </form>
                    </section>
                    <div className="vault-folder-group">
                        <SearchBox
                            label={t('app.vault.searchSecrets')}
                            value={query}
                            onChange={setQuery}
                        />
                        <ul className="vault-list-group" aria-label={t('app.vault.folderSecrets')}>
                            {visibleSecrets.map((item) => (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        disabled={store.busy}
                                        onClick={() => edit(item)}
                                    >
                                        <span>
                                            <strong>{item.title}</strong>
                                        </span>
                                        <span className="vault-secret-type">
                                            {typeLabels[item.type]}
                                        </span>
                                        <ChevronRight size={18} aria-hidden="true" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        {secrets.error && (
                            <p className={SIM_LIST_ERROR} role="alert">
                                {secrets.error}
                            </p>
                        )}
                        <LoadMore
                            count={visiblePage.count}
                            hasMore={visiblePage.count < secrets.total}
                            loading={secrets.loading}
                            error={secrets.error}
                            onLoadMore={secrets.error ? secrets.retry : visiblePage.loadMore}
                            label={t('app.vault.loadMore')}
                        />
                        {!secrets.loading && !secrets.error && visibleSecrets.length === 0 && (
                            <p>
                                {query
                                    ? t('app.vault.noMatchingSecrets')
                                    : t('app.vault.noSecrets')}
                            </p>
                        )}
                    </div>
                </>
            )}
        </DevicePage>
    );
}
