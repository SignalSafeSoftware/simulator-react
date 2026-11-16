import { SIM_INPUT } from '../../ui/styles/simulatorClasses.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';

export type MailComposeField = 'to' | 'cc' | 'bcc' | 'subject' | 'body';
export type MailComposeValues = Readonly<{
    to: string;
    cc?: string;
    bcc: string;
    subject: string;
    body: string;
}>;

/** Both mailbox types use these fields; each host retains submission and attachment ownership. */
export function MailComposeFields({
    values,
    disabled,
    requireRecipient = false,
    onChange,
}: Readonly<{
    values: MailComposeValues;
    disabled: boolean;
    requireRecipient?: boolean;
    onChange: (field: MailComposeField, value: string) => void;
}>) {
    const { t } = useSimulatorLocale();
    const fields = [
        { name: 'to', label: t('app.mail.fieldTo') },
        ...(values.cc === undefined
            ? []
            : ([{ name: 'cc', label: t('app.mail.fieldCc') }] as const)),
        { name: 'bcc', label: t('app.mail.fieldBcc') },
        { name: 'subject', label: t('app.mail.fieldSubject') },
    ] as const;
    return (
        <>
            {fields.map(({ name, label }) => (
                <label key={name}>
                    {label}
                    <input
                        className={SIM_INPUT}
                        aria-label={label}
                        disabled={disabled}
                        value={values[name]}
                        required={name === 'to' && requireRecipient}
                        onChange={(event) => onChange(name, event.target.value)}
                    />
                </label>
            ))}
            <label>
                {t('app.mail.body')}
                <textarea
                    className='simulator-textarea'
                    aria-label={t('app.mail.body')}
                    rows={10}
                    disabled={disabled}
                    value={values.body}
                    onChange={(event) => onChange('body', event.target.value)}
                />
            </label>
        </>
    );
}
