/**
 * Messages app: New Thread page. Wireframe (Messages.png): header "New Thread",
 * Phone Number field, Message body textarea, Send (blue) and Cancel (grey) buttons.
 */
import { useState } from 'react';
import { Form } from 'react-bootstrap';

export interface MessagesNewThreadViewProps {
    onBack: () => void;
}

export default function MessagesNewThreadView({ onBack }: Readonly<MessagesNewThreadViewProps>) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [messageBody, setMessageBody] = useState('');

    const handleSend = () => {
        // Simulator: no backend; clear or leave as placeholder for event emission
        onBack();
    };

    return (
        <div className="d-flex flex-column flex-grow-1 min-h-0">
            <div className="text-center border-bottom border-secondary py-2 mb-3 small fw-semibold text-body flex-shrink-0">
                New Thread
            </div>
            <div className="px-3 pt-3 flex-shrink-0">
                <Form.Group>
                    <Form.Label className="small fw-medium text-body">Phone Number</Form.Label>
                    <Form.Control
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder=""
                        className="rounded-0"
                        aria-label="Phone number"
                    />
                </Form.Group>
            </div>
            <div className="flex-grow-1 min-h-0" aria-hidden />
            <div className="p-2 flex-shrink-0 mt-auto d-flex flex-column gap-2">
                <Form.Group className="mb-0">
                    <Form.Label className="small fw-medium text-body">Message</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={messageBody}
                        onChange={(e) => setMessageBody(e.target.value)}
                        placeholder="I will send you a message"
                        className="rounded-0"
                        aria-label="Message body"
                    />
                </Form.Group>
                <div className="d-flex gap-2">
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
                        onClick={onBack}
                        aria-label="Cancel"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
