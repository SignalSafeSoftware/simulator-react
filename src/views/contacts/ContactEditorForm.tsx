import { useId, useState, type ReactNode } from 'react';
import { ContactIdentityCard } from '../../ui/contacts/ContactIdentityCard.js';
import {
    ContactValueKind,
    ContactValuesEditor,
    ContactValuesHeading,
} from '../../ui/contacts/ContactValuesEditor.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import PhoneContactEditor, { type PhoneContactEditorProps } from './PhoneContactEditor.js';
import {
    displayNameFromIdentity,
    formatPostalAddress,
    identityFromName,
    initialContactDetails,
    postalAddressFields,
    type ContactFormDetails,
    type ContactFormSource,
    type ContactFormValue,
    type ContactPostalAddress,
} from './contactFormModel.js';

const MAX_NAME_LENGTH = 100;
const addressFieldKeys = [
    { key: 'line1', label: 'contact.address.line1', maxLength: 1000 },
    { key: 'line2', label: 'contact.address.line2', maxLength: 1000 },
    { key: 'city', label: 'contact.address.city', maxLength: 300 },
    { key: 'region', label: 'contact.address.region', maxLength: 300 },
    { key: 'postalCode', label: 'contact.address.postalCode', maxLength: 100 },
    { key: 'country', label: 'contact.address.country', maxLength: 300 },
] as const satisfies readonly {
    key: keyof ContactPostalAddress;
    label: string;
    maxLength: number;
}[];

function PostalAddressFields({
    values,
    preferredId,
    createId,
    addressFields,
    onChange,
}: Readonly<{
    values: ContactFormValue[];
    preferredId: string | null;
    createId: () => string;
    addressFields: (value: ContactFormValue) => ContactPostalAddress;
    onChange: (values: ContactFormValue[], preferredId: string | null) => void;
}>) {
    const titleId = useId();
    const { t, number } = useSimulatorLocale();
    const kind = ContactValueKind.Address;
    const update = (id: string, patch: Partial<ContactFormValue>) =>
        onChange(
            values.map((value) => (value.id === id ? { ...value, ...patch } : value)),
            preferredId,
        );
    return (
        <section className='contact-values-panel simulator-list-group' aria-labelledby={titleId}>
            <ContactValuesHeading
                titleId={titleId}
                title={t('contact.addresses')}
                kind={kind}
                full={values.length >= 100}
                onAdd={() =>
                    onChange([...values, { id: createId(), label: '', value: '' }], preferredId)
                }
            />
            {values.map((value, index) => {
                const address = addressFields(value);
                return (
                    <div key={value.id} className='simulator-contact-value-editor'>
                        <label>
                            {t('contact.valueLabel', { kind, index: number(index + 1) })}
                            <input
                                value={value.label}
                                maxLength={100}
                                onChange={(event) =>
                                    update(value.id, { label: event.target.value })
                                }
                            />
                        </label>
                        {addressFieldKeys.map((field) => (
                            <label key={field.key}>
                                {t(field.label)}
                                <textarea
                                    rows={field.key === 'line1' ? 2 : 1}
                                    aria-label={`${t(field.label)} ${index + 1}`}
                                    maxLength={field.maxLength}
                                    required={
                                        field.key === 'line1' &&
                                        !formatPostalAddress(address).trim()
                                    }
                                    value={address[field.key]}
                                    onChange={(event) => {
                                        const next = {
                                            ...address,
                                            [field.key]: event.target.value,
                                        };
                                        update(value.id, {
                                            address: next,
                                            value: formatPostalAddress(next),
                                        });
                                    }}
                                />
                            </label>
                        ))}
                        <div className='contact-value-actions'>
                            <label>
                                <input
                                    type='checkbox'
                                    checked={preferredId === value.id}
                                    onChange={(event) =>
                                        onChange(values, event.target.checked ? value.id : null)
                                    }
                                />
                                {t('contact.preferred', { kind })}
                            </label>
                            <button
                                type='button'
                                aria-label={t('contact.removeValue', { kind, index: index + 1 })}
                                onClick={() =>
                                    onChange(
                                        values.filter((item) => item.id !== value.id),
                                        preferredId === value.id ? null : preferredId,
                                    )
                                }
                            >
                                <span aria-hidden='true'>−</span>
                            </button>
                        </div>
                    </div>
                );
            })}
        </section>
    );
}

export interface ContactEditorFormProps extends Pick<
    PhoneContactEditorProps,
    'onSubmit' | 'onCancel' | 'saving' | 'saveDisabled' | 'notice'
> {
    contact?: ContactFormSource;
    /** Ids for new phone, email and address rows. */
    createId: () => string;
    /** Host-owned photo controls shown above the name fields. */
    identityImage?: ReactNode;
    /** Extra hidden or visible fields submitted with the form, such as a staged photo choice. */
    identityExtras?: ReactNode;
    /** Splits saved address text into fields; defaults to keeping it all in the street line. */
    addressFields?: (value: ContactFormValue) => ContactPostalAddress;
}

/**
 * Shared Add/Edit contact fields: name, phone numbers, email addresses and postal addresses.
 * The form submits `name`, `identity` and `details`; read them with `contactFormValues`.
 */
export default function ContactEditorForm({
    contact,
    createId,
    identityImage,
    identityExtras,
    addressFields = postalAddressFields,
    saveDisabled,
    ...props
}: Readonly<ContactEditorFormProps>) {
    const { t } = useSimulatorLocale();
    const [identity, setIdentity] = useState(
        () => contact?.details?.identity ?? identityFromName(contact?.name),
    );
    const [details, setDetails] = useState<ContactFormDetails>(() =>
        initialContactDetails(contact, createId),
    );
    const name = displayNameFromIdentity(identity);
    const nameTooLong = name.length > MAX_NAME_LENGTH;
    return (
        <PhoneContactEditor
            {...props}
            defaultName={contact?.name}
            saveDisabled={saveDisabled || nameTooLong}
            identityContent={
                <ContactIdentityCard image={identityImage}>
                    <label>
                        {t('contact.firstName')}
                        <input
                            type='text'
                            name='firstName'
                            maxLength={MAX_NAME_LENGTH}
                            value={identity.firstName}
                            required={!identity.lastName.trim() && !identity.company.trim()}
                            onChange={(event) =>
                                setIdentity({ ...identity, firstName: event.target.value })
                            }
                        />
                    </label>
                    <label>
                        {t('contact.lastName')}
                        <input
                            type='text'
                            name='lastName'
                            maxLength={MAX_NAME_LENGTH}
                            value={identity.lastName}
                            onChange={(event) =>
                                setIdentity({ ...identity, lastName: event.target.value })
                            }
                        />
                    </label>
                    <label>
                        {t('contact.company')}
                        <input
                            type='text'
                            name='company'
                            autoComplete='organization'
                            maxLength={MAX_NAME_LENGTH}
                            value={identity.company}
                            onChange={(event) =>
                                setIdentity({ ...identity, company: event.target.value })
                            }
                        />
                    </label>
                    {nameTooLong && <p role='alert'>{t('contact.nameTooLong')}</p>}
                    <input type='hidden' name='name' value={name} />
                    <input type='hidden' name='identity' value={JSON.stringify(identity)} />
                    {identityExtras}
                </ContactIdentityCard>
            }
            valueFields={
                <>
                    <input type='hidden' name='details' value={JSON.stringify(details)} />
                    <input type='hidden' name='number' value='' />
                    <input type='hidden' name='email' value='' />
                    <ContactValuesEditor
                        kind={ContactValueKind.Phone}
                        values={details.phones}
                        preferredId={details.preferredPhone}
                        createId={createId}
                        onChange={(phones, preferredPhone) =>
                            setDetails({ ...details, phones, preferredPhone })
                        }
                    />
                    <ContactValuesEditor
                        kind={ContactValueKind.Email}
                        values={details.emails}
                        preferredId={details.preferredEmail}
                        createId={createId}
                        onChange={(emails, preferredEmail) =>
                            setDetails({ ...details, emails, preferredEmail })
                        }
                    />
                    <PostalAddressFields
                        values={details.addresses}
                        preferredId={details.preferredAddress}
                        createId={createId}
                        addressFields={addressFields}
                        onChange={(addresses, preferredAddress) =>
                            setDetails({ ...details, addresses, preferredAddress })
                        }
                    />
                </>
            }
        />
    );
}
