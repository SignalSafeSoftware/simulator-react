import type { SimulatorTemplatePayload } from '../types/session.js';
import { simSpacing } from '../simulatorStyles.js';
import { SIM_RUNTIME_DIAGNOSTICS_BAND } from '../ui/styles/semanticSimulatorClasses.js';
import type { SimulatorRuntimeIssue } from './configuration.js';
import SimulatorDeveloperControlsBar from './SimulatorDeveloperControlsBar.js';
import SimulatorDeveloperToolbar from './SimulatorDeveloperToolbar.js';
import SimulatorDeveloperToolsPanel from './SimulatorDeveloperToolsPanel.js';
import type { TimelineEntry } from './SimulatorSessionTimeline.js';
import type { UseSimulatorDeveloperControlsResult } from './useSimulatorDeveloperControls.js';

/** Developer toolbar, export controls and diagnostics panel above the simulated device. */
export default function SimulatorDiagnosticsBand({
    controls,
    payload,
    timelineEntries,
    runtimeIssues,
}: Readonly<{
    controls: UseSimulatorDeveloperControlsResult;
    payload: SimulatorTemplatePayload;
    timelineEntries?: TimelineEntry[];
    runtimeIssues?: SimulatorRuntimeIssue[];
}>) {
    const showBand =
        controls.showDeveloperToolsToolbar ||
        controls.showParentDeveloperControls ||
        controls.resolvedDeveloperTools.enabled;
    const panel = (
        <SimulatorDeveloperToolsPanel
            developerTools={controls.renderedDeveloperTools}
            payload={payload}
            timelineEntries={timelineEntries}
            runtimeIssues={runtimeIssues}
            className={simSpacing.mb3}
        />
    );
    return (
        <>
            {showBand ? (
                <div className={SIM_RUNTIME_DIAGNOSTICS_BAND}>
                    {controls.showDeveloperToolsToolbar && (
                        <SimulatorDeveloperToolbar
                            sections={controls.developerToolbarSections}
                            visibleSections={controls.visibleDeveloperSections}
                            onToggleSection={controls.toggleDeveloperSection}
                        />
                    )}
                    {controls.showParentDeveloperControls && (
                        <SimulatorDeveloperControlsBar
                            showSnapshotExport={controls.visibleDeveloperSections.snapshotExport}
                            showNavGraph={controls.visibleDeveloperSections.navGraph}
                            enableKeyboardShortcuts={controls.visibleDeveloperSections.shortcuts}
                            snapshotCopied={controls.exports.snapshotCopied}
                            graphCopied={controls.exports.graphCopied}
                            shortcutsHelpOpen={controls.shortcuts.shortcutsHelpOpen}
                            navGraph={controls.navGraph}
                            onCopySnapshot={controls.exports.handleCopySnapshot}
                            onCopyNavGraph={controls.exports.handleCopyNavGraph}
                            onToggleShortcutsHelp={() =>
                                controls.shortcuts.setShortcutsHelpOpen((prev) => !prev)
                            }
                        />
                    )}
                    {panel}
                </div>
            ) : (
                panel
            )}
        </>
    );
}
