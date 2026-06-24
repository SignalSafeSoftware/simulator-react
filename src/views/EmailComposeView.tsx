/**
 * Compose email screen: Recipient, Subject, Body; Send (blue), Cancel.
 * Wireframe: labeled fields, rectangular buttons. Cancel returns to list.
 */
import { useState } from 'react';
import { Form } from 'react-bootstrap';

export interface EmailComposeViewProps {
    onSend?: (opts: { to: string; subject: string; body: string }) => void;
    onCancel: () => void;
}

export default function EmailComposeView({ onSend, onCancel }: Readonly<EmailComposeViewProps>) {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    const handleSend = () => {
        onSend?.({ to: to.trim(), subject: subject.trim(), body: body.trim() });
        onCancel();
    };

    return (
        <div className="d-flex flex-column">
            <div className="text-center border-bottom border-secondary py-2 mb-3 small fw-semibold text-body">
                Compose Email
            </div>
            <Form className="d-flex flex-column gap-3">
                <Form.Group>
                    <Form.Label className="small fw-medium text-body">Recipient</Form.Label>
                    <Form.Control
                        type="text"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        placeholder=""
                        className="rounded-0"
                        aria-label="Recipient"
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label className="small fw-medium text-body">Subject</Form.Label>
                    <Form.Control
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder=""
                        className="rounded-0"
                        aria-label="Subject"
                    />
                </Form.Group>
                <Form.Group className="flex-grow-1">
                    <Form.Label className="small fw-medium text-body">Body</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={6}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder=""
                        className="rounded-0"
                        aria-label="Body"
                    />
                </Form.Group>
            </Form>
            <div className="d-flex gap-2 mt-3">
                <button
                    type="button"
                    className="btn btn-primary rounded-0 flex-grow-1 py-2 fw-semibold"
                    onClick={handleSend}
                    aria-label="Send"
                >
                    Send
                </button>
                <button
                    type="button"
                    className="btn btn-secondary rounded-0 flex-grow-1 py-2 fw-semibold"
                    onClick={onCancel}
                    aria-label="Cancel"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
