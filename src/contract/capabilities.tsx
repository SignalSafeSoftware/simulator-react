import { createContext, useContext, useId, type ButtonHTMLAttributes } from 'react';

/** Hosts decide policy; a disabled capability always supplies a visible reason. */
export type SimulatorCapability =
  | { state: 'enabled' }
  | { state: 'unsupported' | 'unavailable'; reason: string };
export interface SimulatorActionCapabilities {
  call: SimulatorCapability;
  sendMessage: SimulatorCapability;
  sendEmail: SimulatorCapability;
  editContact: SimulatorCapability;
  changePhoto: SimulatorCapability;
}
export const SimulatorCapabilitiesContext = createContext<Partial<SimulatorActionCapabilities>>({});
export const useSimulatorCapabilities = () => useContext(SimulatorCapabilitiesContext);

export function CapabilityButton({ capability, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { capability: SimulatorCapability }) {
  const reasonId = useId();
  const available = capability.state === 'enabled';
  return <>
    <button {...props} disabled={props.disabled || !available} aria-describedby={[props['aria-describedby'], available ? undefined : reasonId].filter(Boolean).join(' ') || undefined}>{children}</button>
    {!available && <small id={reasonId} className="simulator-action-reason">{capability.reason}</small>}
  </>;
}
