import type { ReactNode } from 'react';
import type { SimulatorChoiceRenderProps } from '../../ui/renderSlots.js';
import type { PhoneKeypadDigit } from './PhoneKeypad.js';

/** Call actions the view can raise. */
export interface PhoneCallActionProps {
    onAnswer: () => void;
    onHangup: () => void;
    /** Used only while connected. */
    onMute?: () => void;
    /** Used only while connected. */
    onDigit?: (digit: PhoneKeypadDigit) => void;
}

/** Host-supplied visuals for the call view. */
export interface PhoneCallSlotProps {
    avatar?: ReactNode;
    answerIcon?: ReactNode;
    hangupIcon?: ReactNode;
    muteIcon?: ReactNode;
    renderChoice?: (choice: SimulatorChoiceRenderProps) => ReactNode;
}
