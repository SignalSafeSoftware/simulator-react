import { useRef } from 'react';
import { useSimulatorAppsHost } from './SimulatorAppsHost.js';

/** Tracks the saved copy of an edited draft and asks the host before unsaved changes are dropped. */
export function useDraftBaseline<T>(draft: T | null) {
    const { confirm } = useSimulatorAppsHost();
    const baseline = useRef<T | null>(null);
    const setBaseline = (next: T | null) => {
        baseline.current = next;
    };
    const hasBaseline = () => baseline.current !== null;
    const confirmDiscard = (message: string) =>
        JSON.stringify(draft) === JSON.stringify(baseline.current) || confirm(message);
    return { setBaseline, hasBaseline, confirmDiscard };
}
