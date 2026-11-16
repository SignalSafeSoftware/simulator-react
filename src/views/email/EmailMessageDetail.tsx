import { DevicePage } from '../../apps/shared/DevicePage.js';
import { MailMessageContent } from '../../apps/mail/MailMessageContent.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import type { EmailScreenId, SimulatorAction } from '../../types/session.js';
import type { EmailTemplateContent } from '../../types/template.js';
import { SIM_EMAIL_MESSAGE_DETAIL } from '../../ui/styles/semanticSimulatorClasses.js';
import { EmailMessageActionBar } from './EmailMessageActionBar.js';
import { EmailMessageAttachment, EmailMessageLinks } from './EmailMessageExtras.js';

export interface EmailMessageDetailProps {
    message: EmailTemplateContent;
    /** Stable identity supplied separately by scenario sessions. */
    messageId?: string;
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

export default function EmailMessageDetail({
    message,
    messageId,
    onAction,
    onBack,
    onForward,
    onDispose,
    hideActions = false,
    folderLabel,
}: Readonly<EmailMessageDetailProps>) {
    const screenLocale = useSimulatorLocale();

    const hasAttachment = message.attachment_name != null && message.attachment_name !== '';
    const fromDisplay =
        message.from_display_name != null && message.from_display_name !== ''
            ? `${message.from_display_name} <${message.from}>`
            : (message.from ?? '');

    return (
        <DevicePage title={screenLocale.t('app.mail.title')}>
            <article className={SIM_EMAIL_MESSAGE_DETAIL} aria-label={folderLabel}>
                <MailMessageContent
                    {...message}
                    {...(messageId ? { id: messageId } : {})}
                    from={fromDisplay}
                    dateText={message.date_at}
                />
                {message.links != null && message.links.length > 0 && (
                    <EmailMessageLinks links={message.links} onAction={onAction} />
                )}
                {hasAttachment && <EmailMessageAttachment message={message} onAction={onAction} />}
                {!hideActions && (
                    <EmailMessageActionBar
                        onAction={onAction}
                        onBack={onBack}
                        onForward={onForward}
                        onDispose={onDispose}
                    />
                )}
            </article>
        </DevicePage>
    );
}
