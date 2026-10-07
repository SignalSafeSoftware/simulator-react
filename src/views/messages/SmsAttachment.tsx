import type { SmsMessageAttachment } from '@signalsafe/simulator-core/devicePayload';
import { useId, useState, type ReactNode } from 'react';
import { MessageSender, type SimulatorAction } from '../../types/session.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { SimulatorActions } from '../../actions/simulatorActions.js';
import { simLayout } from '../../simulatorStyles.js';
import { renderSimulatorChoice, type SimulatorChoiceRenderProps } from '../../ui/renderSlots.js';
import {
    SIM_BTN_PLAIN,
    SIM_MUTED,
    SIM_TEXT_SM,
    SimulatorButtonTone,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';

const AttachmentStatus = { Available: 'available', Unavailable: 'unavailable' } as const;

/** URL availability controls presentation; labels remain authored content in any language. */
export function SmsAttachment({
    attachment,
    sender,
    onAction,
    renderChoice,
}: Readonly<{
    attachment: SmsMessageAttachment;
    sender: MessageSender;
    onAction: (action: SimulatorAction) => void;
    renderChoice?: (choice: SimulatorChoiceRenderProps) => ReactNode;
}>) {
    const locale = useSimulatorLocale();
    const descriptionId = useId();
    const [expanded, setExpanded] = useState(false);
    const status = attachment.url?.trim()
        ? AttachmentStatus.Available
        : AttachmentStatus.Unavailable;
    const unavailable = status === AttachmentStatus.Unavailable;
    const description = locale.t('screen.smsSimulatorView.attachment.unavailable', {
        label: attachment.label,
    });
    return (
        <div
            data-attachment-status={status}
            className={joinClasses(
                simLayout.actionsRow,
                SIM_TEXT_SM,
                unavailable && 'simulator-messages__attachment-row',
                unavailable &&
                    sender === MessageSender.Me &&
                    'simulator-messages__attachment-row--sent',
            )}
        >
            {unavailable ? (
                <>
                    <button
                        type='button'
                        className={joinClasses(SIM_MUTED, 'simulator-messages__attachment-notice')}
                        aria-label={description}
                        title={description}
                        aria-expanded={expanded}
                        aria-controls={descriptionId}
                        onClick={() => setExpanded((value) => !value)}
                    >
                        📎 {attachment.label}
                    </button>
                    <p
                        id={descriptionId}
                        className='simulator-messages__attachment-description'
                        hidden={!expanded}
                    >
                        {description}
                    </p>
                </>
            ) : (
                renderSimulatorChoice(
                    {
                        label: <>📎 {attachment.label}</>,
                        tone: SimulatorButtonTone.Link,
                        className: joinClasses(
                            SIM_BTN_PLAIN,
                            SIM_TEXT_SM,
                            'simulator-text--link-plain',
                        ),
                        onClick: () =>
                            onAction(SimulatorActions.clickLink({ href: attachment.url })),
                        'aria-label': locale.t('screen.smsSimulatorView.open.attachment', {
                            label: attachment.label,
                        }),
                    },
                    renderChoice,
                )
            )}
        </div>
    );
}
