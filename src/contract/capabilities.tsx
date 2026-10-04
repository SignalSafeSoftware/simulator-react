import { createContext, useContext } from 'react';

/** Hosts decide policy; a disabled capability always supplies a visible reason. */
export const SimulatorCapabilityState = Object.freeze({
    Enabled: 'enabled',
    Unsupported: 'unsupported',
    Unavailable: 'unavailable',
} as const);
export type SimulatorCapabilityState =
    (typeof SimulatorCapabilityState)[keyof typeof SimulatorCapabilityState];
export type SimulatorCapability =
    | { state: typeof SimulatorCapabilityState.Enabled }
    | {
          state:
              | typeof SimulatorCapabilityState.Unsupported
              | typeof SimulatorCapabilityState.Unavailable;
          reason: string;
      };
export interface SimulatorActionCapabilities {
    call: SimulatorCapability;
    sendMessage: SimulatorCapability;
    sendEmail: SimulatorCapability;
    editContact: SimulatorCapability;
    changePhoto: SimulatorCapability;
}
export const SimulatorCapabilitiesContext = createContext<Partial<SimulatorActionCapabilities>>({});
export const useSimulatorCapabilities = () => useContext(SimulatorCapabilitiesContext);
