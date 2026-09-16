import type { FormEventHandler, ReactNode } from 'react';
import { useSimulatorLocale } from '../i18n/SimulatorLocale.js';
interface ContactEditorBase {
    identityImage?: ReactNode;
    notice?: ReactNode;
    defaultName?: string;
    defaultEmail?: string;
    onSubmit: FormEventHandler<HTMLFormElement>;
    onCancel: () => void;
    saving?: boolean;
    saveDisabled?: boolean;
    numberHint?: ReactNode;
    nameMaxLength?: number;
    numberRequired?: boolean;
    numberPlaceholder?: string;
}
export type PhoneContactEditorProps = ContactEditorBase &
    (
        | { valueFields: ReactNode; number?: never; onNumberChange?: never }
        | { valueFields?: undefined; number: string; onNumberChange: (value: string) => void }
    );
/** Presentation only: revisions, normalization and persistence belong to the host. */
export default function PhoneContactEditor({
    valueFields,
    identityImage,
    notice,
    defaultName,
    defaultEmail,
    number,
    onNumberChange,
    onSubmit,
    onCancel,
    saving = false,
    saveDisabled = false,
    numberHint,
    nameMaxLength = 100,
    numberRequired = false,
    numberPlaceholder,
}: Readonly<PhoneContactEditorProps>) {
    const { t } = useSimulatorLocale();
    return (
        <form className="simulator-contact-editor contact-editor-panels" onSubmit={onSubmit}>
            <section className="contact-identity-panel" aria-label={t('contact.identity')}>
                {identityImage}
                <label>
                    {t('contact.name')}
                    <input
                        name="name"
                        defaultValue={defaultName}
                        maxLength={nameMaxLength}
                        required
                        autoComplete="name"
                    />
                </label>
            </section>
            {notice}
            {valueFields ?? (
                <>
                    <label>
                        {t('phone.number')}
                        <input
                            name="number"
                            value={number}
                            onChange={(event) => onNumberChange?.(event.target.value)}
                            placeholder={numberPlaceholder}
                            type="tel"
                            required={numberRequired}
                        />
                        {numberHint}
                    </label>
                    <label>
                        {t('contact.email')}
                        <input
                            name="email"
                            type="email"
                            autoComplete="email"
                            defaultValue={defaultEmail}
                        />
                    </label>
                </>
            )}
            <div className="simulator-editor-actions">
                <button
                    type="button"
                    className="simulator-editor-cancel"
                    onClick={onCancel}
                    disabled={saving}
                >
                    {t('action.cancel')}
                </button>
                <button
                    type="submit"
                    className="simulator-editor-save"
                    disabled={saving || saveDisabled}
                >
                    {saving ? t('contact.saving') : t('contact.save')}
                </button>
            </div>
        </form>
    );
}
