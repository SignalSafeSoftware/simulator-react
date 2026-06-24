/**
 * Email message read/detail: wireframe layout (From, To, Subject, Body), links, attachments,
 * and Reply/Forward/Dispose/Cancel buttons. No Report link. Bottom secondary menu hidden on this screen.
 */
import { Button, Form } from 'react-bootstrap';
import type { EmailScreenId, SimulatorAction } from '../types/session';
import { SimulatorActions } from '../actions';
import { SimulatorDetailBackBar } from '../components/SimulatorDetail';
import { simSpacing, simTypo, simActionsBar } from '../simulatorStyles';
import type { EmailTemplateContent, EmailTemplateLink } from '../types/portableSimulator';

export interface EmailMessageDetailProps {
    message: EmailTemplateContent;
    onAction: (action: SimulatorAction) => void;
    onBack?: () => void;
    /** When set, Cancel navigates to list. */
    onNavigate?: (screen: EmailScreenId) => void;
}

function withStableLinkKeys(
    links: EmailTemplateLink[]
): Array<{ key: string; link: EmailTemplateLink; index: number }> {
    const counts = new Map<string, number>();
    return links.map((link, index) => {
        const base = [link.href ?? '', link.text ?? '', link.title ?? ''].join('|');
        const nextCount = (counts.get(base) ?? 0) + 1;
        counts.set(base, nextCount);
        return { key: `${base}-${nextCount}`, link, index };
    });
}

export default function EmailMessageDetail({
    message,
    onAction,
    onBack,
}: Readonly<EmailMessageDetailProps>) {
    const hasAttachment =
        message.attachment_name != null && message.attachment_name !== '';
    const fromDisplay =
        message.from_display_name != null && message.from_display_name !== ''
            ? `${message.from_display_name} <${message.from}>`
            : message.from ?? '';
    const keyedLinks = withStableLinkKeys(message.links ?? []);

    return (
        <div className="d-flex flex-column flex-grow-1 min-h-0">
            {onBack && (
                <>
                    <SimulatorDetailBackBar onBack={onBack} title="Message" ariaLabel="Back to inbox" titleOnly />
                    <div className="border-bottom border-secondary" />
                </>
            )}
            <div className="d-flex flex-column flex-grow-1 min-h-0 overflow-auto p-3">
                <Form className="d-flex flex-column gap-3 flex-grow-1 min-h-0">
                    <Form.Group className="mb-0 flex-shrink-0">
                        <Form.Label className="small fw-medium text-body">From</Form.Label>
                        <Form.Control
                            type="text"
                            readOnly
                            value={fromDisplay}
                            className="rounded-0 bg-light"
                            aria-label="From"
                        />
                    </Form.Group>
                    <Form.Group className="mb-0 flex-shrink-0">
                        <Form.Label className="small fw-medium text-body">To</Form.Label>
                        <Form.Control
                            type="text"
                            readOnly
                            value={message.to ?? ''}
                            className="rounded-0 bg-light"
                            aria-label="To"
                        />
                    </Form.Group>
                    <Form.Group className="mb-0 flex-shrink-0">
                        <Form.Label className="small fw-medium text-body">Subject</Form.Label>
                        <Form.Control
                            type="text"
                            readOnly
                            value={message.subject ?? ''}
                            className="rounded-0 bg-light"
                            aria-label="Subject"
                        />
                    </Form.Group>
                    <Form.Group className="mb-0 flex-grow-1 min-h-0 d-flex flex-column flex-shrink-1">
                        <Form.Label className="small fw-medium text-body">Body</Form.Label>
                        <Form.Control
                            as="textarea"
                            readOnly
                            value={message.body ?? ''}
                            className="rounded-0 bg-light flex-grow-1 overflow-auto"
                            style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, minHeight: 0, resize: 'none' }}
                            aria-label="Body"
                        />
                    </Form.Group>
                </Form>
                {message.links != null && message.links.length > 0 && (
                    <div className={`${simSpacing.dividerTop} ${simActionsBar} mt-3 pt-3 flex-shrink-0`}>
                        <span className={`${simTypo.secondary} me-1`}>Links:</span>
                        {keyedLinks.map(({ key, link, index }) => (
                            <Button
                                key={key}
                                variant="outline-primary"
                                size="sm"
                                className="text-decoration-none rounded-0"
                                onClick={() =>
                                    onAction(SimulatorActions.clickLink({ linkIndex: index, href: link.href }))
                                }
                                aria-label={link.text || link.href}
                            >
                                {link.text || link.href}
                            </Button>
                        ))}
                    </div>
                )}
                {hasAttachment && (
                    <div className={`${simSpacing.dividerTop} small mt-3 pt-3 flex-shrink-0`}>
                        <span className={`${simTypo.secondary} me-2`}>
                            Attachment: {message.attachment_name}
                            {message.attachment_type != null && message.attachment_type !== '' && (
                                <span className="ms-1">({message.attachment_type})</span>
                            )}
                        </span>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            className="me-1 rounded-0"
                            onClick={() => onAction(SimulatorActions.openAttachment(0))}
                            aria-label="Open attachment"
                        >
                            Open
                        </Button>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            className="rounded-0"
                            onClick={() => onAction(SimulatorActions.downloadAttachment(0))}
                            aria-label="Download attachment"
                        >
                            Download
                        </Button>
                    </div>
                )}
            </div>
            <div className="d-flex gap-2 p-2 flex-shrink-0 mt-auto flex-wrap">
                <button
                    type="button"
                    className="btn btn-primary rounded-0 flex-grow-1 py-2"
                    onClick={() => onAction(SimulatorActions.sendReply())}
                    aria-label="Reply"
                >
                    Reply
                </button>
                <button
                    type="button"
                    className="btn btn-secondary rounded-0 flex-grow-1 py-2"
                    onClick={onBack}
                    aria-label="Forward"
                >
                    Forward
                </button>
                <button
                    type="button"
                    className="btn btn-secondary rounded-0 flex-grow-1 py-2"
                    onClick={onBack}
                    aria-label="Dispose"
                >
                    Dispose
                </button>
                <button
                    type="button"
                    className="btn btn-secondary rounded-0 flex-grow-1 py-2"
                    onClick={() => onBack?.()}
                    aria-label="Cancel"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
