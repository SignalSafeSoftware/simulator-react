import { SIM_SCREEN_HEADER } from '../../ui/styles/semanticSimulatorClasses.js';
import { SimulatorButtonTone } from '../../ui/styles/simulatorClasses.js';
import { Mic, MicOff, Phone, PhoneOff, UserRound } from 'lucide-react';
import type { SimulatorChoiceRenderProps } from '../../ui/renderSlots.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { usePhoneNumberFormatter } from '../../contract/phonePresentation.js';
import { useEffect, useState, type ReactNode } from 'react';
import PhoneKeypad, { type PhoneKeypadDigit } from './PhoneKeypad.js';

export function formatPhoneCallDuration(seconds: number): string {
    const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    return `${Math.floor(safe / 60)
        .toString()
        .padStart(2, '0')}:${(safe % 60).toString().padStart(2, '0')}`;
}
export interface PhoneCallViewProps {
    callerName: string;
    number?: string;
    label?: string;
    phase: 'dialing' | 'ringing' | 'connected' | 'reconnecting';
    incoming: boolean;
    connectedAt: number | null;
    muted: boolean;
    digits: string;
    onAnswer: () => void;
    onHangup: () => void;
    onMute: () => void;
    onDigit: (digit: PhoneKeypadDigit) => void;
    avatar?: ReactNode;
    answerIcon?: ReactNode;
    hangupIcon?: ReactNode;
    muteIcon?: ReactNode;
    renderChoice?: (choice: SimulatorChoiceRenderProps) => ReactNode;
}
/** Optional controlled call view. Does not drive or replace the scenario engine. */
export default function PhoneCallView(props: Readonly<PhoneCallViewProps>) {
    const screenLocale = useSimulatorLocale();

    const formatNumber = usePhoneNumberFormatter();
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);
    const ringing = props.incoming && props.phase === 'ringing';
    let statusLabel = screenLocale.t('screen.phoneCallView.value1.value2', {
        value1: String(props.phase.charAt(0).toUpperCase()),
        value2: String(props.phase.slice(1)),
    });
    if (ringing) {
        statusLabel = screenLocale.t('screen.phoneCallView.incoming.call');
    } else if (props.phase === 'connected' && props.connectedAt !== null) {
        statusLabel = formatPhoneCallDuration((now - props.connectedAt) / 1000);
    }
    return (
        <section
            className="simulator-call-view"
            aria-label={screenLocale.t('screen.phoneCallView.current.call')}
        >
            <h2 className={SIM_SCREEN_HEADER}>{props.callerName}</h2>
            <div className="simulator-call-view__body">
                {props.label && <p className="simulator-call-label">{props.label}</p>}
                <div
                    className={`simulator-caller-avatar ${props.phase === 'ringing' ? 'ringing' : ''}`}
                >
                    {props.avatar ?? <UserRound size={38} strokeWidth={1.5} aria-hidden="true" />}
                </div>
                {props.number && (
                    <p className="simulator-call-number">{formatNumber(props.number)}</p>
                )}
                <output className="simulator-call-status">{statusLabel}</output>
                {props.connectedAt !== null && (
                    <>
                        <div className="simulator-sent-digits" aria-live="polite">
                            {props.digits || screenLocale.t('screen.phoneCallView.keypad')}
                        </div>
                        <PhoneKeypad
                            appearance="call"
                            onDigit={props.onDigit}
                            digitLabel={(digit) => `Dial ${digit}`}
                        />
                    </>
                )}
                <div className="simulator-call-actions">
                    {props.connectedAt !== null && (
                        <button
                            type="button"
                            className={`simulator-call-round ${props.muted ? 'selected' : ''}`}
                            onClick={props.onMute}
                            aria-label={
                                props.muted
                                    ? screenLocale.t('screen.phoneCallView.unmute.microphone')
                                    : screenLocale.t('screen.phoneCallView.mute.microphone')
                            }
                            aria-pressed={props.muted}
                        >
                            {props.muteIcon ??
                                (props.muted ? (
                                    <MicOff aria-hidden="true" />
                                ) : (
                                    <Mic aria-hidden="true" />
                                ))}
                        </button>
                    )}
                    {renderCallAction(
                        {
                            label: screenLocale.t(
                                ringing
                                    ? 'screen.phoneCallView.decline.call'
                                    : 'screen.phoneCallView.end.call',
                            ),
                            'aria-label': screenLocale.t(
                                ringing
                                    ? 'screen.phoneCallView.decline.call'
                                    : 'screen.phoneCallView.end.call',
                            ),
                            className: 'simulator-call-round danger',
                            tone: SimulatorButtonTone.Danger,
                            onClick: props.onHangup,
                        },
                        props.hangupIcon ?? <PhoneOff aria-hidden="true" />,
                        props.renderChoice,
                    )}
                    {ringing &&
                        renderCallAction(
                            {
                                label: screenLocale.t('screen.phoneCallView.answer.call'),
                                'aria-label': screenLocale.t('screen.phoneCallView.answer.call'),
                                className: 'simulator-call-round success',
                                tone: SimulatorButtonTone.Success,
                                onClick: props.onAnswer,
                            },
                            props.answerIcon ?? <Phone aria-hidden="true" />,
                            props.renderChoice,
                        )}
                </div>
            </div>
        </section>
    );
}

function renderCallAction(
    props: SimulatorChoiceRenderProps,
    icon: ReactNode,
    renderChoice?: PhoneCallViewProps['renderChoice'],
) {
    return renderChoice ? (
        renderChoice(props)
    ) : (
        <button
            type="button"
            className={props.className}
            onClick={props.onClick}
            aria-label={props['aria-label']}
        >
            {icon}
        </button>
    );
}
