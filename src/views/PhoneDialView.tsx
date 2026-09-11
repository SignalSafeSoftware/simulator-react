/**
 * Phone Dial tab: number display, 3×4 keypad (digit + letters per key), CALL button.
 * Wireframe: Dial screen with number readout, keypad, green CALL.
 */
import { useState } from 'react';
import PhoneKeypad from './PhoneKeypad.js';

import { simBorder, simLayout, simSpacing } from '../simulatorStyles.js';
import { SimulatorButton } from '../ui/primitives.js';
import {
    joinClasses,
    SIM_FLEX_GROW_1,
    SIM_MIN_H_0,
    SIM_MUTED,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_LIGHT,
    SIM_TEXT_BODY,
    SIM_TEXT_SEMIBOLD,
    SIM_W_FULL,
    simBtnToneClass,
} from '../ui/simulatorClasses.js';
import { SIM_PHONE_DIALER, SIM_PHONE_DIALER_CALL_BUTTON, SIM_PHONE_DIALER_NUMBER, SIM_PHONE_DIALER_BACKSPACE } from '../ui/semanticSimulatorClasses.js';

export interface PhoneDialViewProps {
    onDial: (number: string) => void;
}

export default function PhoneDialView({ onDial }: Readonly<PhoneDialViewProps>) {
    const [value, setValue] = useState('');

    const append = (d: string) => setValue((v) => v + d);
    const backspace = () => setValue((v) => v.slice(0, -1));

    const handleDial = () => {
        const n = Array.from(value.trim())
            .filter((char) => !/\s/.test(char))
            .join('');
        if (n) {
            onDial(n);
            setValue('');
        }
    };

    return (
        <div className={joinClasses(simLayout.stack, SIM_MIN_H_0, SIM_PHONE_DIALER)}>
            <div className={joinClasses(simLayout.row, simSpacing.gap2, simSpacing.mb3, simBorder.tile, SIM_ROUNDED_NONE, SIM_SURFACE_LIGHT)}>
                <span
                    className={joinClasses(
                        SIM_PHONE_DIALER_NUMBER,
                        SIM_FLEX_GROW_1,
                        'simulator-text--end',
                        simSpacing.py2,
                        simSpacing.px2,
                        'simulator-text--lg',
                        SIM_TEXT_BODY,
                        'simulator-text--break',
                    )}
                    style={{ minHeight: 48 }}
                    aria-label="Phone number"
                >
                    {value || <span className={SIM_MUTED}>Enter number</span>}
                </span>
                <button
                    type="button"
                    className={joinClasses(
                        SIM_PHONE_DIALER_BACKSPACE,
                        simBtnToneClass('link'),
                        'simulator-btn--plain',
                        simSpacing.p2,
                        SIM_TEXT_BODY,
                    )}
                    onClick={backspace}
                    aria-label="Backspace"
                >
                    ⌫
                </button>
            </div>
            <PhoneKeypad onDigit={append} />
            <SimulatorButton
                tone="success"
                className={joinClasses(
                    SIM_ROUNDED_NONE,
                    SIM_W_FULL,
                    simSpacing.py3,
                    SIM_TEXT_SEMIBOLD,
                    SIM_PHONE_DIALER_CALL_BUTTON,
                )}
                onClick={handleDial}
                disabled={!value.trim()}
                aria-label="Call"
            >
                CALL
            </SimulatorButton>
        </div>
    );
}
