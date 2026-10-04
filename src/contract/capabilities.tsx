import { createContext, useContext } from 'react';

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
