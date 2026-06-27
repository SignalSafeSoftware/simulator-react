/**
 * Messages app: New Thread page. Wireframe (Messages.png): header "New Thread",
 * Phone Number field, Message body textarea, Send (blue) and Cancel (grey) buttons.
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
import {
    joinClasses,
    SIM_FLEX_GROW_1,
    SIM_FLEX_SHRINK_0,
    SIM_MIN_H_0,
    SIM_ROUNDED_NONE,
    SIM_TEXT_SEMIBOLD,
} from '../ui/simulatorClasses';

export interface MessagesNewThreadViewProps {
    onBack: () => void;
}

const footerBtnClass = joinClasses(
    SIM_ROUNDED_NONE,
    'simulator-btn--block',
    simSpacing.py2,
    SIM_TEXT_SEMIBOLD,
    SIM_FLEX_GROW_1,
);

export default function MessagesNewThreadView({ onBack }: Readonly<MessagesNewThreadViewProps>) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [messageBody, setMessageBody] = useState('');

    const handleSend = () => {
        onBack();
    };

    return (
        <div className={simLayout.screenColumn}>
            <div className={joinClasses(simScreen.header, simSpacing.mb3, SIM_FLEX_SHRINK_0)}>New Thread</div>
            <div className={joinClasses(simSpacing.px3, simSpacing.pt3, SIM_FLEX_SHRINK_0)}>
                <SimulatorField>
                    <SimulatorLabel className={simLayout.fieldLabel}>Phone Number</SimulatorLabel>
                    <SimulatorInput
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder=""
                        className={SIM_ROUNDED_NONE}
                        aria-label="Phone number"
                    />
                </SimulatorField>
            </div>
            <div className={joinClasses(SIM_FLEX_GROW_1, SIM_MIN_H_0)} aria-hidden />
            <div className={simLayout.footerActions}>
                <SimulatorField className={simSpacing.mb0}>
                    <SimulatorLabel className={simLayout.fieldLabel}>Message</SimulatorLabel>
                    <SimulatorTextarea
                        rows={3}
                        value={messageBody}
                        onChange={(e) => setMessageBody(e.target.value)}
                        placeholder="I will send you a message"
                        className={SIM_ROUNDED_NONE}
                        aria-label="Message body"
                    />
                </SimulatorField>
                <div className={simLayout.actionsRow}>
                    <SimulatorButton tone="primary" className={footerBtnClass} onClick={handleSend} aria-label="Send">
                        Send
                    </SimulatorButton>
                    <SimulatorButton tone="secondary" className={footerBtnClass} onClick={onBack} aria-label="Cancel">
                        Cancel
                    </SimulatorButton>
                </div>
            </div>
        </div>
    );
}
