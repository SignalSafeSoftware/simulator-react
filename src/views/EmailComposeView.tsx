import { useSimulatorCapabilities } from '../contract/capabilities.js';
import { useRef, useState } from 'react';
import { SimulatorPage } from '../components/SimulatorPage.js';
import { useSimulatorLocale } from '../i18n/SimulatorLocale.js';
import {
    useEmailComposeOptions,
    type EmailComposeDraft,
    type EmailComposeOptions,
} from './emailComposeContract.js';

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
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const sending = useRef(false);
    const { t } = useSimulatorLocale();
    let unavailable = onSend ? '' : t('email.unconfigured');
    if (capability && capability.state !== 'enabled') {
        unavailable = capability.reason;
    }
    const update = (key: keyof EmailComposeDraft, value: string) => {
        const next = { ...draft, [key]: value };
        setLocalDraft(next);
        onDraftChange?.(next);
    };
    const submit = async () => {
        if (unavailable || !onSend || sending.current || !draft.to.trim()) return;
        sending.current = true;
        setPending(true);
        setError('');
        try {
            await onSend({
                ...draft,
                to: draft.to.trim(),
                bcc: draft.bcc.trim(),
                subject: draft.subject.trim(),
            });
            setLocalDraft(EMPTY_DRAFT);
            onDraftChange?.(EMPTY_DRAFT);
            onCancel();
        } catch (error_) {
            setError(error_ instanceof Error ? error_.message : t('email.sendFailed'));
        } finally {
            sending.current = false;
            setPending(false);
        }
    };
    return (
        <SimulatorPage
            className="simulator-flex simulator-flex--column"
            header={<div className="simulator-screen__header">{t('email.compose')}</div>}
        >
            {unavailable && <p><output>{unavailable}</output></p>}
            {!unavailable && !pending && !draft.to.trim() && (
                <p><output>{t('email.enterRecipient')}</output></p>
            )}
            {pending && <p><output>{t('email.sending')}</output></p>}
            {error && <p role="alert">{error}</p>}
            <form
                className="simulator-email__composer simulator-flex simulator-flex--column simulator-spacing--gap-3"
                onSubmit={(event) => {
                    event.preventDefault();
                    void submit();
                }}
            >
                {(['to', 'bcc', 'subject'] as const).map((key) => {
                    const labelKeys = { to: 'email.recipient', bcc: 'email.bcc', subject: 'email.subject' } as const;
                    const label = t(labelKeys[key]);
                    return (
                        <label className="simulator-field" key={key}>
                            <span className="simulator-field__label">{label}</span>
                            <input
                                className="simulator-input simulator-rounded--none"
                                aria-label={label}
                                value={draft[key]}
                                disabled={pending || (!onSend && !onDraftChange)}
                                required={key === 'to'}
                                onChange={(event) => update(key, event.target.value)}
                            />
                        </label>
                    );
                })}
                <label className="simulator-field">
                    <span className="simulator-field__label">{t('email.body')}</span>
                    <textarea
                        className="simulator-input simulator-rounded--none"
                        rows={6}
                        aria-label={t('email.body')}
                        value={draft.body}
                        disabled={pending || (!onSend && !onDraftChange)}
                        onChange={(event) => update('body', event.target.value)}
                    />
                </label>
                {!hideActions && (
                    <div className="simulator-flex simulator-flex--row">
                        <button
                            type="submit"
                            aria-label={t('action.send')}
                            disabled={
                                Boolean(unavailable) || !onSend || pending || !draft.to.trim()
                            }
                        >
                            {t('action.send')}
                        </button>
                        <button
                            type="button"
                            aria-label={t('action.cancel')}
                            disabled={pending}
                            onClick={onCancel}
                        >
                            {t('action.cancel')}
                        </button>
                    </div>
                )}
            </form>
        </SimulatorPage>
    );
}
