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
import { useId, useRef, useState, type ReactNode, type RefObject } from 'react';
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

type Translate = ReturnType<typeof useSimulatorLocale>['t'];
type SecretPage = ReturnType<typeof useDevicePage<'secrets'>>;
type VisiblePage = ReturnType<typeof useVisiblePage>;
type TypeLabels = Record<Secret['type'], string>;

const OUTLINE = simBtnToneClass(SimulatorButtonTone.NeutralOutline);
const FolderPage = Object.freeze({ Create: 'create', Delete: 'delete' } as const);
type FolderPage = (typeof FolderPage)[keyof typeof FolderPage];

function SearchBox({
    label,
    value,
    onChange,
}: Readonly<{
    label: string;
    value: string;
    onChange: (value: string) => void;
}>) {
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

function useVaultNav(onBack: () => void) {
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

function useVaultFolderActions({
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

function useVaultDraft({
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
    const baseline = useRef<Secret | null>(null);
    const [existing, setExisting] = useState(false);
    const [draft, setDraft] = useState<Secret | null>(null);
    const [reveal, setReveal] = useState(false);
    function close() {
        setDraft(null);
        setReveal(false);
        setMessage('');
    }
    function edit(next: Secret) {
        baseline.current = next;
        setExisting(records.some((record) => record.id === next.id));
        setDraft(next);
        setReveal(false);
        setMessage('');
    }
    function discard() {
        if (
            JSON.stringify(draft) === JSON.stringify(baseline.current) ||
            window.confirm(t('app.vault.discardConfirm'))
        )
            close();
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
            window.confirm(t('app.vault.deleteConfirm', { title: current.title })) &&
            (await store.remove('secrets', current.id))
        )
            close();
    }
    async function copy(value: string) {
        try {
            await navigator.clipboard.writeText(value);
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

function SecretValueField({
    draft,
    busy,
    reveal,
    onReveal,
    onChange,
    onCopy,
}: Readonly<{
    draft: Secret;
    busy: boolean;
    reveal: boolean;
    onReveal: () => void;
    onChange: (draft: Secret) => void;
    onCopy: () => void;
}>) {
    const { t } = useSimulatorLocale();
    const secretId = useId();
    const toggleLabel = reveal ? t('app.vault.hideSecret') : t('app.vault.revealSecret');
    return (
        <div className="vault-entry-field">
            <label htmlFor={secretId}>{t('app.vault.secret')}</label>
            <div className="vault-secret-group">
                <button
                    className={OUTLINE}
                    type="button"
                    aria-label={t('app.vault.copySecret')}
                    title={t('app.vault.copySecret')}
                    onClick={onCopy}
                >
                    <Copy size={18} aria-hidden="true" />
                </button>
                <input
                    id={secretId}
                    className={SIM_INPUT}
                    autoComplete="new-password"
                    type={reveal ? 'text' : 'password'}
                    required
                    disabled={busy}
                    value={draft.value}
                    onChange={(event) => onChange({ ...draft, value: event.target.value })}
                />
                <button
                    className={OUTLINE}
                    type="button"
                    aria-label={toggleLabel}
                    title={toggleLabel}
                    aria-pressed={reveal}
                    onClick={onReveal}
                >
                    {reveal ? (
                        <EyeOff size={18} aria-hidden="true" />
                    ) : (
                        <Eye size={18} aria-hidden="true" />
                    )}
                </button>
            </div>
        </div>
    );
}

function SecretForm({
    draft,
    folders,
    typeLabels,
    busy,
    formRef,
    reveal,
    onReveal,
    onChange,
    onNotes,
    onSubmit,
    onCopy,
}: Readonly<{
    draft: Secret;
    folders: readonly string[];
    typeLabels: TypeLabels;
    busy: boolean;
    formRef: RefObject<HTMLFormElement>;
    reveal: boolean;
    onReveal: () => void;
    onChange: (draft: Secret) => void;
    onNotes: (notes: string) => void;
    onSubmit: () => void;
    onCopy: () => void;
}>) {
    const { NotesEditor } = useSimulatorAppsHost();
    const { t } = useSimulatorLocale();
    return (
        <form
            className="vault-entry-form"
            ref={formRef}
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
            }}
        >
            <label>
                {t('app.vault.type')}
                <select
                    disabled={busy}
                    value={draft.type}
                    onChange={(event) =>
                        onChange({ ...draft, type: secretTypeSchema.parse(event.target.value) })
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
                    disabled={busy}
                    value={draft.title}
                    onChange={(event) => onChange({ ...draft, title: event.target.value })}
                />
            </label>
            <label>
                {t('app.vault.folder')}
                <select
                    disabled={busy}
                    value={draft.folder}
                    onChange={(event) => onChange({ ...draft, folder: event.target.value })}
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
                        disabled={busy}
                        value={draft.username}
                        onChange={(event) => onChange({ ...draft, username: event.target.value })}
                    />
                </label>
            )}
            {draft.type !== 'note' && (
                <SecretValueField
                    draft={draft}
                    busy={busy}
                    reveal={reveal}
                    onReveal={onReveal}
                    onChange={onChange}
                    onCopy={onCopy}
                />
            )}
            {draft.type === 'credentials' && (
                <label>
                    {t('app.vault.site')}
                    <input
                        className={SIM_INPUT}
                        disabled={busy}
                        value={draft.site}
                        onChange={(event) => onChange({ ...draft, site: event.target.value })}
                    />
                </label>
            )}
            <NotesEditor
                key={draft.id}
                label={t('app.vault.notes')}
                placeholder={t('app.vault.notesPlaceholder')}
                markdown={draft.notes}
                readOnly={busy}
                onChange={(notes, initialNormalization) => {
                    if (!initialNormalization) onNotes(notes);
                }}
            />
        </form>
    );
}

function FolderNameForm({
    formRef,
    value,
    busy,
    onChange,
    onSubmit,
}: Readonly<{
    formRef: RefObject<HTMLFormElement>;
    value: string;
    busy: boolean;
    onChange: (value: string) => void;
    onSubmit: () => void;
}>) {
    const { t } = useSimulatorLocale();
    return (
        <form
            ref={formRef}
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
            }}
        >
            <label>
                {t('app.vault.folderName')}
                <input
                    className={SIM_INPUT}
                    required
                    maxLength={200}
                    disabled={busy}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                />
            </label>
        </form>
    );
}

function FolderList({
    folders,
    counts,
    query,
    onQuery,
    busy,
    onOpen,
}: Readonly<{
    folders: readonly string[];
    counts: DeviceStore['counts'];
    query: string;
    onQuery: (query: string) => void;
    busy: boolean;
    onOpen: (name: string) => void;
}>) {
    const { t } = useSimulatorLocale();
    const filter = query.trim().toLowerCase();
    const matching = folders.filter((name) => name.toLowerCase().includes(filter));
    return (
        <div className="vault-folder-group">
            <SearchBox label={t('app.vault.searchFolders')} value={query} onChange={onQuery} />
            <ul className="vault-list-group" aria-label={t('app.vault.folders')}>
                {matching.map((name) => (
                    <li key={name}>
                        <button type="button" disabled={busy} onClick={() => onOpen(name)}>
                            <span className="vault-folder-name">{name}</span>
                            <span
                                className="vault-folder-count"
                                aria-label={t('app.vault.secretsCount')}
                            >
                                {counts?.secrets[name] ?? 0}
                            </span>
                            <ChevronRight size={18} aria-hidden="true" />
                        </button>
                    </li>
                ))}
            </ul>
            {matching.length === 0 && <p>{t('app.vault.noMatchingFolders')}</p>}
        </div>
    );
}

function FolderEditor({
    value,
    busy,
    onChange,
    onSubmit,
    onDelete,
}: Readonly<{
    value: string;
    busy: boolean;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onDelete: () => void;
}>) {
    const { t } = useSimulatorLocale();
    return (
        <section className="vault-folder-editor" aria-label={t('app.vault.editFolder')}>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit();
                }}
            >
                <label>
                    {t('app.vault.folderName')}
                    <input
                        className={SIM_INPUT}
                        required
                        maxLength={200}
                        disabled={busy}
                        value={value}
                        onChange={(event) => onChange(event.target.value)}
                    />
                </label>
                <div className="prototype-actions">
                    <button
                        className={OUTLINE}
                        type="submit"
                        aria-label={t('app.vault.saveFolder')}
                        title={t('app.vault.saveFolder')}
                        disabled={busy}
                    >
                        <Save size={20} aria-hidden="true" />
                    </button>
                    <button
                        className={OUTLINE}
                        type="button"
                        aria-label={t('app.vault.deleteFolder')}
                        title={t('app.vault.deleteFolder')}
                        disabled={busy}
                        onClick={onDelete}
                    >
                        <Trash2 size={20} aria-hidden="true" />
                    </button>
                </div>
            </form>
        </section>
    );
}

function SecretList({
    secrets,
    visiblePage,
    query,
    onQuery,
    busy,
    typeLabels,
    onEdit,
}: Readonly<{
    secrets: SecretPage;
    visiblePage: VisiblePage;
    query: string;
    onQuery: (query: string) => void;
    busy: boolean;
    typeLabels: TypeLabels;
    onEdit: (secret: Secret) => void;
}>) {
    const { t } = useSimulatorLocale();
    return (
        <div className="vault-folder-group">
            <SearchBox label={t('app.vault.searchSecrets')} value={query} onChange={onQuery} />
            <ul className="vault-list-group" aria-label={t('app.vault.folderSecrets')}>
                {secrets.records.map((item) => (
                    <li key={item.id}>
                        <button type="button" disabled={busy} onClick={() => onEdit(item)}>
                            <span>
                                <strong>{item.title}</strong>
                            </span>
                            <span className="vault-secret-type">{typeLabels[item.type]}</span>
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
            {!secrets.loading && !secrets.error && secrets.records.length === 0 && (
                <p>{query ? t('app.vault.noMatchingSecrets') : t('app.vault.noSecrets')}</p>
            )}
        </div>
    );
}

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
