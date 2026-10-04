import { SimulatorCapabilityState } from '../../contract/capabilities.js';
import { SIM_ACTION_REASON } from '../styles/semanticSimulatorClasses.js';
import { useId, type ButtonHTMLAttributes } from 'react';
import type { SimulatorCapability } from '../../contract/capabilities.js';

export function CapabilityButton({
    capability,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { capability: SimulatorCapability }) {
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
                <small id={reasonId} className={SIM_ACTION_REASON}>
                    {capability.reason}
                </small>
            )}
        </>
    );
}
