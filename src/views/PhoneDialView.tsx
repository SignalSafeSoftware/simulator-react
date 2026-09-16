import { usePhoneDialDraft } from './phoneDialContract.js';
import { CapabilityButton, useSimulatorCapabilities } from '../contract/capabilities.js';
import { useLayoutEffect, useRef, useState } from 'react';
import PhoneKeypad from './PhoneKeypad.js';
import { editDialNumber } from './phoneDialEdit.js';
import { useSimulatorLocale } from '../i18n/SimulatorLocale.js';

export interface PhoneDialViewProps {
    onDial: (number: string) => void;
    value?: string;
    onValueChange?: (value: string) => void;
}

export default function PhoneDialView({
    onDial,
    value: controlled,
    onValueChange,
}: Readonly<PhoneDialViewProps>) {
    const draft = usePhoneDialDraft();
    const capability = useSimulatorCapabilities().call ?? { state: 'enabled' };
    const [local, setLocal] = useState('');
    const value = controlled ?? draft?.value ?? local;
    const input = useRef<HTMLInputElement>(null);
    const caret = useRef<number | null>(null);
    const { t } = useSimulatorLocale();
    const change = (next: string) => {
        setLocal(next);
        (onValueChange ?? draft?.onChange)?.(next);
    };
    useLayoutEffect(() => {
        if (caret.current !== null) {
            input.current?.focus();
            input.current?.setSelectionRange(caret.current, caret.current);
            caret.current = null;
        }
    }, [value]);
    const edit = (digit?: string) => {
        const next = editDialNumber(
            value,
            input.current?.selectionStart ?? value.length,
            input.current?.selectionEnd ?? value.length,
            digit,
        );
        caret.current = next.caret;
        change(next.value);
        input.current?.focus();
    };
    const dial = () => {
        const number = value.replace(/\s/g, '');
        if (number && capability.state === 'enabled') {
            onDial(number);
            change('');
        }
    };
    return (
        <form
            className="simulator-phone__dialer simulator-flex simulator-flex--column"
            autoComplete="off"
            data-lpignore="true"
            onSubmit={(event) => {
                event.preventDefault();
                dial();
            }}
        >
            <div className="simulator-phone__dialer-entry simulator-flex simulator-flex--row">
                <input
                    ref={input}
                    className="simulator-phone__dialer-number"
                    type="text"
                    inputMode="tel"
                    autoComplete="off"
                    data-lpignore="true"
                    aria-label={t('phone.number')}
                    placeholder={t('phone.enterNumber')}
                    value={value}
                    onChange={(event) => change(event.target.value)}
                />
                <button
                    className="simulator-phone__dialer-backspace"
                    type="button"
                    aria-label={t('phone.backspace')}
                    onClick={() => edit()}
                >
                    ⌫
                </button>
            </div>
            <PhoneKeypad onDigit={edit} />
            <CapabilityButton
                capability={
                    capability.state === 'enabled' && !value.trim()
                        ? { state: 'unavailable', reason: t('phone.enterNumberReason') }
                        : capability
                }
                className="simulator-btn simulator-phone__dialer-call-button"
                type="submit"
                aria-label={t('phone.call')}
            >
                {t('phone.call')}
            </CapabilityButton>
        </form>
    );
}
