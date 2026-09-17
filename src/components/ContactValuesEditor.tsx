import { useId, useState } from 'react';
import { usePhoneNumberFormatter } from '../contract/phonePresentation.js';
import { useSimulatorLocale } from '../i18n/SimulatorLocale.js';
export interface EditableContactValue {
    id: string;
    label: string;
    value: string;
    number?: string | null;
}
type Value = EditableContactValue;
export interface ContactValuesEditorProps {
    kind: 'phone' | 'email' | 'address';
    values: readonly Value[];
    preferredId: string | null;
    createId: () => string;
    label?: Exclude<import('react').ReactNode, undefined>;
    onChange: (values: Value[], preferred: string | null) => void;
}
export function ContactValuesEditor({
    kind,
    values,
    preferredId,
    createId,
    label,
    onChange,
}: Readonly<ContactValuesEditorProps>) {
    const titleId = useId();
    const contactPhoneDisplay = usePhoneNumberFormatter();
    const { t } = useSimulatorLocale();
    const [focusedValue, setFocusedValue] = useState<string | null>(null);
    const titleKeys = { phone: 'contact.phones', email: 'contact.emails', address: 'contact.addresses' } as const;
    const singularKeys = { phone: 'contact.phone', email: 'contact.email', address: 'contact.address' } as const;
    const title = t(titleKeys[kind]);
    const singular = t(singularKeys[kind]);
    const labels =
        kind === 'phone'
            ? [t('contact.mobile'), t('contact.home'), t('contact.work')]
            : [t('contact.home'), t('contact.work')];
    const update = (id: string, patch: Partial<Value>) =>
        onChange(
            values.map((value) =>
                value.id === id
                    ? {
                          ...value,
                          ...patch,
                          ...(patch.value !== undefined && kind === 'phone'
                              ? { number: null }
                              : {}),
                      }
                    : value,
            ),
            preferredId,
        );
    return (
        <section className="contact-values-panel simulator-list-group" aria-labelledby={titleId}>
            <header className="contact-values-heading">
                <h3 id={titleId}>{label ?? title}</h3>
                <button
                    type="button"
                    aria-label={t('contact.addValue', { kind })}
                    title={t('contact.addValue', { kind })}
                    disabled={values.length >= 100}
                    onClick={() =>
                        onChange([...values, { id: createId(), label: '', value: '' }], preferredId)
                    }
                >
                    <span aria-hidden="true">＋</span>
                </button>
            </header>
            <datalist id={`${titleId}-labels`}>
                {labels.map((label) => (
                    <option key={label} value={label}>
                        {label}
                    </option>
                ))}
            </datalist>
            {values.map((value, index) => (
                <div className="simulator-contact-value-editor" key={value.id}>
                    <label>
                        {t('contact.valueLabel', { kind, index: index + 1 })}
                        <input
                            list={`${titleId}-labels`}
                            maxLength={100}
                            value={value.label}
                            placeholder={t('contact.unlabeled')}
                            autoComplete="off"
                            onChange={(event) => update(value.id, { label: event.target.value })}
                        />
                    </label>
                    <label>
                        {singular} {index + 1}
                        <textarea
                            rows={kind === 'address' ? 3 : 1}
                            required
                            maxLength={4000}
                            value={
                                kind === 'phone' && focusedValue !== value.id
                                    ? contactPhoneDisplay(value.value)
                                    : value.value
                            }
                            onFocus={() => setFocusedValue(value.id)}
                            onBlur={() => setFocusedValue(null)}
                            onChange={(event) => update(value.id, { value: event.target.value })}
                        />
                    </label>
                    <div className="contact-value-actions">
                        <label>
                            <input
                                type="checkbox"
                                checked={preferredId === value.id}
                                onChange={(event) =>
                                    onChange([...values], event.target.checked ? value.id : null)
                                }
                            />
                            {t('contact.preferred', { kind })}
                        </label>
                        <button
                            type="button"
                            aria-label={t('contact.removeValue', { kind, index: index + 1 })}
                            title={t('contact.removeValue', { kind, index: index + 1 })}
                            onClick={() =>
                                onChange(
                                    values.filter((item) => item.id !== value.id),
                                    preferredId === value.id ? null : preferredId,
                                )
                            }
                        >
                            <span aria-hidden="true">−</span>
                        </button>
                    </div>
                </div>
            ))}
        </section>
    );
}
