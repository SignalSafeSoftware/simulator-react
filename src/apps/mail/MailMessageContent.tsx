import { simulatorAnchorAttributes } from '../../contract/semanticAnchors.js';
import type { ReactNode } from 'react';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';

export interface MailMessageContentProps {
    id?: string;
    subject: string;
    from: string;
    to?: string;
    cc?: string;
    bcc?: string;
    body: string;
    dateText?: string;
    sourceRecordId?: string | null;
    children?: ReactNode;
}

/** Read-only message presentation shared by authored scenarios and device mailboxes. */
export function MailMessageContent({
    id,
    subject,
    from,
    to,
    cc,
    bcc,
    body,
    dateText,
    sourceRecordId,
    children,
}: Readonly<MailMessageContentProps>) {
    const { t } = useSimulatorLocale();
    return (
        <>
            <h3>{subject || t('app.mail.noSubject')}</h3>
            <p>{t('app.mail.from', { value: from })}</p>
            {sourceRecordId && <p>{t('app.mail.importedSource', { id: sourceRecordId })}</p>}
            <p>{t('app.mail.to', { value: to ?? '' })}</p>
            {cc && <p>{t('app.mail.cc', { value: cc })}</p>}
            {bcc && <p>{t('app.mail.bcc', { value: bcc })}</p>}
            <p>{dateText || t('app.mail.dateUnknown')}</p>
            <p
                className='prototype-message-body'
                {...(id
                    ? simulatorAnchorAttributes({
                          kind: 'simulator',
                          anchor: 'email-body',
                          recordId: id,
                      })
                    : {})}
            >
                {body}
            </p>
            {children}
        </>
    );
}
