import { useSimulatorLocale } from '../i18n/SimulatorLocale.js';
/**
 * Developer controls bar: snapshot/graph copy and keyboard shortcuts help.
 */

import type { SimulatorNavGraph } from '../utils/simulatorNavGraph.js';
import { simulatorNavGraphToJson } from '../utils/simulatorNavGraph.js';
import { SIMULATOR_KEYBOARD_COMMANDS } from '../utils/simulatorKeyboardCommands.js';
import { simBorder, simSpacing } from '../simulatorStyles.js';
import {
    joinClasses,
    SIM_FLEX,
    SIM_MUTED,
    SIM_OVERFLOW_AUTO,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_LIGHT,
    SIM_TEXT_MEDIUM,
    SIM_TEXT_SM,
    simBtnToneClass,
} from '../ui/simulatorClasses.js';

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
    const screenLocale = useSimulatorLocale();

    const showBar = showSnapshotExport || showNavGraph || enableKeyboardShortcuts;
    if (!showBar && !(enableKeyboardShortcuts && shortcutsHelpOpen)) {
        return null;
    }

    const devLinkClass = joinClasses(
        simBtnToneClass('link'),
        'simulator-btn--sm',
        'simulator-btn--plain',
        SIM_MUTED,
        'simulator-text--link-plain',
    );

    return (
        <>
            {showBar && (
                <>
                    <div
                        className={joinClasses(
                            SIM_TEXT_SM,
                            SIM_MUTED,
                            simSpacing.mb1,
                            'simulator-spacing--px-1',
                            SIM_FLEX,
                            'simulator-flex--align-center',
                            simSpacing.gap2,
                            'simulator-flex--wrap',
                        )}
                    >
                        {showSnapshotExport && (
                            <button
                                type="button"
                                className={devLinkClass}
                                onClick={onCopySnapshot}
                                aria-label={screenLocale.t(
                                    'screen.simulatorDeveloperControlsBar.copy.simulator.snapshot.for.debug',
                                )}
                            >
                                {snapshotCopied
                                    ? screenLocale.t('screen.simulatorDeveloperControlsBar.copied')
                                    : screenLocale.t(
                                          'screen.simulatorDeveloperControlsBar.copy.snapshot',
                                      )}
                            </button>
                        )}
                        {showNavGraph && (
                            <button
                                type="button"
                                className={devLinkClass}
                                onClick={onCopyNavGraph}
                                aria-label={screenLocale.t(
                                    'screen.simulatorDeveloperControlsBar.copy.nav.graph.for.debug',
                                )}
                            >
                                {graphCopied
                                    ? screenLocale.t('screen.simulatorDeveloperControlsBar.copied')
                                    : screenLocale.t(
                                          'screen.simulatorDeveloperControlsBar.copy.graph',
                                      )}
                            </button>
                        )}
                        {enableKeyboardShortcuts && (
                            <button
                                type="button"
                                className={devLinkClass}
                                onClick={onToggleShortcutsHelp}
                                aria-label={screenLocale.t(
                                    'screen.simulatorDeveloperControlsBar.keyboard.shortcuts',
                                )}
                            >
                                {screenLocale.t('screen.simulatorDeveloperControlsBar.shortcuts')}
                            </button>
                        )}
                    </div>
                    {showNavGraph && navGraph && (
                        <details
                            className={joinClasses(
                                SIM_TEXT_SM,
                                SIM_MUTED,
                                simSpacing.mb2,
                                'simulator-spacing--px-1',
                            )}
                        >
                            <summary className="simulator-cursor-pointer simulator-user-select-none">
                                {screenLocale.t('screen.simulatorDeveloperControlsBar.nav.graph')}
                                {navGraph.nodes.length}
                                {screenLocale.t('screen.simulatorDeveloperControlsBar.nodes')}
                                {navGraph.edges.length}
                                {screenLocale.t(
                                    'screen.simulatorDeveloperControlsBar.edges.entry',
                                )}{' '}
                                {navGraph.entry.app}:{navGraph.entry.screen}
                                {navGraph.browserHasCycle
                                    ? screenLocale.t(
                                          'screen.simulatorDeveloperControlsBar.browser.has.cycle',
                                      )
                                    : ''}
                            </summary>
                            <pre
                                className={joinClasses(
                                    SIM_TEXT_SM,
                                    simSpacing.mb0,
                                    simSpacing.mt1,
                                    simSpacing.p2,
                                    simBorder.tile,
                                    SIM_ROUNDED_NONE,
                                    SIM_SURFACE_LIGHT,
                                    SIM_OVERFLOW_AUTO,
                                )}
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
                    className={joinClasses(
                        SIM_TEXT_SM,
                        SIM_MUTED,
                        simSpacing.mb2,
                        simSpacing.px2,
                        simSpacing.py2,
                        simBorder.tile,
                        SIM_ROUNDED_NONE,
                        SIM_SURFACE_LIGHT,
                    )}
                    aria-label={screenLocale.t(
                        'screen.simulatorDeveloperControlsBar.simulator.keyboard.shortcuts',
                    )}
                >
                    <p className={joinClasses(SIM_TEXT_MEDIUM, simSpacing.mb1)}>
                        {screenLocale.t('screen.simulatorDeveloperControlsBar.keyboard.shortcuts')}
                    </p>
                    <ul
                        className={joinClasses(
                            simSpacing.mb0,
                            'simulator-spacing--ps-3',
                            'simulator-list--plain',
                        )}
                    >
                        {SIMULATOR_KEYBOARD_COMMANDS.map((cmd) => (
                            <li key={`${cmd.keys}-${cmd.description}`}>
                                <kbd className={SIM_TEXT_SM}>{cmd.keys}</kbd> — {cmd.description}
                            </li>
                        ))}
                    </ul>
                    <p className={joinClasses(SIM_TEXT_SM, simSpacing.mb0, simSpacing.mt1)}>
                        {screenLocale.t(
                            'screen.simulatorDeveloperControlsBar.press.escape.to.close',
                        )}
                    </p>
                </dialog>
            )}
        </>
    );
}
