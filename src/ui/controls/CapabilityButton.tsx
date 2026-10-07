import { SimulatorCapabilityState, type SimulatorCapability } from '../../contract/capabilities.js';
import { SIM_ACTION_REASON } from '../styles/semanticSimulatorClasses.js';
import { SIM_VISUALLY_HIDDEN } from '../styles/simulatorClasses.js';
import { useId, type ButtonHTMLAttributes } from 'react';

export function CapabilityButton({
    capability,
    showReason = true,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
    capability: SimulatorCapability;
    /** Hide the reason visually while retaining the disabled control's accessible description. */
    showReason?: boolean;
}) {
    const reasonId = useId();
    const available = capability.state === SimulatorCapabilityState.Enabled;
    return (
        <>
            <button
                {...props}
                disabled={props.disabled || !available}
                aria-describedby={
                    [props['aria-describedby'], available ? undefined : reasonId]
                        .filter(Boolean)
                        .join(' ') || undefined
                }
            >
                {children}
            </button>
            {!available && (
                <small
                    id={reasonId}
                    className={showReason ? SIM_ACTION_REASON : SIM_VISUALLY_HIDDEN}
                >
                    {capability.reason}
                </small>
            )}
        </>
    );
}
