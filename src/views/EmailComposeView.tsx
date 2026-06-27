/**
 * Compose email screen: Recipient, Subject, Body; Send (blue), Cancel.
 * Wireframe: labeled fields, rectangular buttons. Cancel returns to list.
 */
import { useState } from 'react';

import { simLayout, simScreen, simSpacing } from '../simulatorStyles';
import {
    SimulatorButton,
    SimulatorField,
    SimulatorInput,
    SimulatorLabel,
    SimulatorTextarea,
} from '../ui/primitives';
import { joinClasses, SIM_FLEX_GROW_1, SIM_ROUNDED_NONE, SIM_TEXT_SEMIBOLD } from '../ui/simulatorClasses';

export interface EmailComposeViewProps {
    onSend?: (opts: { to: string; subject: string; body: string }) => void;
    onCancel: () => void;
}

const footerBtnClass = joinClasses(SIM_ROUNDED_NONE, 'simulator-btn--block', simSpacing.py2, SIM_TEXT_SEMIBOLD, SIM_FLEX_GROW_1);

export default function EmailComposeView({ onSend, onCancel }: Readonly<EmailComposeViewProps>) {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    const handleSend = () => {
        onSend?.({ to: to.trim(), subject: subject.trim(), body: body.trim() });
        onCancel();
    };

    return (
        <div className={simLayout.stack}>
            <div className={joinClasses(simScreen.header, simSpacing.mb3)}>Compose Email</div>
            <div className={joinClasses(simLayout.stack, 'simulator-spacing--gap-3')}>
                <SimulatorField>
                    <SimulatorLabel className={simLayout.fieldLabel}>Recipient</SimulatorLabel>
                    <SimulatorInput
                        type="text"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        placeholder=""
                        className={SIM_ROUNDED_NONE}
                        aria-label="Recipient"
                    />
                </SimulatorField>
                <SimulatorField>
                    <SimulatorLabel className={simLayout.fieldLabel}>Subject</SimulatorLabel>
                    <SimulatorInput
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder=""
                        className={SIM_ROUNDED_NONE}
                        aria-label="Subject"
                    />
                </SimulatorField>
                <SimulatorField className={SIM_FLEX_GROW_1}>
                    <SimulatorLabel className={simLayout.fieldLabel}>Body</SimulatorLabel>
                    <SimulatorTextarea
                        rows={6}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder=""
                        className={SIM_ROUNDED_NONE}
                        aria-label="Body"
                    />
                </SimulatorField>
            </div>
            <div className={joinClasses(simLayout.actionsRow, simSpacing.mt3)}>
                <SimulatorButton tone="primary" className={footerBtnClass} onClick={handleSend} aria-label="Send">
                    Send
                </SimulatorButton>
                <SimulatorButton tone="secondary" className={footerBtnClass} onClick={onCancel} aria-label="Cancel">
                    Cancel
                </SimulatorButton>
            </div>
        </div>
    );
}
