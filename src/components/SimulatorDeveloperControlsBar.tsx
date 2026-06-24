/**
 * Developer controls bar: snapshot/graph copy and keyboard shortcuts help.
 */

import type { SimulatorNavGraph } from '../utils/simulatorNavGraph';
import { simulatorNavGraphToJson } from '../utils/simulatorNavGraph';
import { SIMULATOR_KEYBOARD_COMMANDS } from '../utils/simulatorKeyboardCommands';

export interface SimulatorDeveloperControlsBarProps {
    showSnapshotExport: boolean;
    showNavGraph: boolean;
    enableKeyboardShortcuts: boolean;
    snapshotCopied: boolean;
    graphCopied: boolean;
    shortcutsHelpOpen: boolean;
    navGraph: SimulatorNavGraph | null;
    onCopySnapshot: () => void;
    onCopyNavGraph: () => void;
    onToggleShortcutsHelp: () => void;
}

export default function SimulatorDeveloperControlsBar({
    showSnapshotExport,
    showNavGraph,
    enableKeyboardShortcuts,
    snapshotCopied,
    graphCopied,
    shortcutsHelpOpen,
    navGraph,
    onCopySnapshot,
    onCopyNavGraph,
    onToggleShortcutsHelp,
}: Readonly<SimulatorDeveloperControlsBarProps>) {
    const showBar = showSnapshotExport || showNavGraph || enableKeyboardShortcuts;
    if (!showBar && !(enableKeyboardShortcuts && shortcutsHelpOpen)) {
        return null;
    }

    return (
        <>
            {showBar && (
                <>
                    <div className="small text-muted mb-1 px-1 d-flex align-items-center gap-2 flex-wrap">
                        {showSnapshotExport && (
                            <button
                                type="button"
                                className="btn btn-link btn-sm p-0 text-muted text-decoration-none"
                                onClick={onCopySnapshot}
                                aria-label="Copy simulator snapshot for debug"
                            >
                                {snapshotCopied ? 'Copied' : 'Copy snapshot'}
                            </button>
                        )}
                        {showNavGraph && (
                            <button
                                type="button"
                                className="btn btn-link btn-sm p-0 text-muted text-decoration-none"
                                onClick={onCopyNavGraph}
                                aria-label="Copy nav graph for debug"
                            >
                                {graphCopied ? 'Copied' : 'Copy graph'}
                            </button>
                        )}
                        {enableKeyboardShortcuts && (
                            <button
                                type="button"
                                className="btn btn-link btn-sm p-0 text-muted text-decoration-none"
                                onClick={onToggleShortcutsHelp}
                                aria-label="Keyboard shortcuts"
                            >
                                Shortcuts
                            </button>
                        )}
                    </div>
                    {showNavGraph && navGraph && (
                        <details className="small text-muted mb-2 px-1">
                            <summary className="cursor-pointer user-select-none">
                                Nav graph: {navGraph.nodes.length} nodes, {navGraph.edges.length} edges, entry{' '}
                                {navGraph.entry.app}:{navGraph.entry.screen}
                                {navGraph.browserHasCycle ? ', browser has cycle' : ''}
                            </summary>
                            <pre
                                className="small mb-0 mt-1 p-2 border rounded bg-light overflow-auto"
                                style={{ maxHeight: '12rem' }}
                            >
                                {simulatorNavGraphToJson(navGraph)}
                            </pre>
                        </details>
                    )}
                </>
            )}
            {enableKeyboardShortcuts && shortcutsHelpOpen && (
                <dialog
                    open
                    className="small text-muted mb-2 px-2 py-2 border rounded bg-light"
                    aria-label="Simulator keyboard shortcuts"
                >
                    <p className="fw-medium mb-1">Keyboard shortcuts</p>
                    <ul className="mb-0 ps-3 list-unstyled">
                        {SIMULATOR_KEYBOARD_COMMANDS.map((cmd) => (
                            <li key={`${cmd.keys}-${cmd.description}`}>
                                <kbd className="small">{cmd.keys}</kbd> — {cmd.description}
                            </li>
                        ))}
                    </ul>
                    <p className="small mb-0 mt-1">Press Escape to close.</p>
                </dialog>
            )}
        </>
    );
}
