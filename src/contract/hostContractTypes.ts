/**
 * Host integration: normalized interaction events (`SimulatorInteractionEvent`) for analytics or your API layer.
 * This package does not perform transport.
 */
export type HostSimulatorEventHandler = (event: import('../types/simulatorEvents').SimulatorInteractionEvent) => void;
