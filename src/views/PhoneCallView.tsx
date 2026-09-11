import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import PhoneKeypad from './PhoneKeypad.js';
import type { PhoneKeypadDigit } from './PhoneKeypad.js';

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
}
/** Optional controlled call view. Does not drive or replace the scenario engine. */
export default function PhoneCallView(props: Readonly<PhoneCallViewProps>) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const ringing = props.incoming && props.phase === 'ringing';
  return (
    <section className="simulator-call-view" aria-label="Current call">
      {props.label && <p className="simulator-call-label">{props.label}</p>}
      <div
        className={`simulator-caller-avatar ${props.phase === 'ringing' ? 'ringing' : ''}`}
      >
        {props.avatar ?? '☎'}
      </div>
      <h2 className="simulator-screen__header">{props.callerName}</h2>
      {props.number && <p className="simulator-call-number">{props.number}</p>}
      <output className="simulator-call-status">
        {ringing
          ? 'Incoming call'
          : props.phase === 'connected' && props.connectedAt !== null
            ? formatPhoneCallDuration((now - props.connectedAt) / 1000)
            : `${props.phase.charAt(0).toUpperCase()}${props.phase.slice(1)}…`}
      </output>
      {props.connectedAt !== null && (
        <>
          <div className="simulator-sent-digits" aria-live="polite">
            {props.digits || 'Keypad'}
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
            aria-label={props.muted ? 'Unmute microphone' : 'Mute microphone'}
            aria-pressed={props.muted}
          >
            {props.muteIcon ?? (props.muted ? 'Unmute' : 'Mute')}
          </button>
        )}
        <button
          type="button"
          className="simulator-call-round danger"
          onClick={props.onHangup}
          aria-label={ringing ? 'Decline call' : 'End call'}
        >
          {props.hangupIcon ?? 'End'}
        </button>
        {ringing && (
          <button
            type="button"
            className="simulator-call-round success"
            onClick={props.onAnswer}
            aria-label="Answer call"
          >
            {props.answerIcon ?? 'Answer'}
          </button>
        )}
      </div>
    </section>
  );
}
