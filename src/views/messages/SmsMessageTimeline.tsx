import {
    MessageSender,
    type SimulatorAction,
    type SimulatorSmsPayload,
} from '../../types/session.js';
import {
    SIM_BORDER,
    SIM_FLEX_COL,
    SIM_LIST_PLAIN,
    SIM_ROUNDED_NONE,
    SIM_TEXT_DARK,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';
import type { ReactNode, Ref } from 'react';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { simSpacing } from '../../simulatorStyles.js';
import { useTimestampFormatter } from '../../contract/regionalPresentation.js';
import { SmsAttachment } from './SmsAttachment.js';
import {
    SIM_MESSAGES_BUBBLE,
    SIM_MESSAGES_BUBBLE_ME,
    SIM_MESSAGES_BUBBLE_THEM,
    SIM_MESSAGES_MESSAGE_TIMELINE,
} from '../../ui/styles/semanticSimulatorClasses.js';
import type { SimulatorChoiceRenderProps } from '../../ui/renderSlots.js';

type ThreadMessage = NonNullable<SimulatorSmsPayload['thread']>['messages'][number];

const bubbleThem = joinClasses(
    simSpacing.px3,
    simSpacing.py2,
    SIM_ROUNDED_NONE,
    'simulator-surface--secondary',
    'simulator-text--on-secondary',
);
const bubbleMe = joinClasses(
    simSpacing.px3,
    simSpacing.py2,
    SIM_ROUNDED_NONE,
    'simulator-surface--success-light',
    SIM_TEXT_DARK,
    SIM_BORDER,
    'simulator-border--success',
);

/** Timeline of message bubbles with per-message attachments. */
export function SmsMessageTimeline({
    visible,
    contentRef,
    onAction,
    renderChoice,
}: Readonly<{
    visible: readonly ThreadMessage[];
    contentRef?: Ref<HTMLUListElement>;
    onAction: (action: SimulatorAction) => void;
    renderChoice?: (choice: SimulatorChoiceRenderProps) => ReactNode;
}>) {
    const screenLocale = useSimulatorLocale();
    const formatTimestamp = useTimestampFormatter();
    return (
        <ul
            ref={contentRef}
            className={joinClasses(
                SIM_MESSAGES_MESSAGE_TIMELINE,
                SIM_FLEX_COL,
                simSpacing.gap2,
                SIM_LIST_PLAIN,
                simSpacing.mb0,
                'simulator-spacing--p-0',
            )}
            aria-label={screenLocale.t('screen.smsSimulatorView.message.timeline')}
        >
            {visible.map((msg, idx) => (
                <li
                    data-message-direction={msg.from}
                    title={msg.timestamp == null ? undefined : formatTimestamp(msg.timestamp)}
                    key={msg.id ?? `msg-${idx}-${msg.from}-${(msg.text ?? '').slice(0, 30)}`}
                    className={joinClasses(
                        SIM_FLEX_COL,
                        'simulator-flex--align-stretch',
                        simSpacing.gap2,
                    )}
                    style={{
                        maxWidth: '88%',
                        alignSelf: msg.from === MessageSender.Them ? 'flex-start' : 'flex-end',
                    }}
                >
                    <div
                        className={joinClasses(
                            SIM_MESSAGES_BUBBLE,
                            msg.from === MessageSender.Them
                                ? SIM_MESSAGES_BUBBLE_THEM
                                : SIM_MESSAGES_BUBBLE_ME,
                            msg.from === MessageSender.Them ? bubbleThem : bubbleMe,
                        )}
                        style={{
                            lineHeight: 1.45,
                            borderTopLeftRadius: msg.from === MessageSender.Them ? 0 : 8,
                            borderTopRightRadius: msg.from === MessageSender.Them ? 8 : 0,
                        }}
                    >
                        <span>
                            {msg.text?.replace(/[\u200B-\u200D\uFEFF\uFFFC]/g, '').trim()
                                ? msg.text
                                : screenLocale.t('screen.smsSimulatorView.no.text.content')}
                        </span>
                    </div>
                    {msg.attachment != null && (
                        <SmsAttachment
                            attachment={msg.attachment}
                            sender={msg.from}
                            onAction={onAction}
                            renderChoice={renderChoice}
                        />
                    )}
                </li>
            ))}
        </ul>
    );
}
