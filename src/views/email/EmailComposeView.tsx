import { DevicePage } from '../../apps/shared/DevicePage.js';
import { MailComposeFields } from '../../apps/mail/MailComposeFields.js';
import { SIM_FLEX_ROW } from '../../ui/styles/simulatorClasses.js';
import { useReportComposerState } from '../../contract/composerState.js';
import { useComposerSubmit } from '../../hooks/useComposerSubmit.js';
import { SimulatorCapabilityState, useSimulatorCapabilities } from '../../contract/capabilities.js';
import { useState } from 'react';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import {
    useEmailComposeOptions,
    type EmailComposeDraft,
    type EmailComposeOptions,
} from '../../contract/emailComposeContract.js';

export interface EmailComposeViewProps extends EmailComposeOptions {
    onCancel: () => void;
    hideActions?: boolean;
}

const EMPTY_DRAFT: EmailComposeDraft = { to: '', bcc: '', subject: '', body: '' };

/** One submission path for form, keyboard and shell navigation. Sending belongs to the host. */
export default function EmailComposeView({
    onCancel,
    hideActions = false,
    ...props
}: Readonly<EmailComposeViewProps>) {
    const capability = useSimulatorCapabilities().sendEmail;
    const options = useEmailComposeOptions();
    const onSend = props.onSend ?? options?.onSend;
    const onDraftChange = props.onDraftChange ?? options?.onDraftChange;
    const [localDraft, setLocalDraft] = useState<EmailComposeDraft>(EMPTY_DRAFT);
    const draft = props.draft ?? options?.draft ?? localDraft;
    const { t } = useSimulatorLocale();
    let unavailable = onSend ? '' : t('email.unconfigured');
    if (capability && capability.state !== SimulatorCapabilityState.Enabled) {
        unavailable = capability.reason;
    }
    const update = (key: keyof EmailComposeDraft, value: string) => {
        const next = { ...draft, [key]: value };
        setLocalDraft(next);
        onDraftChange?.(next);
    };
    const canSend = Boolean(onSend && !unavailable && draft.to.trim());
    const { pending, error, submit } = useComposerSubmit({
        canSend,
        send: () =>
            onSend?.({
                ...draft,
                to: draft.to.trim(),
                bcc: draft.bcc.trim(),
                subject: draft.subject.trim(),
            }),
        onSent: () => {
            setLocalDraft(EMPTY_DRAFT);
            onDraftChange?.(EMPTY_DRAFT);
            onCancel();
        },
        failureMessage: t('email.sendFailed'),
    });
    useReportComposerState(canSend, pending);
    return (
        <DevicePage title={t('app.mail.newEmail')}>
            {unavailable && (
                <p>
                    <output>{unavailable}</output>
                </p>
            )}
            {!unavailable && !pending && !draft.to.trim() && (
                <p>
                    <output>{t('email.enterRecipient')}</output>
                </p>
            )}
            {pending && (
                <p>
                    <output>{t('email.sending')}</output>
                </p>
            )}
            {error && <p role='alert'>{error}</p>}
            <form
                className='simulator-email__composer simulator-flex simulator-flex--column simulator-spacing--gap-3'
                onSubmit={(event) => {
                    event.preventDefault();
                    void submit();
                }}
            >
                <MailComposeFields
                    values={draft}
                    requireRecipient
                    disabled={pending || (!onSend && !onDraftChange)}
                    onChange={(field, value) => {
                        if (field !== 'cc') update(field, value);
                    }}
                />
                {!hideActions && (
                    <div className={SIM_FLEX_ROW}>
                        <button
                            type='submit'
                            aria-label={t('action.send')}
                            disabled={
                                Boolean(unavailable) || !onSend || pending || !draft.to.trim()
                            }
                        >
                            {t('action.send')}
                        </button>
                        <button
                            type='button'
                            aria-label={t('action.cancel')}
                            disabled={pending}
                            onClick={onCancel}
                        >
                            {t('action.cancel')}
                        </button>
                    </div>
                )}
            </form>
        </DevicePage>
    );
}
