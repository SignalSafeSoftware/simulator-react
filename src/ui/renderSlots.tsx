import type { ReactNode } from 'react';

import { SimulatorAlert, SimulatorButton } from './primitives.js';
import { joinClasses } from './simulatorClasses.js';

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
