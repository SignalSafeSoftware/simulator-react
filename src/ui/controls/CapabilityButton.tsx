import { useId, type ButtonHTMLAttributes } from 'react';
import type { SimulatorCapability } from '../../contract/capabilities.js';

export function CapabilityButton({
    capability,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { capability: SimulatorCapability }) {
    const reasonId = useId();
    const available = capability.state === 'enabled';
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
                <small id={reasonId} className="simulator-action-reason">
                    {capability.reason}
                </small>
            )}
        </>
    );
}
