/**
 * Phone Dial tab: number display, 3×4 keypad (digit + letters per key), CALL button.
 * Wireframe: Dial screen with number readout, keypad, green CALL.
 */
import { useState } from 'react';

import { simBorder, simLayout, simSpacing } from '../simulatorStyles.js';
import { SimulatorButton } from '../ui/primitives.js';
import {
    joinClasses,
    SIM_FLEX_COL,
    SIM_FLEX_GROW_1,
    SIM_MIN_H_0,
    SIM_MUTED,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_LIGHT,
    SIM_TEXT_BODY,
    SIM_TEXT_SEMIBOLD,
    SIM_TEXT_SM,
    SIM_W_FULL,
    simBtnToneClass,
} from '../ui/simulatorClasses.js';
import { SIM_PHONE_DIALER, SIM_PHONE_DIALER_CALL_BUTTON } from '../ui/semanticSimulatorClasses.js';

export interface PhoneDialViewProps {
    onDial: (number: string) => void;
}

const KEYPAD: { digit: string; letters?: string }[] = [
    { digit: '1' },
    { digit: '2', letters: 'ABC' },
    { digit: '3', letters: 'DEF' },
    { digit: '4', letters: 'GHI' },
    { digit: '5', letters: 'JKL' },
    { digit: '6', letters: 'MNO' },
    { digit: '7', letters: 'PQRS' },
    { digit: '8', letters: 'TUV' },
    { digit: '9', letters: 'WXYZ' },
    { digit: '*' },
    { digit: '0', letters: '+' },
    { digit: '#' },
];

const keypadKeyClass = joinClasses(
    simBtnToneClass('outline-dark'),
    'simulator-rounded--sm',
    SIM_FLEX_COL,
    'simulator-flex--center',
);

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
                    className={joinClasses(SIM_FLEX_GROW_1, 'simulator-text--end', simSpacing.py2, simSpacing.px2, 'simulator-text--lg', SIM_TEXT_BODY, 'simulator-text--break')}
                    style={{ minHeight: 48 }}
                    aria-label="Phone number"
                >
                    {value || <span className={SIM_MUTED}>Enter number</span>}
                </span>
                <button
                    type="button"
                    className={joinClasses(simBtnToneClass('link'), 'simulator-btn--plain', simSpacing.p2, SIM_TEXT_BODY)}
                    onClick={backspace}
                    aria-label="Backspace"
                >
                    ⌫
                </button>
            </div>
            <div className={joinClasses(simLayout.stack, simSpacing.mb3)}>
                {[0, 1, 2].map((row) => (
                    <div key={row} className={joinClasses(simLayout.row, 'simulator-flex--center', simSpacing.gap2)}>
                        {KEYPAD.slice(row * 3, row * 3 + 3).map(({ digit, letters }) => (
                            <button
                                key={digit}
                                type="button"
                                className={keypadKeyClass}
                                style={{ width: 72, height: 52 }}
                                onClick={() => append(digit)}
                                aria-label={letters ? `Digit ${digit} ${letters}` : `Digit ${digit}`}
                            >
                                <span className={SIM_TEXT_SEMIBOLD} style={{ fontSize: '1.1rem' }}>{digit}</span>
                                {letters && (
                                    <span className={joinClasses(SIM_TEXT_SM, SIM_MUTED)} style={{ lineHeight: 1, fontSize: '0.65rem' }}>
                                        {letters}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                ))}
                <div className={joinClasses(simLayout.row, 'simulator-flex--center', simSpacing.gap2)}>
                    {KEYPAD.slice(9, 12).map(({ digit, letters }) => (
                        <button
                            key={digit}
                            type="button"
                            className={keypadKeyClass}
                            style={{ width: 72, height: 52 }}
                            onClick={() => append(digit)}
                            aria-label={letters ? `Digit ${digit} ${letters}` : `Digit ${digit}`}
                        >
                            <span className={SIM_TEXT_SEMIBOLD} style={{ fontSize: '1.1rem' }}>{digit}</span>
                            {letters && (
                                <span className={joinClasses(SIM_TEXT_SM, SIM_MUTED)} style={{ lineHeight: 1, fontSize: '0.65rem' }}>
                                    {letters}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
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
