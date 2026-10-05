import { useMemo, useId, type FormEventHandler, type ReactNode } from 'react';
import { ContactIdentityCard } from '../../ui/contacts/ContactIdentityCard.js';
import { AppSecondaryNav } from '../../apps/shared/AppSecondaryNav.js';
import { useScreenActionMenu } from '../../contract/screenActionMenu.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
interface ContactEditorBase {
    identityImage?: ReactNode;
    /** Optional identity section; hosts supply their own labeled fields and photo controls. */
    identityContent?: ReactNode;
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
    identityContent,
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
    const formId = useId();
    const menu = useMemo(
        () => (
            <AppSecondaryNav
                actions={[
                    {
                        label: saving ? t('contact.saving') : t('contact.save'),
                        icon: '✓',
                        disabled: saving || saveDisabled,
                        type: 'submit',
                        form: formId,
                    },
                    {
                        label: t('action.cancel'),
                        icon: '↩',
                        disabled: saving,
                        onClick: onCancel,
                    },
                ]}
            />
        ),
        [saving, saveDisabled, onCancel, t, formId],
    );
    const menuRenderedByShell = useScreenActionMenu(menu);
    return (
        <>
            <form
                id={formId}
                className='simulator-contact-editor contact-editor-panels'
                onSubmit={(event) => {
                    if (saving || saveDisabled) event.preventDefault();
                    else onSubmit(event);
                }}
            >
                {identityContent ?? (
                    <ContactIdentityCard image={identityImage}>
                        <label>
                            {t('contact.name')}
                            <input
                                name='name'
                                defaultValue={defaultName}
                                maxLength={nameMaxLength}
                                required
                                autoComplete='name'
                            />
                        </label>
                    </ContactIdentityCard>
                )}
                {notice}
                {valueFields ?? (
                    <>
                        <label>
                            {t('phone.number')}
                            <input
                                name='number'
                                value={number}
                                onChange={(event) => onNumberChange?.(event.target.value)}
                                placeholder={numberPlaceholder}
                                type='tel'
                                required={numberRequired}
                            />
                            {numberHint}
                        </label>
                        <label>
                            {t('contact.email')}
                            <input
                                name='email'
                                type='email'
                                autoComplete='email'
                                defaultValue={defaultEmail}
                            />
                        </label>
                    </>
                )}
            </form>
            {!menuRenderedByShell && menu}
        </>
    );
}
