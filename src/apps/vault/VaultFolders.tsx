import type { RefObject } from 'react';
import { INPUT_TYPE_SEARCH } from '../../constants.js';
import { ChevronRight, Save, Trash2 } from 'lucide-react';
import { SIM_INPUT, SIM_BTN_OUTLINE } from '../../ui/styles/simulatorClasses.js';
import type { DeviceStore } from '@signalsafe/simulator-core/apps/store';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';

export function SearchBox({
    label,
    value,
    onChange,
}: Readonly<{
    label: string;
    value: string;
    onChange: (value: string) => void;
}>) {
    return (
        <div className='vault-folder-search'>
            <input
                className={SIM_INPUT}
                type={INPUT_TYPE_SEARCH}
                aria-label={label}
                placeholder={label}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

export function FolderNameForm({
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

export function FolderList({
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
        <div className='vault-folder-group'>
            <SearchBox label={t('app.vault.searchFolders')} value={query} onChange={onQuery} />
            <ul className='vault-list-group' aria-label={t('app.vault.folders')}>
                {matching.map((name) => (
                    <li key={name}>
                        <button type='button' disabled={busy} onClick={() => onOpen(name)}>
                            <span className='vault-folder-name'>{name}</span>
                            <span
                                className='vault-folder-count'
                                aria-label={t('app.vault.secretsCount')}
                            >
                                {counts?.secrets[name] ?? 0}
                            </span>
                            <ChevronRight size={18} aria-hidden='true' />
                        </button>
                    </li>
                ))}
            </ul>
            {matching.length === 0 && <p>{t('app.vault.noMatchingFolders')}</p>}
        </div>
    );
}

export function FolderEditor({
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
        <section className='vault-folder-editor' aria-label={t('app.vault.editFolder')}>
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
                <div className='prototype-actions'>
                    <button
                        className={SIM_BTN_OUTLINE}
                        type='submit'
                        aria-label={t('app.vault.saveFolder')}
                        title={t('app.vault.saveFolder')}
                        disabled={busy}
                    >
                        <Save size={20} aria-hidden='true' />
                    </button>
                    <button
                        className={SIM_BTN_OUTLINE}
                        type='button'
                        aria-label={t('app.vault.deleteFolder')}
                        title={t('app.vault.deleteFolder')}
                        disabled={busy}
                        onClick={onDelete}
                    >
                        <Trash2 size={20} aria-hidden='true' />
                    </button>
                </div>
            </form>
        </section>
    );
}
