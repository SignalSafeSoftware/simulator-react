import { useSimulatorCapabilities } from '../contract/capabilities.js';
import { useSimulatorLocale } from '../i18n/SimulatorLocale.js';
import { useMessageComposeOptions } from './messageComposeContract.js';
/**
 * Messages app: New Thread page. Wireframe (Messages.png): header "New Thread",
 * Phone Number field, Message body textarea, Send (blue) and Cancel (grey) buttons.
 */
import { useRef, useState } from 'react';

import { simLayout, simScreen, simSpacing } from '../simulatorStyles.js';
import {
    SimulatorButton,
    SimulatorField,
    SimulatorInput,
    SimulatorLabel,
    SimulatorTextarea,
} from '../ui/primitives.js';
import {
    joinClasses,
    SIM_FLEX_GROW_1,
    SIM_FLEX_SHRINK_0,
    SIM_MIN_H_0,
    SIM_ROUNDED_NONE,
    SIM_TEXT_SEMIBOLD,
} from '../ui/simulatorClasses.js';

export interface MessagesNewThreadViewProps {
    onBack: () => void;
    navRenderedByShell?: boolean;
    onSend?: (message: { phoneNumber: string; messageBody: string }) => void | Promise<void>;
}

const footerBtnClass = joinClasses(
    SIM_ROUNDED_NONE,
    'simulator-btn--block',
    simSpacing.py2,
    SIM_TEXT_SEMIBOLD,
    SIM_FLEX_GROW_1,
);

export default function MessagesNewThreadView({
    onBack,
    onSend: send,
    navRenderedByShell = false,
}: Readonly<MessagesNewThreadViewProps>) {
    const compose = useMessageComposeOptions();
    const { t } = useSimulatorLocale();
    const onSend = send ?? compose?.onSend;
    const capability = useSimulatorCapabilities().sendMessage;
    let unavailable = onSend ? '' : t('messages.unconfigured');
    if (capability && capability.state !== 'enabled') {
        unavailable = capability.reason;
    }
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const sending = useRef(false);
    const [localNumber, setLocalNumber] = useState('');
    const [localBody, setLocalBody] = useState('');
    const phoneNumber = compose?.draft.phoneNumber ?? localNumber;
    const messageBody = compose?.draft.messageBody ?? localBody;
    const setPhoneNumber = (next: string) => {
        setLocalNumber(next);
        if (compose) compose.onChange({ ...compose.draft, phoneNumber: next });
    };
    const setMessageBody = (next: string) => {
        setLocalBody(next);
        if (compose) compose.onChange({ ...compose.draft, messageBody: next });
    };

    const handleSend = async () => {
        if (!onSend || unavailable || sending.current || !phoneNumber.trim() || !messageBody.trim())
            return;
        sending.current = true;
        setPending(true);
        setError('');
        try {
            await onSend({ phoneNumber: phoneNumber.trim(), messageBody });
            setLocalNumber('');
            setLocalBody('');
            compose?.onChange({ phoneNumber: '', messageBody: '' });
            compose?.onAccepted?.();
            onBack();
        } catch (error_) {
            setError(error_ instanceof Error ? error_.message : t('messages.sendFailed'));
        } finally {
            sending.current = false;
            setPending(false);
        }
    };

    return (
        <form
            className={`${simLayout.screenColumn} simulator-messages__composer`}
            onSubmit={(event) => {
                event.preventDefault();
                void handleSend();
            }}
        >
            <div className={joinClasses(simScreen.header, simSpacing.mb3, SIM_FLEX_SHRINK_0)}>
                {t('messages.newThread')}
            </div>
            {unavailable && <p><output>{unavailable}</output></p>}
            {!unavailable && !pending && (!phoneNumber.trim() || !messageBody.trim()) && (
                <p><output>{t('messages.enterRecipientAndBody')}</output></p>
            )}
            {pending && <p><output>{t('messages.sending')}</output></p>}
            {error && <p role="alert">{error}</p>}
            <div className={joinClasses(simSpacing.px3, simSpacing.pt3, SIM_FLEX_SHRINK_0)}>
                <SimulatorField>
                    <SimulatorLabel className={simLayout.fieldLabel}>
                        {t('phone.number')}
                    </SimulatorLabel>
                    <SimulatorInput
                        type="tel"
                        disabled={pending || (!onSend && !compose)}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder=""
                        className={SIM_ROUNDED_NONE}
                        aria-label={t('phone.number')}
                    />
                </SimulatorField>
            </div>
            <div className={joinClasses(SIM_FLEX_GROW_1, SIM_MIN_H_0)} aria-hidden />
            <div className="simulator-new-thread__fields">
                <SimulatorField className={simSpacing.mb0}>
                    <SimulatorLabel className={simLayout.fieldLabel}>
                        {t('messages.message')}
                    </SimulatorLabel>
                    <SimulatorTextarea
                        rows={3}
                        disabled={pending || (!onSend && !compose)}
                        value={messageBody}
                        onChange={(e) => setMessageBody(e.target.value)}
                        placeholder={t('messages.placeholder')}
                        className={SIM_ROUNDED_NONE}
                        aria-label={t('messages.body')}
                    />
                </SimulatorField>
                {!navRenderedByShell && (
                    <div
                        className={joinClasses(
                            simLayout.actionsRow,
                            'simulator-new-thread__inline-actions',
                        )}
                    >
                        <SimulatorButton
                            tone="primary"
                            className={footerBtnClass}
                            type="submit"
                            disabled={
                                Boolean(unavailable) ||
                                pending ||
                                !phoneNumber.trim() ||
                                !messageBody.trim()
                            }
                            aria-label={t('action.send')}
                        >
                            {t('action.send')}
                        </SimulatorButton>
                        <SimulatorButton
                            tone="secondary"
                            className={footerBtnClass}
                            type="button"
                            disabled={pending}
                            onClick={onBack}
                            aria-label={t('action.cancel')}
                        >
                            {t('action.cancel')}
                        </SimulatorButton>
                    </div>
                )}
            </div>
        </form>
    );
}
