/**
 * Messages app: thread detail. Wireframe: profile + name, message bubbles,
 * message box and Send/Cancel at bottom. Links and attachments preserved in bubbles.
 */
import { useEffect, useState, type ReactNode } from 'react';
import type { SimulatorAction, SimulatorSmsPayload } from '../types/session.js';
import { SimulatorActions } from '../actions/index.js';
import { simBorder, simLayout, simScreen, simSpacing, simTypo } from '../simulatorStyles.js';
import { SimulatorInput } from '../ui/primitives.js';
import {
    joinClasses,
    SIM_AVATAR,
    SIM_BORDER,
    SIM_BORDER_TOP,
    SIM_FLEX_COL,
    SIM_FLEX_SHRINK_0,
    SIM_MUTED,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_AVATAR,
    SIM_TEXT_DARK,
    SIM_TEXT_SEMIBOLD,
    SIM_TEXT_SM,
} from '../ui/simulatorClasses.js';
import {
    SIM_MESSAGES_BUBBLE,
    SIM_MESSAGES_BUBBLE_ME,
    SIM_MESSAGES_BUBBLE_THEM,
    SIM_MESSAGES_MESSAGE_TIMELINE,
    SIM_MESSAGES_THREAD_DETAIL,
} from '../ui/semanticSimulatorClasses.js';
import {
    renderSimulatorChoice,
    type SimulatorChoiceRenderProps,
} from '../ui/renderSlots.js';

export interface SmsSimulatorViewProps {
    payload: SimulatorSmsPayload | null;
    visibleCount: number;
    onAction: (action: SimulatorAction) => void;
    onRevealNext: () => void;
    onBack?: () => void;
    showReplyBox?: boolean;
    renderChoice?: (choice: SimulatorChoiceRenderProps) => ReactNode;
}

function ConversationProfileIcon({ className }: Readonly<{ className?: string }>) {
    return (
        <div
            className={joinClasses(
                SIM_AVATAR,
                SIM_SURFACE_AVATAR,
                'simulator-flex simulator-flex--center',
                SIM_FLEX_SHRINK_0,
                'simulator-flex--center',
                'simulator-spacing--mx-auto',
                className,
            )}
            style={{ width: 48, height: 48 }}
            aria-hidden
        >
            <span className="simulator-text--primary" style={{ fontSize: '1.5rem' }}>👤</span>
        </div>
    );
}

function renderAttachmentAction(
    attachment: NonNullable<NonNullable<SimulatorSmsPayload['thread']>['messages']>[number]['attachment'],
    onAction: (action: SimulatorAction) => void,
    renderChoice?: (choice: SimulatorChoiceRenderProps) => ReactNode,
): ReactNode {
    if (attachment?.url == null) {
        return <span className={SIM_MUTED}>📎 {attachment?.label}</span>;
    }
    return renderSimulatorChoice(
        {
            label: <>📎 {attachment.label}</>,
            tone: 'link',
            className: joinClasses('simulator-btn--plain', SIM_TEXT_SM, 'simulator-text--link-plain'),
            onClick: () => onAction(SimulatorActions.clickLink({ href: attachment.url })),
            'aria-label': `Open: ${attachment.label}`,
        },
        renderChoice,
    );
}

const bubbleThem = joinClasses(simSpacing.px3, simSpacing.py2, SIM_ROUNDED_NONE, 'simulator-surface--secondary', 'simulator-text--on-secondary');
const bubbleMe = joinClasses(
    simSpacing.px3,
    simSpacing.py2,
    SIM_ROUNDED_NONE,
    'simulator-surface--success-light',
    SIM_TEXT_DARK,
    SIM_BORDER,
    'simulator-border--success',
);

export default function SmsSimulatorView({
    payload,
    visibleCount,
    onAction,
    onRevealNext,
    onBack,
    showReplyBox = true,
    renderChoice,
}: Readonly<SmsSimulatorViewProps>) {
    const [replyText, setReplyText] = useState('');
    const messages = payload?.thread?.messages ?? [];

    useEffect(() => {
        if (messages.length === 0) return;
        const timeouts: ReturnType<typeof setTimeout>[] = [];
        let cumulativeMs = 0;
        for (const msg of messages) {
            if (msg == null) continue;
            const delayMs = (msg.delay_seconds ?? 0) * 1000;
            cumulativeMs += delayMs;
            timeouts.push(setTimeout(() => onRevealNext(), cumulativeMs));
        }
        return () => timeouts.forEach((t) => clearTimeout(t));
    }, [messages.length, onRevealNext]);

    if (payload == null) {
        return <p className={simTypo.emptyState}>No messages for this scenario.</p>;
    }

    const content = payload.thread;
    const visible = messages.slice(0, visibleCount);
    const senderName = content.sender_display_name;
    const senderNumber = content.sender_number;
    const contactLabel = senderName ?? senderNumber ?? 'Unknown';

    const handleSendReply = () => {
        const text = replyText.trim();
        if (text) {
            onAction(SimulatorActions.sendReply(text));
            setReplyText('');
        }
    };

    return (
        <div className={joinClasses(simLayout.screenColumn, SIM_MESSAGES_THREAD_DETAIL)}>
            <div className={joinClasses(simScreen.header, simSpacing.sectionGap, SIM_FLEX_SHRINK_0)}>
                <ConversationProfileIcon />
                <div className={joinClasses(SIM_TEXT_SM, SIM_TEXT_SEMIBOLD, 'simulator-text--body', simSpacing.mt1)}>
                    {contactLabel}
                </div>
            </div>

            <div className={simLayout.scrollBody}>
                {visible.length === 0 && (
                    <p className={simTypo.secondaryTight}>No messages in this thread.</p>
                )}
                <ul
                    className={joinClasses(
                        SIM_MESSAGES_MESSAGE_TIMELINE,
                        SIM_FLEX_COL,
                        simSpacing.gap2,
                        'simulator-list--plain',
                        simSpacing.mb0,
                        'simulator-spacing--p-0',
                    )}
                    aria-label="Message timeline"
                >
                    {visible.map((msg, idx) => (
                        <li
                            key={`msg-${idx}-${msg.from}-${(msg.text ?? '').slice(0, 30)}`}
                            className={joinClasses(SIM_FLEX_COL, 'simulator-flex--align-stretch', simSpacing.gap2)}
                            style={{ maxWidth: '88%', alignSelf: msg.from === 'them' ? 'flex-start' : 'flex-end' }}
                        >
                            <div
                                className={joinClasses(
                                    SIM_MESSAGES_BUBBLE,
                                    msg.from === 'them' ? SIM_MESSAGES_BUBBLE_THEM : SIM_MESSAGES_BUBBLE_ME,
                                    msg.from === 'them' ? bubbleThem : bubbleMe,
                                )}
                                style={{
                                    lineHeight: 1.45,
                                    borderTopLeftRadius: msg.from === 'them' ? 0 : 8,
                                    borderTopRightRadius: msg.from === 'them' ? 8 : 0,
                                }}
                            >
                                <span>{msg.text}</span>
                            </div>
                            {(msg.timestamp != null || msg.attachment != null) && (
                                <div className={joinClasses(simLayout.actionsRow, SIM_TEXT_SM)}>
                                    {msg.timestamp != null && (
                                        <span className={SIM_MUTED}>{msg.timestamp}</span>
                                    )}
                                    {msg.attachment != null && (
                                        renderAttachmentAction(msg.attachment, onAction, renderChoice)
                                    )}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>

                {(content.links?.length ?? 0) > 0 && (
                    <div
                        className={joinClasses(
                            simSpacing.mt3,
                            simSpacing.pt3,
                            SIM_BORDER_TOP,
                            simLayout.actionsRow,
                            simSpacing.sectionGap,
                        )}
                    >
                        {content.links?.map((link, idx) =>
                            link.title != null && link.title !== '' ? (
                                <div
                                    key={`link-${idx}-${link.href ?? ''}-${link.title ?? ''}`}
                                    className={joinClasses(simBorder.block, simSpacing.blockPaddingCompact, SIM_TEXT_SM)}
                                    style={{ maxWidth: 280 }}
                                >
                                    <span className={joinClasses('simulator-text--medium', 'simulator-text--block', SIM_TEXT_DARK, simSpacing.mb1)}>
                                        {link.title}
                                    </span>
                                    {renderSimulatorChoice(
                                        {
                                            label: link.text || link.href,
                                            tone: 'link',
                                            className: joinClasses('simulator-btn--plain', SIM_TEXT_SM, 'simulator-text--align-baseline'),
                                            onClick: () =>
                                                onAction(SimulatorActions.clickLink({ linkIndex: idx, href: link.href })),
                                            'aria-label': `Link: ${link.text || link.href}`,
                                        },
                                        renderChoice,
                                    )}
                                </div>
                            ) : (
                                <span key={`link-btn-${idx}-${link.href ?? ''}`}>
                                    {renderSimulatorChoice(
                                        {
                                            label: link.text || link.href,
                                            tone: 'link',
                                            className: joinClasses('simulator-btn--plain', 'simulator-text--align-baseline', SIM_ROUNDED_NONE),
                                            onClick: () =>
                                                onAction(SimulatorActions.clickLink({ linkIndex: idx, href: link.href })),
                                            'aria-label': `Link: ${link.text || link.href}`,
                                        },
                                        renderChoice,
                                    )}
                                </span>
                            )
                        )}
                    </div>
                )}
            </div>

            {showReplyBox && (
                <div className={simLayout.footerActions}>
                    <SimulatorInput
                        type="text"
                        placeholder="I will send you a message"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                        aria-label="Reply to message"
                        className={SIM_ROUNDED_NONE}
                    />
                    <div className={simLayout.actionsRow}>
                        {renderSimulatorChoice(
                            {
                                label: 'Send',
                                tone: 'primary',
                                className: joinClasses(simLayout.blockButton, SIM_TEXT_SEMIBOLD),
                                onClick: handleSendReply,
                                'aria-label': 'Send',
                            },
                            renderChoice,
                        )}
                        {renderSimulatorChoice(
                            {
                                label: 'Cancel',
                                tone: 'secondary',
                                className: joinClasses(simLayout.blockButton, SIM_TEXT_SEMIBOLD),
                                onClick: () => onBack?.(),
                                'aria-label': 'Cancel',
                            },
                            renderChoice,
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
