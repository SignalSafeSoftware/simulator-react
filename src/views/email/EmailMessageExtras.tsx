import { SimulatorActions } from '../../actions/simulatorActions.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { simSpacing, simTypo, simActionsBar } from '../../simulatorStyles.js';
import type { SimulatorAction } from '../../types/session.js';
import type { EmailTemplateContent, EmailTemplateLink } from '../../types/template.js';
import { SimulatorButton } from '../../ui/primitives.js';
import { SIM_EMAIL_MESSAGE_DETAIL_EXTRAS } from '../../ui/styles/semanticSimulatorClasses.js';
import {
    SIM_BTN_SM,
    SIM_FLEX_SHRINK_0,
    SIM_ROUNDED_NONE,
    SIM_TEXT_SM,
    SimulatorButtonTone,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';
import { joinKeyParts, withStableKeys } from '../../utils/lists/stableKeys.js';

type ActionHandler = (action: SimulatorAction) => void;

/** Link buttons shown under the message body. */
export function EmailMessageLinks({
    links,
    onAction,
}: Readonly<{ links: EmailTemplateLink[]; onAction: ActionHandler }>) {
    const screenLocale = useSimulatorLocale();
    const keyedLinks = withStableKeys(links, (link) =>
        joinKeyParts([link.href, link.text, link.title]),
    );
    return (
        <div
            className={joinClasses(
                simSpacing.dividerTop,
                simActionsBar,
                simSpacing.mt3,
                simSpacing.pt3,
                SIM_FLEX_SHRINK_0,
                SIM_EMAIL_MESSAGE_DETAIL_EXTRAS,
            )}
        >
            <span className={joinClasses(simTypo.secondary, simSpacing.me1)}>
                {screenLocale.t('screen.emailMessageDetail.links')}
            </span>
            {keyedLinks.map(({ key, item: link, index }) => (
                <SimulatorButton
                    key={key}
                    tone={SimulatorButtonTone.PrimaryOutline}
                    className={joinClasses('simulator-text--link', SIM_ROUNDED_NONE, SIM_BTN_SM)}
                    onClick={() =>
                        onAction(
                            SimulatorActions.clickLink({
                                linkIndex: index,
                                href: link.href,
                            }),
                        )
                    }
                    aria-label={link.text || link.href}
                >
                    {link.text || link.href}
                </SimulatorButton>
            ))}
        </div>
    );
}

/** Attachment summary with open/download actions. */
export function EmailMessageAttachment({
    message,
    onAction,
}: Readonly<{ message: EmailTemplateContent; onAction: ActionHandler }>) {
    const screenLocale = useSimulatorLocale();
    return (
        <div
            className={joinClasses(
                simSpacing.dividerTop,
                SIM_TEXT_SM,
                simSpacing.mt3,
                simSpacing.pt3,
                SIM_FLEX_SHRINK_0,
                SIM_EMAIL_MESSAGE_DETAIL_EXTRAS,
            )}
        >
            <span className={joinClasses(simTypo.secondary, simSpacing.me2)}>
                {screenLocale.t('screen.emailMessageDetail.attachment')}
                {message.attachment_name}
                {message.attachment_type != null && message.attachment_type !== '' && (
                    <span className={simSpacing.ms1}>({message.attachment_type})</span>
                )}
            </span>
            <SimulatorButton
                tone={SimulatorButtonTone.NeutralOutline}
                className={joinClasses(simSpacing.me1, SIM_ROUNDED_NONE, SIM_BTN_SM)}
                onClick={() => onAction(SimulatorActions.openAttachment(0))}
                aria-label={screenLocale.t('screen.emailMessageDetail.open.attachment')}
            >
                {screenLocale.t('screen.emailMessageDetail.open')}
            </SimulatorButton>
            <SimulatorButton
                tone={SimulatorButtonTone.NeutralOutline}
                className={joinClasses(SIM_ROUNDED_NONE, SIM_BTN_SM)}
                onClick={() => onAction(SimulatorActions.downloadAttachment(0))}
                aria-label={screenLocale.t('screen.emailMessageDetail.download.attachment')}
            >
                {screenLocale.t('screen.emailMessageDetail.download')}
            </SimulatorButton>
        </div>
    );
}
