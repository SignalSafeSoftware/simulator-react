import type { SimulatorInteractionEvent } from '../types/simulatorEvents.js';

/**
 * Host integration: normalized interaction events (`SimulatorInteractionEvent`) for analytics or your API layer.
 * This package does not perform transport.
 */
export type HostSimulatorEventHandler = (event: SimulatorInteractionEvent) => void;
