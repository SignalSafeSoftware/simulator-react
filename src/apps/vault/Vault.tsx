import { SimulatorButtonTone, simBtnToneClass } from '../../ui/simulatorClasses.js';
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
} from '@signalsafe/simulator-core/apps/contracts';
import type { Secret } from '@signalsafe/simulator-core/apps/contracts';
import { DevicePage } from '../shared/DevicePage.js';
import { AppSecondaryNav, type AppNavAction } from '../shared/AppSecondaryNav.js';
import { useSimulatorAppsHost } from '../shared/SimulatorAppsHost.js';
import { capitalize } from '../../utils/capitalize.js';

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
                className="simulator-input"
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
export default function Vault({ store, onBack }: { store: DeviceStore; onBack: () => void }) {
    const { NotesEditor } = useSimulatorAppsHost();
    const secretId = useId();
    const formRef = useRef<HTMLFormElement>(null);
    const [folder, setFolder] = useState<string | null>(null);
    const [folderPage, setFolderPage] = useState<'create' | 'delete' | null>(null);
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
        if (!data || store.busy || folderPage === 'delete') return;
        const editing = folderPage !== 'create';
        if (editing && !folder) return;
        const name = (folderName ?? (editing ? folder : '') ?? '').trim();
        if (!name || name.length > 200) {
            setMessage('Enter a folder name up to 200 characters.');
            return;
        }
        if (
            folders.some(
                (item) =>
                    (!editing || item !== folder) && item.toLowerCase() === name.toLowerCase(),
            )
        ) {
            setMessage('A folder with that name already exists.');
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
    function openFolderPage(page: 'create' | 'delete') {
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
            window.confirm('Discard unsaved secret changes?')
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
            setMessage('Add a title and secret; keep fields within their size limits.');
            return;
        }
        if (await store.put('secrets', parsed.data)) {
            setFolder(parsed.data.folder);
            setFolderName(null);
            setQuery('');
            close();
        }
    }
    let title = folder ?? 'Vault folders';
    if (folderPage === 'create') title = 'Create folder';
    else if (folderPage === 'delete') title = 'Delete folder';
    else if (draft) title = draft.title || 'New secret';

    const navActions: AppNavAction[] = [];
    if (draft) {
        navActions.push({
            label: 'Save secret',
            icon: '✓',
            onClick: () => formRef.current?.requestSubmit(),
        });
        if (existing)
            navActions.push({
                label: 'Delete secret',
                icon: '🗑',
                onClick: async () => {
                    if (
                        window.confirm(`Delete ${draft.title}?`) &&
                        (await store.remove('secrets', draft.id))
                    )
                        close();
                },
            });
        navActions.push({ label: 'Back', icon: '↩', onClick: discard });
    } else {
        if (!folderPage && folder !== null)
            navActions.push({
                label: 'New secret',
                icon: '+',
                onClick: () => edit(newSecret(folder)),
            });
        if (folderPage === 'delete')
            navActions.push({
                label: 'Delete folder',
                icon: '🗑',
                onClick: () => void deleteFolder(),
            });
        else if (folderPage)
            navActions.push({
                label: 'Save folder',
                icon: '✓',
                onClick: () => folderFormRef.current?.requestSubmit(),
            });
        else if (folder === null)
            navActions.push({
                label: 'New folder',
                icon: '+',
                onClick: () => openFolderPage('create'),
            });
        navActions.push({ label: 'Back', icon: '↩', onClick: back });
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
            {folderPage === 'delete' ? (
                <p>
                    Delete “{folder}”? Its {store.counts?.secrets[folder ?? ''] ?? 0} secrets will
                    move to {deletionDestination}. Use Delete folder below to confirm.
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
                        Folder name
                        <input
                            className="simulator-input"
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
                        Type
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
                                    {capitalize(type)}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Title
                        <input
                            className="simulator-input"
                            required
                            maxLength={200}
                            disabled={store.busy}
                            value={draft.title}
                            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                        />
                    </label>
                    <label>
                        Folder
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
                            Username
                            <input
                                className="simulator-input"
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
                            <label htmlFor={secretId}>Secret</label>
                            <div className="vault-secret-group">
                                <button
                                    className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
                                    type="button"
                                    aria-label="Copy secret"
                                    title="Copy secret"
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(draft.value);
                                            setMessage('Copied.');
                                        } catch {
                                            setMessage(
                                                'Clipboard unavailable. Reveal the value to copy it manually.',
                                            );
                                        }
                                    }}
                                >
                                    <Copy size={18} aria-hidden="true" />
                                </button>
                                <input
                                    id={secretId}
                                    className="simulator-input"
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
                                    aria-label={reveal ? 'Hide secret' : 'Reveal secret'}
                                    title={reveal ? 'Hide secret' : 'Reveal secret'}
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
                            Site
                            <input
                                className="simulator-input"
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
                        label="Notes"
                        placeholder="Add notes…"
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
                        label="Search folders"
                        value={folderQuery}
                        onChange={setFolderQuery}
                    />
                    <ul className="vault-list-group" aria-label="Vault folders">
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
                                    <span className="vault-folder-count" aria-label="secrets">
                                        {store.counts?.secrets[name] ?? 0}
                                    </span>
                                    <ChevronRight size={18} aria-hidden="true" />
                                </button>
                            </li>
                        ))}
                    </ul>
                    {matchingFolders.length === 0 && <p>No matching folders.</p>}
                </div>
            ) : (
                <>
                    <section className="vault-folder-editor" aria-label="Edit folder">
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                void saveFolder();
                            }}
                        >
                            <label>
                                Folder name
                                <input
                                    className="simulator-input"
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
                                    aria-label="Save folder"
                                    title="Save folder"
                                    disabled={store.busy}
                                >
                                    <Save size={20} aria-hidden="true" />
                                </button>
                                <button
                                    className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
                                    type="button"
                                    aria-label="Delete folder"
                                    title="Delete folder"
                                    disabled={store.busy}
                                    onClick={() => openFolderPage('delete')}
                                >
                                    <Trash2 size={20} aria-hidden="true" />
                                </button>
                            </div>
                        </form>
                    </section>
                    <div className="vault-folder-group">
                        <SearchBox label="Search secrets" value={query} onChange={setQuery} />
                        <ul className="vault-list-group" aria-label="Folder secrets">
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
                                            {capitalize(item.type)}
                                        </span>
                                        <ChevronRight size={18} aria-hidden="true" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        {secrets.error && (
                            <p className="simulator-list-error" role="alert">
                                {secrets.error}
                            </p>
                        )}
                        <LoadMore
                            count={visiblePage.count}
                            hasMore={visiblePage.count < secrets.total}
                            loading={secrets.loading}
                            error={secrets.error}
                            onLoadMore={secrets.error ? secrets.retry : visiblePage.loadMore}
                            label="Load more secrets"
                        />
                        {!secrets.loading && !secrets.error && visibleSecrets.length === 0 && (
                            <p>{query ? 'No matching secrets.' : 'No secrets in this folder.'}</p>
                        )}
                    </div>
                </>
            )}
        </DevicePage>
    );
}
