/**
 * Compose email screen: Recipient, Subject, Body; Send (blue), Cancel.
 * Wireframe: labeled fields, rectangular buttons. Cancel returns to list.
 */
import { useState } from 'react';

import {
    SimulatorButton,
    SimulatorField,
    SimulatorInput,
    SimulatorLabel,
    SimulatorTextarea,
} from '../ui/primitives';
import { joinClasses } from '../ui/simulatorClasses';

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
            <div className="d-flex flex-column gap-3">
                <SimulatorField>
                    <SimulatorLabel className="small fw-medium text-body">Recipient</SimulatorLabel>
                    <SimulatorInput
                        type="text"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        placeholder=""
                        className="rounded-0"
                        aria-label="Recipient"
                    />
                </SimulatorField>
                <SimulatorField>
                    <SimulatorLabel className="small fw-medium text-body">Subject</SimulatorLabel>
                    <SimulatorInput
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder=""
                        className="rounded-0"
                        aria-label="Subject"
                    />
                </SimulatorField>
                <SimulatorField className="flex-grow-1">
                    <SimulatorLabel className="small fw-medium text-body">Body</SimulatorLabel>
                    <SimulatorTextarea
                        rows={6}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder=""
                        className="rounded-0"
                        aria-label="Body"
                    />
                </SimulatorField>
            </div>
            <div className="d-flex gap-2 mt-3">
                <SimulatorButton
                    tone="primary"
                    className={joinClasses('rounded-0', 'simulator-btn--block', 'py-2', 'fw-semibold', 'flex-grow-1')}
                    onClick={handleSend}
                    aria-label="Send"
                >
                    Send
                </SimulatorButton>
                <SimulatorButton
                    tone="secondary"
                    className={joinClasses('rounded-0', 'simulator-btn--block', 'py-2', 'fw-semibold', 'flex-grow-1')}
                    onClick={onCancel}
                    aria-label="Cancel"
                >
                    Cancel
                </SimulatorButton>
            </div>
        </div>
    );
}
