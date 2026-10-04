import type { SimulatorStore } from '@signalsafe/simulator-core/apps/contracts';
import type { DeviceStore } from '@signalsafe/simulator-core/apps/store';
import { useReducer, useState, type ReactNode } from 'react';
import { createTestStore } from './deviceStore';

export type HarnessStore = DeviceStore & { state: () => SimulatorStore };

/** Re-renders its children whenever the in-memory store reports a change. */
export function StoreHarness({
    initial,
    prepare,
    children,
}: {
    initial?: SimulatorStore;
    prepare?: (store: HarnessStore) => void;
    children: (store: HarnessStore) => ReactNode;
}) {
    const [, bump] = useReducer((count: number) => count + 1, 0);
    const [store] = useState(() => {
        const created = createTestStore(() => bump(), initial);
        prepare?.(created);
        return created;
    });
    return <>{children(store)}</>;
}

/** Waits for pending promise callbacks and state updates to settle. */
export const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
