import { type SimulatorDispatchAction } from '../state/simulatorDispatchActions.js';
/**
 * Developer tools state, keyboard shortcuts, and clipboard export for SimulatorWithSession.
 */

import { useCallback, useEffect, useMemo, useState, type MutableRefObject } from 'react';
import {
    reconcileVisibleDeveloperSections,
    resolveSimulatorDeveloperTools,
    type SimulatorDeveloperSectionKey,
    type SimulatorDeveloperTools,
} from './configuration.js';
import { type SimulatorSessionState } from '../types/session.js';
import {
    buildSimulatorNavGraph,
    type SimulatorNavGraph,
} from '../utils/navigation/simulatorNavGraph.js';
import { useSimulatorDeveloperExports } from './useSimulatorDeveloperExports.js';
import { useSimulatorKeyboardShortcuts } from './useSimulatorKeyboardShortcuts.js';
import { DEVELOPER_TOOLBAR_SECTIONS } from './toolbarConfig.js';

export interface UseSimulatorDeveloperControlsOptions {
    state: SimulatorSessionState;
    dispatch: (action: SimulatorDispatchAction) => void;
    stateRef: MutableRefObject<SimulatorSessionState>;
    developerTools?: SimulatorDeveloperTools;
}

export interface UseSimulatorDeveloperControlsResult {
    resolvedDeveloperTools: ReturnType<typeof resolveSimulatorDeveloperTools>;
    renderedDeveloperTools: SimulatorDeveloperTools | undefined;
    visibleDeveloperSections: Record<SimulatorDeveloperSectionKey, boolean>;
    developerToolbarSections: SimulatorDeveloperSectionKey[];
    toggleDeveloperSection: (section: SimulatorDeveloperSectionKey) => void;
    showDeveloperToolsToolbar: boolean;
    showParentDeveloperControls: boolean;
    navGraph: SimulatorNavGraph | null;
    exports: ReturnType<typeof useSimulatorDeveloperExports>;
    shortcuts: ReturnType<typeof useSimulatorKeyboardShortcuts>;
}

export function useSimulatorDeveloperControls({
    state,
    dispatch,
    stateRef,
    developerTools,
}: UseSimulatorDeveloperControlsOptions): UseSimulatorDeveloperControlsResult {
    const payload = state.payload;
    const resolvedDeveloperTools = useMemo(
        () => resolveSimulatorDeveloperTools(developerTools),
        [developerTools],
    );
    const [visibleDeveloperSections, setVisibleDeveloperSections] = useState(() =>
        reconcileVisibleDeveloperSections(resolvedDeveloperTools.sections),
    );

    useEffect(() => {
        setVisibleDeveloperSections((prev) =>
            reconcileVisibleDeveloperSections(resolvedDeveloperTools.sections, prev),
        );
    }, [resolvedDeveloperTools.sections]);

    const showResolvedSnapshotExport = visibleDeveloperSections.snapshotExport;
    const showResolvedNavGraph = visibleDeveloperSections.navGraph;
    const enableResolvedKeyboardShortcuts = visibleDeveloperSections.shortcuts;
    const developerToolbarSections = useMemo(
        () => DEVELOPER_TOOLBAR_SECTIONS.filter((key) => resolvedDeveloperTools.sections[key]),
        [resolvedDeveloperTools.sections],
    );
    const showDeveloperToolsToolbar =
        resolvedDeveloperTools.enabled && developerToolbarSections.length > 0;
    const showParentDeveloperControls =
        showResolvedSnapshotExport || showResolvedNavGraph || enableResolvedKeyboardShortcuts;

    const navGraph = useMemo((): SimulatorNavGraph | null => {
        if (!showResolvedNavGraph) return null;
        return buildSimulatorNavGraph(payload);
    }, [showResolvedNavGraph, payload]);

    const exportControls = useSimulatorDeveloperExports(state);
    const shortcuts = useSimulatorKeyboardShortcuts({
        enabled: enableResolvedKeyboardShortcuts,
        dispatch,
        stateRef,
    });

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
    }, [
        resolvedDeveloperTools.enabled,
        resolvedDeveloperTools.defaultExpanded,
        visibleDeveloperSections,
    ]);

    return {
        resolvedDeveloperTools,
        renderedDeveloperTools,
        visibleDeveloperSections,
        developerToolbarSections,
        toggleDeveloperSection,
        showDeveloperToolsToolbar,
        showParentDeveloperControls,
        navGraph,
        exports: exportControls,
        shortcuts,
    };
}
