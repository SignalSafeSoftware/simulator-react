import { useId, type RefObject } from 'react';
import { FieldInputType } from '../../utils/payload/browserFieldType.js';
import { AUTOCOMPLETE_OFF } from '../../constants.js';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { SIM_INPUT, SIM_BTN_OUTLINE } from '../../ui/styles/simulatorClasses.js';
import {
    SECRET_TYPES,
    secretTypeSchema,
    type Secret,
} from '@signalsafe/simulator-core/apps/contracts';
import { useSimulatorAppsHost } from '../shared/SimulatorAppsHost.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { type TypeLabels } from './vaultShared.js';

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
        <div className='vault-entry-field'>
            <label htmlFor={secretId}>{t('app.vault.secret')}</label>
            <div className='vault-secret-group'>
                <button
                    className={SIM_BTN_OUTLINE}
                    type='button'
                    aria-label={t('app.vault.copySecret')}
                    title={t('app.vault.copySecret')}
                    onClick={onCopy}
                >
                    <Copy size={18} aria-hidden='true' />
                </button>
                <input
                    id={secretId}
                    className={SIM_INPUT}
                    autoComplete='new-password'
                    type={reveal ? FieldInputType.Text : FieldInputType.Password}
                    required
                    disabled={busy}
                    value={draft.value}
                    onChange={(event) => onChange({ ...draft, value: event.target.value })}
                />
                <button
                    className={SIM_BTN_OUTLINE}
                    type='button'
                    aria-label={toggleLabel}
                    title={toggleLabel}
                    aria-pressed={reveal}
                    onClick={onReveal}
                >
                    {reveal ? (
                        <EyeOff size={18} aria-hidden='true' />
                    ) : (
                        <Eye size={18} aria-hidden='true' />
                    )}
                </button>
            </div>
        </div>
    );
}

export function SecretForm({
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
            className='vault-entry-form'
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
                        autoComplete={AUTOCOMPLETE_OFF}
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
