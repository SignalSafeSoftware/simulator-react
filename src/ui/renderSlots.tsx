import type { ReactNode } from 'react';

import type { SimulatorDispatchAction } from '../state/simulatorSessionReducer.js';
import type {
    SimulatorCallHistoryEntry,
    SimulatorSessionContact,
    SimulatorSessionState,
} from '../types/session.js';
import type { PhoneSimulatorContent } from '../types/portableSimulator.js';
import { SimulatorAlert, SimulatorButton } from './primitives.js';
import { joinClasses } from './simulatorClasses.js';
import {
    SIM_PHONE_INCOMING_CALL_AFTER_ACTIONS,
    SIM_PHONE_INCOMING_CALL_EXTRA,
} from './semanticSimulatorClasses.js';

export interface SimulatorChoiceRenderProps {
    label: ReactNode;
    onClick: () => void;
    tone?: string;
    className?: string;
    disabled?: boolean;
    'aria-label'?: string;
}

export interface SimulatorFeedbackRenderProps {
    message: ReactNode;
    tone?: 'warning' | 'danger' | 'info';
    className?: string;
}

/** Context for host content below the incoming-call Answer/Ignore actions. */
export interface SimulatorPhoneIncomingCallExtraRenderProps {
    state: SimulatorSessionState;
    dispatch: (action: SimulatorDispatchAction) => void;
    content: PhoneSimulatorContent;
    callHistory: SimulatorCallHistoryEntry[];
    contacts: SimulatorSessionContact[] | null;
}

/** Context when the host owns the phone contact detail screen instead of the package view. */
export interface SimulatorPhoneContactOpenProps {
    state: SimulatorSessionState;
    dispatch: (action: SimulatorDispatchAction) => void;
    contactId: string;
    contact: SimulatorSessionContact;
}

export function renderSimulatorChoice(
    props: SimulatorChoiceRenderProps,
    renderChoice?: (choice: SimulatorChoiceRenderProps) => ReactNode,
): ReactNode {
    if (renderChoice) {
        return renderChoice(props);
    }
    return (
        <SimulatorButton
            tone={props.tone}
            className={props.className}
            onClick={props.onClick}
            disabled={props.disabled}
            aria-label={props['aria-label']}
        >
            {props.label}
        </SimulatorButton>
    );
}

export function renderSimulatorFeedback(
    props: SimulatorFeedbackRenderProps,
    renderFeedback?: (feedback: SimulatorFeedbackRenderProps) => ReactNode,
): ReactNode {
    if (renderFeedback) {
        return renderFeedback(props);
    }
    return (
        <SimulatorAlert tone={props.tone ?? 'warning'} className={joinClasses('simulator-text--sm', props.className)}>
            {props.message}
        </SimulatorAlert>
    );
}

/** Host slot below incoming-call actions; omits wrappers when slot is absent or returns null. */
export function renderPhoneIncomingCallExtra(
    props: SimulatorPhoneIncomingCallExtraRenderProps,
    renderIncomingCallExtra?: (slotProps: SimulatorPhoneIncomingCallExtraRenderProps) => ReactNode,
): ReactNode {
    if (renderIncomingCallExtra == null) {
        return null;
    }
    const content = renderIncomingCallExtra(props);
    if (content == null) {
        return null;
    }
    return (
        <div className={SIM_PHONE_INCOMING_CALL_EXTRA} data-testid="phone-incoming-call-extra">
            <div className={SIM_PHONE_INCOMING_CALL_AFTER_ACTIONS} data-testid="phone-incoming-call-after-actions">
                {content}
            </div>
        </div>
    );
}
