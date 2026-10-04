import {
    SimulatorButtonTone,
    SIM_BTN_SM,
    joinClasses,
    SIM_FLEX_COL,
    SIM_FLEX_GROW_1,
    SIM_FLEX_SHRINK_0,
    SIM_MIN_H_0,
    SIM_OVERFLOW_AUTO,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_LIGHT,
    SIM_TEXT_SM,
} from '../../ui/styles/simulatorClasses.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
/**
 * Email message read/detail: wireframe layout (From, To, Subject, Body), links, attachments,
 * and optional inline actions for standalone rendering; the device supplies a tertiary menu.
 */
import type { EmailScreenId, SimulatorAction } from '../../types/session.js';
import { SimulatorActions } from '../../actions/simulatorActions.js';
import { SimulatorDetailBackBar } from '../../ui/layout/SimulatorDetail.js';
import { simLayout, simSpacing, simTypo, simActionsBar } from '../../simulatorStyles.js';
import { type EmailTemplateContent } from '../../types/template.js';
import { joinKeyParts, withStableKeys } from '../../utils/lists/stableKeys.js';
import {
    SimulatorButton,
    SimulatorField,
    SimulatorInput,
    SimulatorLabel,
    SimulatorTextarea,
} from '../../ui/primitives.js';
import {
    SIM_EMAIL_MESSAGE_DETAIL,
    SIM_EMAIL_MESSAGE_DETAIL_BODY,
} from '../../ui/styles/semanticSimulatorClasses.js';

export interface EmailMessageDetailProps {
    message: EmailTemplateContent;
    onAction: (action: SimulatorAction) => void;
    hideActions?: boolean;
    folderLabel?: string;
    onBack?: () => void;
    /** Host-owned effects; omitted capabilities remain disabled. */
    onForward?: () => void;
    onDispose?: () => void;
    /** When set, Back returns to the parent folder. */
    onNavigate?: (screen: EmailScreenId) => void;
}

const readOnlyFieldClass = joinClasses(SIM_ROUNDED_NONE, SIM_SURFACE_LIGHT);

function ReadOnlyField({ label, value }: Readonly<{ label: string; value: string }>) {
    return (
        <SimulatorField className={joinClasses(simSpacing.mb0, SIM_FLEX_SHRINK_0)}>
            <SimulatorLabel className={simLayout.fieldLabel}>{label}</SimulatorLabel>
            <SimulatorInput
                type="text"
                readOnly
                value={value}
                className={readOnlyFieldClass}
                aria-label={label}
            />
        </SimulatorField>
    );
}

export default function EmailMessageDetail({
    message,
    onAction,
    onBack,
    onForward,
    onDispose,
    hideActions = false,
    folderLabel: suppliedFolderLabel,
}: Readonly<EmailMessageDetailProps>) {
    const screenLocale = useSimulatorLocale();
    const folderLabel = suppliedFolderLabel ?? screenLocale.t('nav.email');

    const hasAttachment = message.attachment_name != null && message.attachment_name !== '';
    const fromDisplay =
        message.from_display_name != null && message.from_display_name !== ''
            ? `${message.from_display_name} <${message.from}>`
            : (message.from ?? '');
    const keyedLinks = withStableKeys(message.links ?? [], (link) =>
        joinKeyParts([link.href, link.text, link.title]),
    );

    return (
        <div className={joinClasses(simLayout.screenColumn, SIM_EMAIL_MESSAGE_DETAIL)}>
            {onBack && (
                <SimulatorDetailBackBar
                    onBack={onBack}
                    title={screenLocale.t('screen.emailMessageDetail.value1.message', {
                        value1: String(folderLabel),
                    })}
                    ariaLabel={screenLocale.t('email.backToFolder', { folder: folderLabel })}
                    titleOnly
                />
            )}
            <div
                className={joinClasses(
                    SIM_FLEX_COL,
                    SIM_FLEX_GROW_1,
                    SIM_MIN_H_0,
                    SIM_OVERFLOW_AUTO,
                    simSpacing.p3,
                )}
            >
                <div
                    className={joinClasses(
                        SIM_FLEX_COL,
                        simSpacing.gap2,
                        SIM_FLEX_GROW_1,
                        SIM_MIN_H_0,
                    )}
                >
                    <ReadOnlyField
                        label={screenLocale.t('screen.emailMessageDetail.from')}
                        value={fromDisplay}
                    />
                    <ReadOnlyField
                        label={screenLocale.t('screen.emailMessageDetail.to')}
                        value={message.to ?? ''}
                    />
                    <ReadOnlyField
                        label={screenLocale.t('screen.emailMessageDetail.bcc')}
                        value={message.bcc ?? ''}
                    />
                    <ReadOnlyField
                        label={screenLocale.t('screen.emailMessageDetail.subject')}
                        value={message.subject ?? ''}
                    />
                    <SimulatorField
                        className={joinClasses(
                            'simulator-email__body-field',
                            simSpacing.mb0,
                            SIM_FLEX_GROW_1,
                            SIM_MIN_H_0,
                            SIM_FLEX_COL,
                            'simulator-flex-shrink-1',
                        )}
                    >
                        <SimulatorLabel className={simLayout.fieldLabel}>
                            {screenLocale.t('screen.emailMessageDetail.body')}
                        </SimulatorLabel>
                        <SimulatorTextarea
                            readOnly
                            value={message.body ?? ''}
                            className={joinClasses(
                                SIM_EMAIL_MESSAGE_DETAIL_BODY,
                                readOnlyFieldClass,
                                SIM_FLEX_GROW_1,
                                SIM_OVERFLOW_AUTO,
                            )}
                            style={{
                                whiteSpace: 'pre-wrap',
                                lineHeight: 1.5,
                                minHeight: 0,
                                resize: 'none',
                            }}
                            aria-label={screenLocale.t('screen.emailMessageDetail.body')}
                        />
                    </SimulatorField>
                </div>
                {message.links != null && message.links.length > 0 && (
                    <div
                        className={joinClasses(
                            simSpacing.dividerTop,
                            simActionsBar,
                            simSpacing.mt3,
                            simSpacing.pt3,
                            SIM_FLEX_SHRINK_0,
                        )}
                    >
                        <span className={joinClasses(simTypo.secondary, simSpacing.me1)}>
                            {screenLocale.t('screen.emailMessageDetail.links')}
                        </span>
                        {keyedLinks.map(({ key, item: link, index }) => (
                            <SimulatorButton
                                key={key}
                                tone={SimulatorButtonTone.PrimaryOutline}
                                className={joinClasses(
                                    'simulator-text--link',
                                    SIM_ROUNDED_NONE,
                                    SIM_BTN_SM,
                                )}
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
                )}
                {hasAttachment && (
                    <div
                        className={joinClasses(
                            simSpacing.dividerTop,
                            SIM_TEXT_SM,
                            simSpacing.mt3,
                            simSpacing.pt3,
                            SIM_FLEX_SHRINK_0,
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
                            aria-label={screenLocale.t(
                                'screen.emailMessageDetail.download.attachment',
                            )}
                        >
                            {screenLocale.t('screen.emailMessageDetail.download')}
                        </SimulatorButton>
                    </div>
                )}
            </div>
            {!hideActions && (
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
                        title={
                            !onForward ? screenLocale.t('app.mail.forwardUnavailable') : undefined
                        }
                        aria-label={screenLocale.t('screen.emailMessageDetail.forward')}
                    >
                        {screenLocale.t('screen.emailMessageDetail.forward')}
                    </SimulatorButton>
                    <SimulatorButton
                        tone={SimulatorButtonTone.Neutral}
                        className={simLayout.blockButton}
                        onClick={onDispose}
                        disabled={!onDispose}
                        title={
                            !onDispose ? screenLocale.t('app.mail.deleteUnavailable') : undefined
                        }
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
            )}
        </div>
    );
}
