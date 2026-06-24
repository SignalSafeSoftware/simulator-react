/**
 * Phone Dial tab: number display, 3×4 keypad (digit + letters per key), CALL button.
 * Wireframe: Dial screen with number readout, keypad, green CALL.
 */
import { useState } from 'react';

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
        <div className="d-flex flex-column min-h-0">
            {/* Number readout — wireframe: visible display at top */}
            <div className="d-flex align-items-center gap-2 mb-3 border border-secondary rounded-0 bg-light">
                <span
                    className="flex-grow-1 text-end py-2 px-2 fs-5 text-body text-break"
                    style={{ minHeight: 48 }}
                    aria-label="Phone number"
                >
                    {value || <span className="text-muted">Enter number</span>}
                </span>
                <button
                    type="button"
                    className="btn btn-link btn-sm p-2 text-body"
                    onClick={backspace}
                    aria-label="Backspace"
                >
                    ⌫
                </button>
            </div>
            {/* 3×4 keypad — wireframe: digit + letters per key */}
            <div className="d-flex flex-column gap-2 mb-3">
                {[0, 1, 2].map((row) => (
                    <div key={row} className="d-flex justify-content-center gap-2">
                        {KEYPAD.slice(row * 3, row * 3 + 3).map(({ digit, letters }) => (
                            <button
                                key={digit}
                                type="button"
                                className="btn btn-outline-dark rounded-1 d-flex flex-column align-items-center justify-content-center"
                                style={{ width: 72, height: 52 }}
                                onClick={() => append(digit)}
                                aria-label={letters ? `Digit ${digit} ${letters}` : `Digit ${digit}`}
                            >
                                <span className="fw-semibold" style={{ fontSize: '1.1rem' }}>{digit}</span>
                                {letters && <span className="small text-muted" style={{ lineHeight: 1, fontSize: '0.65rem' }}>{letters}</span>}
                            </button>
                        ))}
                    </div>
                ))}
                <div className="d-flex justify-content-center gap-2">
                    {KEYPAD.slice(9, 12).map(({ digit, letters }) => (
                        <button
                            key={digit}
                            type="button"
                            className="btn btn-outline-dark rounded-1 d-flex flex-column align-items-center justify-content-center"
                            style={{ width: 72, height: 52 }}
                            onClick={() => append(digit)}
                            aria-label={letters ? `Digit ${digit} ${letters}` : `Digit ${digit}`}
                        >
                            <span className="fw-semibold" style={{ fontSize: '1.1rem' }}>{digit}</span>
                            {letters && <span className="small text-muted" style={{ lineHeight: 1, fontSize: '0.65rem' }}>{letters}</span>}
                        </button>
                    ))}
                </div>
            </div>
            <button
                type="button"
                className="btn btn-success rounded-0 w-100 py-3 fw-semibold"
                onClick={handleDial}
                disabled={!value.trim()}
                aria-label="Call"
            >
                CALL
            </button>
        </div>
    );
}
