import type { RefObject } from 'react';
import { SIM_INPUT, SIM_BTN_OUTLINE } from '../../ui/styles/simulatorClasses.js';
import type { Mail } from '@signalsafe/simulator-core/apps/contracts';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';

const DRAFT_FIELDS = ['to', 'cc', 'bcc', 'subject'] as const;

function MailDraftAttachments({
    draft,
    busy,
    onChange,
}: Readonly<{ draft: Mail; busy: boolean; onChange: (draft: Mail) => void }>) {
    const { t } = useSimulatorLocale();
    const remove = (index: number) =>
        onChange({
            ...draft,
            attachments: draft.attachments.filter((_, offset) => index !== offset),
        });
    return (
        <ul className="prototype-list">
            {draft.attachments.map((asset, index) => (
                <li key={`${index}-${asset.name}`}>
                    {asset.name}
                    <button
                        className={SIM_BTN_OUTLINE}
                        type="button"
                        disabled={busy}
                        onClick={() => remove(index)}
                    >
                        {t('app.mail.removeAttachment', { name: asset.name })}
                    </button>
                </li>
            ))}
        </ul>
    );
}

export function MailDraftForm({
    draft,
    busy,
    formRef,
    onChange,
    onSubmit,
    onAttach,
}: Readonly<{
    draft: Mail;
    busy: boolean;
    formRef: RefObject<HTMLFormElement>;
    onChange: (draft: Mail) => void;
    onSubmit: () => void;
    onAttach: (file: File) => void;
}>) {
    const { t } = useSimulatorLocale();
    const fieldLabels = {
        to: t('app.mail.fieldTo'),
        cc: t('app.mail.fieldCc'),
        bcc: t('app.mail.fieldBcc'),
        subject: t('app.mail.fieldSubject'),
    };
    return (
        <form
            ref={formRef}
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
            }}
        >
            <p>{t('app.mail.from', { value: draft.from })}</p>
            {DRAFT_FIELDS.map((field) => (
                <label key={field}>
                    {fieldLabels[field]}
                    <input
                        className={SIM_INPUT}
                        disabled={busy}
                        value={draft[field]}
                        onChange={(event) => onChange({ ...draft, [field]: event.target.value })}
                    />
                </label>
            ))}
            <label>
                {t('app.mail.body')}
                <textarea
                    className="simulator-textarea"
                    rows={10}
                    disabled={busy}
                    value={draft.body}
                    onChange={(event) => onChange({ ...draft, body: event.target.value })}
                />
            </label>
            <label>
                {t('app.mail.addAttachment')}
                <input
                    className={SIM_INPUT}
                    type="file"
                    disabled={busy}
                    accept="image/png,image/jpeg,image/webp,text/plain,application/pdf"
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = '';
                        if (file) onAttach(file);
                    }}
                />
            </label>
            <MailDraftAttachments draft={draft} busy={busy} onChange={onChange} />
        </form>
    );
}
