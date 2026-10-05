import { useCallback, useState } from 'react';
import { SNAPSHOT_COPY_FEEDBACK_MS } from '../constants.js';
import type { SimulatorSessionState } from '../types/session.js';
import {
    buildSimulatorNavGraph,
    simulatorNavGraphToJson,
} from '../utils/navigation/simulatorNavGraph.js';
import { captureSimulatorSnapshot, snapshotToJson } from '../utils/telemetry/simulatorSnapshot.js';
import { canCopyToClipboard, copyToClipboard } from '../utils/browser/browserEnvironment.js';

/** Clipboard export of the session snapshot and navigation graph, with copied feedback flags. */
export function useSimulatorDeveloperExports(state: SimulatorSessionState) {
    const [snapshotCopied, setSnapshotCopied] = useState(false);
    const [graphCopied, setGraphCopied] = useState(false);

    const handleCopySnapshot = useCallback(() => {
        const snapshot = captureSimulatorSnapshot(state);
        const json = snapshotToJson(snapshot);
        if (canCopyToClipboard()) {
            copyToClipboard(json).then(
                () => {
                    setSnapshotCopied(true);
                    setTimeout(() => setSnapshotCopied(false), SNAPSHOT_COPY_FEEDBACK_MS);
                },
                () => {},
            );
        }
    }, [state]);

    const handleCopyNavGraph = useCallback(() => {
        const graph = buildSimulatorNavGraph(state.payload);
        const json = simulatorNavGraphToJson(graph);
        if (canCopyToClipboard()) {
            copyToClipboard(json).then(
                () => {
                    setGraphCopied(true);
                    setTimeout(() => setGraphCopied(false), SNAPSHOT_COPY_FEEDBACK_MS);
                },
                () => {},
            );
        }
    }, [state.payload]);

    return { snapshotCopied, graphCopied, handleCopySnapshot, handleCopyNavGraph };
}
