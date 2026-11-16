import { simulatorAnchorAttributes } from '../../contract/semanticAnchors.js';
import { UserRound } from 'lucide-react';
import { SIM_BTN_OUTLINE } from '../../ui/styles/simulatorClasses.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';

export interface MailMessageRowProps {
    id?: string;
    subject: string;
    address: string;
    snippet: string;
    dateText: string;
    dateTime?: string;
    unread: boolean;
    selected?: boolean;
    disabled?: boolean;
    onOpen: () => void;
}

export function MailMessageRow({
    id,
    subject,
    address,
    snippet,
    dateText,
    dateTime,
    unread,
    selected,
    disabled,
    onOpen,
}: Readonly<MailMessageRowProps>) {
    const { t } = useSimulatorLocale();
    return (
        <li>
            <button
                type='button'
                {...(id
                    ? simulatorAnchorAttributes({
                          kind: 'simulator',
                          anchor: 'email-row',
                          recordId: id,
                      })
                    : {})}
                className={`${SIM_BTN_OUTLINE}${selected ? ' simulator-surface--selected' : ''}`}
                disabled={disabled}
                aria-pressed={selected}
                onClick={onOpen}
            >
                <span
                    className='prototype-mail-avatar simulator-avatar simulator-surface--avatar'
                    aria-hidden='true'
                >
                    <UserRound size={24} strokeWidth={1.5} aria-hidden='true' />
                </span>
                <span className='prototype-mail-content'>
                    <span className='prototype-mail-heading'>
                        <strong>
                            {unread && '● '}
                            {subject || t('app.mail.noSubject')}
                        </strong>
                        <time dateTime={dateTime}>{dateText}</time>
                    </span>
                    <span>{address}</span>
                    <span>{snippet}</span>
                </span>
            </button>
        </li>
    );
}
