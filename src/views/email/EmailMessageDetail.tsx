/**
 * Email message read/detail: wireframe layout (From, To, Subject, Body), links, attachments,
 * and optional inline actions for standalone rendering; the device supplies a tertiary menu.
 */
import {
    joinClasses,
    SIM_FLEX_COL,
    SIM_FLEX_GROW_1,
    SIM_FLEX_SHRINK_0,
    SIM_MIN_H_0,
    SIM_OVERFLOW_AUTO,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_LIGHT,
} from '../../ui/styles/simulatorClasses.js';
import { FieldInputType } from '../../utils/payload/browserFieldType.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import type { EmailScreenId, SimulatorAction } from '../../types/session.js';
import { SimulatorDetailBackBar } from '../../ui/layout/SimulatorDetail.js';
import { simLayout, simSpacing } from '../../simulatorStyles.js';
import { type EmailTemplateContent } from '../../types/template.js';
import {
    SimulatorField,
    SimulatorInput,
    SimulatorLabel,
    SimulatorTextarea,
} from '../../ui/primitives.js';
import {
    SIM_EMAIL_MESSAGE_DETAIL,
    SIM_EMAIL_MESSAGE_DETAIL_BODY,
} from '../../ui/styles/semanticSimulatorClasses.js';

import { EmailMessageActionBar } from './EmailMessageActionBar.js';
import { EmailMessageAttachment, EmailMessageLinks } from './EmailMessageExtras.js';

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
                type={FieldInputType.Text}
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
                    <EmailMessageLinks links={message.links} onAction={onAction} />
                )}
                {hasAttachment && <EmailMessageAttachment message={message} onAction={onAction} />}
            </div>
            {!hideActions && (
                <EmailMessageActionBar
                    onAction={onAction}
                    onBack={onBack}
                    onForward={onForward}
                    onDispose={onDispose}
                />
            )}
        </div>
    );
}
