/**
 * Developer tools state, keyboard shortcuts, and clipboard export for SimulatorWithSession.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import {
    reconcileVisibleDeveloperSections,
    resolveSimulatorDeveloperTools,
    type SimulatorDeveloperSectionKey,
    type SimulatorDeveloperTools,
} from '../developerTools';
import { SNAPSHOT_COPY_FEEDBACK_MS } from '../constants';
import type { SimulatorDispatchAction } from '../state/simulatorSessionReducer';
import { switchChannelAction } from '../state/simulatorSessionReducer';
import type { SimulatorSessionState } from '../types/session';
import { getCurrentScreenForApp, viewStateToActiveChannel } from '../types/session';
import {
    buildSimulatorNavGraph,
    simulatorNavGraphToJson,
    type SimulatorNavGraph,
} from '../utils/simulatorNavGraph';
import { captureSimulatorSnapshot, snapshotToJson } from '../utils/simulatorSnapshot';
import {
    focusSimulatorSearch,
    handleSimulatorKeyboard,
} from '../utils/simulatorKeyboardCommands';
import { DEVELOPER_TOOLBAR_LABELS } from '../utils/simulatorDeveloperToolbarConfig';

export interface UseSimulatorDeveloperControlsOptions {
    state: SimulatorSessionState;
    dispatch: (action: SimulatorDispatchAction) => void;
    stateRef: MutableRefObject<SimulatorSessionState>;
    developerTools?: SimulatorDeveloperTools;
}

export interface UseSimulatorDeveloperControlsResult {
    resolvedDeveloperTools: ReturnType<typeof resolveSimulatorDeveloperTools>;
    visibleDeveloperSections: Record<SimulatorDeveloperSectionKey, boolean>;
    developerToolbarSections: SimulatorDeveloperSectionKey[];
    showDeveloperToolsToolbar: boolean;
    showParentDeveloperControls: boolean;
    showResolvedSnapshotExport: boolean;
    showResolvedNavGraph: boolean;
    enableResolvedKeyboardShortcuts: boolean;
    navGraph: SimulatorNavGraph | null;
    snapshotCopied: boolean;
    graphCopied: boolean;
    shortcutsHelpOpen: boolean;
    setShortcutsHelpOpen: Dispatch<SetStateAction<boolean>>;
    toggleDeveloperSection: (section: SimulatorDeveloperSectionKey) => void;
    handleCopySnapshot: () => void;
    handleCopyNavGraph: () => void;
    renderedDeveloperTools: SimulatorDeveloperTools | undefined;
}

export function useSimulatorDeveloperControls({
    state,
    dispatch,
    stateRef,
    developerTools,
}: UseSimulatorDeveloperControlsOptions): UseSimulatorDeveloperControlsResult {
    const [snapshotCopied, setSnapshotCopied] = useState(false);
    const [graphCopied, setGraphCopied] = useState(false);
    const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
    const shortcutsHelpOpenRef = useRef(shortcutsHelpOpen);
    shortcutsHelpOpenRef.current = shortcutsHelpOpen;

    const payload = state.payload;
    const resolvedDeveloperTools = useMemo(() => resolveSimulatorDeveloperTools(developerTools), [developerTools]);
    const [visibleDeveloperSections, setVisibleDeveloperSections] = useState(() =>
        reconcileVisibleDeveloperSections(resolvedDeveloperTools.sections)
    );

    useEffect(() => {
        setVisibleDeveloperSections((prev) =>
            reconcileVisibleDeveloperSections(resolvedDeveloperTools.sections, prev)
        );
    }, [resolvedDeveloperTools.sections]);

    const showResolvedSnapshotExport = visibleDeveloperSections.snapshotExport;
    const showResolvedNavGraph = visibleDeveloperSections.navGraph;
    const enableResolvedKeyboardShortcuts = visibleDeveloperSections.shortcuts;
    const developerToolbarSections = useMemo(
        () =>
            (Object.keys(DEVELOPER_TOOLBAR_LABELS) as SimulatorDeveloperSectionKey[]).filter(
                (key) => resolvedDeveloperTools.sections[key]
            ),
        [resolvedDeveloperTools.sections]
    );
    const showDeveloperToolsToolbar = resolvedDeveloperTools.enabled && developerToolbarSections.length > 0;
    const showParentDeveloperControls =
        showResolvedSnapshotExport || showResolvedNavGraph || enableResolvedKeyboardShortcuts;

    const navGraph = useMemo((): SimulatorNavGraph | null => {
        if (!showResolvedNavGraph) return null;
        return buildSimulatorNavGraph(payload);
    }, [showResolvedNavGraph, payload]);

    const handleCopySnapshot = useCallback(() => {
        const snapshot = captureSimulatorSnapshot(state);
        const json = snapshotToJson(snapshot);
        if (typeof navigator?.clipboard?.writeText === 'function') {
            navigator.clipboard.writeText(json).then(
                () => {
                    setSnapshotCopied(true);
                    setTimeout(() => setSnapshotCopied(false), SNAPSHOT_COPY_FEEDBACK_MS);
                },
                () => {}
            );
        }
    }, [state]);

    const handleCopyNavGraph = useCallback(() => {
        const graph = buildSimulatorNavGraph(state.payload);
        const json = simulatorNavGraphToJson(graph);
        if (typeof navigator?.clipboard?.writeText === 'function') {
            navigator.clipboard.writeText(json).then(
                () => {
                    setGraphCopied(true);
                    setTimeout(() => setGraphCopied(false), SNAPSHOT_COPY_FEEDBACK_MS);
                },
                () => {}
            );
        }
    }, [state.payload]);

    useEffect(() => {
        if (!enableResolvedKeyboardShortcuts) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && shortcutsHelpOpenRef.current) {
                setShortcutsHelpOpen(false);
                e.preventDefault();
                return;
            }
            const s = stateRef.current;
            const activeScreen = getCurrentScreenForApp(s.view);
            const result = handleSimulatorKeyboard(
                e,
                {
                    onBack: () => dispatch({ type: 'BACK' }),
                    onSwitchApp: (app) => dispatch(switchChannelAction(viewStateToActiveChannel(app))),
                    onFocusSearch: focusSimulatorSearch,
                },
                { activeApp: s.view.activeApp, activeScreen }
            );
            if (result.showHelp) setShortcutsHelpOpen(true);
            if (result.handled) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        document.addEventListener('keydown', onKeyDown, true);
        return () => document.removeEventListener('keydown', onKeyDown, true);
    }, [enableResolvedKeyboardShortcuts, dispatch, stateRef]);

    const toggleDeveloperSection = useCallback((section: SimulatorDeveloperSectionKey) => {
        setVisibleDeveloperSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    }, []);

    const renderedDeveloperTools = useMemo<SimulatorDeveloperTools | undefined>(() => {
        if (!resolvedDeveloperTools.enabled) {
            return undefined;
        }
        return {
            enabled: true,
            defaultExpanded: resolvedDeveloperTools.defaultExpanded,
            sections: visibleDeveloperSections,
        };
    }, [resolvedDeveloperTools.enabled, resolvedDeveloperTools.defaultExpanded, visibleDeveloperSections]);

    return {
        resolvedDeveloperTools,
        visibleDeveloperSections,
        developerToolbarSections,
        showDeveloperToolsToolbar,
        showParentDeveloperControls,
        showResolvedSnapshotExport,
        showResolvedNavGraph,
        enableResolvedKeyboardShortcuts,
        navGraph,
        snapshotCopied,
        graphCopied,
        shortcutsHelpOpen,
        setShortcutsHelpOpen,
        toggleDeveloperSection,
        handleCopySnapshot,
        handleCopyNavGraph,
        renderedDeveloperTools,
    };
}
