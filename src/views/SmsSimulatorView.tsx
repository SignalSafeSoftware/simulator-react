/**
 * Messages app: thread detail. Wireframe: profile + name, message bubbles,
 * message box and Send/Cancel at bottom. Links and attachments preserved in bubbles.
 */
import { useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import type { SimulatorAction, SimulatorSmsPayload } from '../types/session';
import { SimulatorActions } from '../actions';
import { simBorder, simSpacing, simTypo } from '../simulatorStyles';

export interface SmsSimulatorViewProps {
    payload: SimulatorSmsPayload | null;
    visibleCount: number;
    onAction: (action: SimulatorAction) => void;
    onRevealNext: () => void;
    onBack?: () => void;
    showReplyBox?: boolean;
}

function ConversationProfileIcon({ className }: Readonly<{ className?: string }>) {
    return (
        <div
            className={`rounded bg-primary bg-opacity-25 d-flex align-items-center justify-content-center flex-shrink-0 mx-auto ${className ?? ''}`}
            style={{ width: 48, height: 48 }}
            aria-hidden
        >
            <span className="text-primary" style={{ fontSize: '1.5rem' }}>👤</span>
        </div>
    );
}

function renderAttachmentAction(
    attachment: NonNullable<NonNullable<SimulatorSmsPayload['thread']>['messages']>[number]['attachment'],
    onAction: (action: SimulatorAction) => void
): JSX.Element {
    if (attachment?.url == null) {
        return <span className="text-muted">📎 {attachment?.label}</span>;
    }
    return (
        <Button
            variant="link"
            size="sm"
            className="p-0 small text-decoration-none"
            onClick={() =>
                onAction(SimulatorActions.clickLink({ href: attachment.url }))
            }
            aria-label={`Open: ${attachment.label}`}
        >
            📎 {attachment.label}
        </Button>
    );
}

export default function SmsSimulatorView({
    payload,
    visibleCount,
    onAction,
    onRevealNext,
    onBack,
    showReplyBox = true,
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
        <div className="d-flex flex-column flex-grow-1 min-h-0">
            <div className="text-center border-bottom border-secondary py-2 mb-2 flex-shrink-0">
                <ConversationProfileIcon />
                <div className="small fw-semibold text-body mt-1">{contactLabel}</div>
            </div>

            <div className="flex-grow-1 min-h-0 overflow-auto">
                {visible.length === 0 && (
                    <p className={simTypo.secondaryTight}>No messages in this thread.</p>
                )}
                <ul className="d-flex flex-column gap-2 list-unstyled m-0 p-0" aria-label="Message timeline">
                    {visible.map((msg, idx) => (
                        <li
                            key={`msg-${idx}-${msg.from}-${(msg.text ?? '').slice(0, 30)}`}
                            className="d-flex flex-column align-items-stretch gap-1"
                            style={{ maxWidth: '88%', alignSelf: msg.from === 'them' ? 'flex-start' : 'flex-end' }}
                        >
                            <div
                                className={`px-3 py-2 rounded-0 ${
                                    msg.from === 'them'
                                        ? 'bg-secondary text-white'
                                        : 'bg-success bg-opacity-25 text-dark border border-success'
                                }`}
                                style={{
                                    lineHeight: 1.45,
                                    borderTopLeftRadius: msg.from === 'them' ? 0 : 8,
                                    borderTopRightRadius: msg.from === 'them' ? 8 : 0,
                                }}
                            >
                                <span>{msg.text}</span>
                            </div>
                            {(msg.timestamp != null || msg.attachment != null) && (
                                <div className="d-flex flex-wrap align-items-center gap-2 small">
                                    {msg.timestamp != null && (
                                        <span className="text-muted">{msg.timestamp}</span>
                                    )}
                                    {msg.attachment != null && (
                                        renderAttachmentAction(msg.attachment, onAction)
                                    )}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>

                {(content.links?.length ?? 0) > 0 && (
                    <div className={`mt-3 pt-3 border-top d-flex flex-wrap gap-2 align-items-center ${simSpacing.sectionGap}`}>
                        {content.links?.map((link, idx) =>
                            link.title != null && link.title !== '' ? (
                                <div key={`link-${idx}-${link.href ?? ''}-${link.title ?? ''}`} className={`${simBorder.block} ${simSpacing.blockPaddingCompact} small`} style={{ maxWidth: 280 }}>
                                    <span className="fw-medium d-block text-dark mb-1">{link.title}</span>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="p-0 small align-baseline"
                                        onClick={() =>
                                            onAction(SimulatorActions.clickLink({ linkIndex: idx, href: link.href }))
                                        }
                                        aria-label={`Link: ${link.text || link.href}`}
                                    >
                                        {link.text || link.href}
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    key={`link-btn-${idx}-${link.href ?? ''}`}
                                    variant="link"
                                    size="sm"
                                    className="p-0 align-baseline rounded-0"
                                    onClick={() =>
                                        onAction(SimulatorActions.clickLink({ linkIndex: idx, href: link.href }))
                                    }
                                    aria-label={`Link: ${link.text || link.href}`}
                                >
                                    {link.text || link.href}
                                </Button>
                            )
                        )}
                    </div>
                )}
            </div>

            {showReplyBox && (
                <div className="p-2 flex-shrink-0 mt-auto d-flex flex-column gap-2">
                    <Form.Control
                        type="text"
                        placeholder="I will send you a message"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                        aria-label="Reply to message"
                        className="rounded-0"
                    />
                    <div className="d-flex gap-2">
                        <button
                            type="button"
                            className="btn btn-primary rounded-0 flex-grow-1 py-2 fw-semibold"
                            onClick={handleSendReply}
                            aria-label="Send"
                        >
                            Send
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary rounded-0 flex-grow-1 py-2 fw-semibold"
                            onClick={onBack}
                            aria-label="Cancel"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
