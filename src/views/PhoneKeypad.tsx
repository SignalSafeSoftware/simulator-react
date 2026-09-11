import {
  joinClasses,
  SIM_FLEX_COL,
  SIM_MUTED,
  SIM_TEXT_SEMIBOLD,
  SIM_TEXT_SM,
  simBtnToneClass,
} from '../ui/simulatorClasses.js';
import { simLayout, simSpacing } from '../simulatorStyles.js';

const KEYS = [
  ['1', ''],
  ['2', 'ABC'],
  ['3', 'DEF'],
  ['4', 'GHI'],
  ['5', 'JKL'],
  ['6', 'MNO'],
  ['7', 'PQRS'],
  ['8', 'TUV'],
  ['9', 'WXYZ'],
  ['*', ''],
  ['0', '+'],
  ['#', ''],
] as const;
export type PhoneKeypadDigit = (typeof KEYS)[number][0];
export interface PhoneKeypadProps {
  onDigit: (digit: PhoneKeypadDigit) => void;
  disabled?: boolean;
  appearance?: 'dialer' | 'call';
  digitLabel?: (digit: PhoneKeypadDigit, letters: string) => string;
}
/** One keyboard-accessible keypad for scenario dialing and host-controlled calls. */
export default function PhoneKeypad({
  onDigit,
  disabled = false,
  appearance = 'dialer',
  digitLabel,
}: Readonly<PhoneKeypadProps>) {
  const call = appearance === 'call';
  const keyClass = joinClasses(
    simBtnToneClass('outline-dark'),
    'simulator-rounded--sm',
    SIM_FLEX_COL,
    'simulator-flex--center',
  );
  const keys = KEYS.map(([digit, letters]) => (
    <button
      key={digit}
      type="button"
      disabled={disabled}
      className={call ? 'simulator-call-key' : keyClass}
      style={call ? undefined : { width: 72, height: 52 }}
      onClick={() => onDigit(digit)}
      aria-label={
        digitLabel?.(digit, letters) ??
        (letters ? `Digit ${digit} ${letters}` : `Digit ${digit}`)
      }
    >
      <span
        className={call ? undefined : SIM_TEXT_SEMIBOLD}
        style={
          call
            ? undefined
            : {
                fontSize:
                  'var(--simulator-phone-dialer-digit-font-size, 1.1rem)',
              }
        }
      >
        {digit}
      </span>
      {call ? (
        <small>{letters || '\u00a0'}</small>
      ) : (
        letters && (
          <span
            className={joinClasses(SIM_TEXT_SM, SIM_MUTED)}
            style={{ lineHeight: 1, fontSize: '0.65rem' }}
          >
            {letters}
          </span>
        )
      )}
    </button>
  ));
  return call ? (
    <div className="simulator-call-keypad">{keys}</div>
  ) : (
    <div className={joinClasses(simLayout.stack, simSpacing.mb3)}>
      {[0, 1, 2, 3].map((row) => (
        <div
          key={row}
          className={joinClasses(
            simLayout.row,
            'simulator-flex--center',
            simSpacing.gap2,
          )}
        >
          {keys.slice(row * 3, row * 3 + 3)}
        </div>
      ))}
    </div>
  );
}
