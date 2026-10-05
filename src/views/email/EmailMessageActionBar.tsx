import { SimulatorActions } from '../../actions/simulatorActions.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { simLayout } from '../../simulatorStyles.js';
import type { SimulatorAction } from '../../types/session.js';
import { SimulatorButton } from '../../ui/primitives.js';
import { SimulatorButtonTone } from '../../ui/styles/simulatorClasses.js';

export interface EmailMessageActionBarProps {
    onAction: (action: SimulatorAction) => void;
    onBack?: () => void;
    onForward?: () => void;
    onDispose?: () => void;
}

/** Reply, forward, delete and back footer; forward and delete stay disabled without host handlers. */
export function EmailMessageActionBar({
    onAction,
    onBack,
    onForward,
    onDispose,
}: Readonly<EmailMessageActionBarProps>) {
    const screenLocale = useSimulatorLocale();
    return (
        <div className={simLayout.blockFooterRow}>
            <SimulatorButton
                tone={SimulatorButtonTone.Primary}
                className={simLayout.blockButton}
                onClick={() => onAction(SimulatorActions.sendReply())}
                aria-label={screenLocale.t('screen.emailMessageDetail.reply')}
            >
                {screenLocale.t('screen.emailMessageDetail.reply')}
            </SimulatorButton>
            <SimulatorButton
                tone={SimulatorButtonTone.Neutral}
                className={simLayout.blockButton}
                onClick={onForward}
                disabled={!onForward}
                title={!onForward ? screenLocale.t('app.mail.forwardUnavailable') : undefined}
                aria-label={screenLocale.t('screen.emailMessageDetail.forward')}
            >
                {screenLocale.t('screen.emailMessageDetail.forward')}
            </SimulatorButton>
            <SimulatorButton
                tone={SimulatorButtonTone.Neutral}
                className={simLayout.blockButton}
                onClick={onDispose}
                disabled={!onDispose}
                title={!onDispose ? screenLocale.t('app.mail.deleteUnavailable') : undefined}
                aria-label={screenLocale.t('screen.emailMessageDetail.dispose')}
            >
                {screenLocale.t('screen.emailMessageDetail.dispose')}
            </SimulatorButton>
            <SimulatorButton
                tone={SimulatorButtonTone.Neutral}
                className={simLayout.blockButton}
                onClick={() => onBack?.()}
                aria-label={screenLocale.t('screen.emailMessageDetail.back')}
            >
                {screenLocale.t('screen.emailMessageDetail.back')}
            </SimulatorButton>
        </div>
    );
}
