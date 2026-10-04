/**
 * Developer tools section toggle toolbar for SimulatorWithSession.
 */

import { type SimulatorDeveloperSectionKey } from './configuration.js';
import { simBorder, simLayout, simSpacing } from '../simulatorStyles.js';
import {
    SIM_BORDER_NONE,
    SIM_FLEX_CENTER_MOD,
    SIM_OVERFLOW_HIDDEN,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_WHITE,
    joinClasses,
} from '../ui/styles/simulatorClasses.js';
import {
    SIM_DEV_TOOLBAR_BAR,
    SIM_DEV_TOOLBAR_BUTTON,
    SIM_DEV_TOOLBAR_BUTTON_ACTIVE,
} from '../ui/styles/semanticSimulatorClasses.js';
import { DEVELOPER_TOOLBAR_ICONS, DEVELOPER_TOOLBAR_LABELS } from './toolbarConfig.js';

export interface SimulatorDeveloperToolbarProps {
    sections: SimulatorDeveloperSectionKey[];
    visibleSections: Record<SimulatorDeveloperSectionKey, boolean>;
    onToggleSection: (section: SimulatorDeveloperSectionKey) => void;
}

export default function SimulatorDeveloperToolbar({
    sections,
    visibleSections,
    onToggleSection,
}: Readonly<SimulatorDeveloperToolbarProps>) {
    return (
        <div
            className={joinClasses(
                simSpacing.mb2,
                simBorder.tile,
                SIM_ROUNDED_NONE,
                SIM_OVERFLOW_HIDDEN,
                SIM_SURFACE_WHITE,
            )}
        >
            <div
                className={joinClasses(
                    simLayout.row,
                    simSpacing.gap2,
                    simSpacing.px1,
                    simSpacing.py1,
                    SIM_DEV_TOOLBAR_BAR,
                )}
            >
                {sections.map((section) => {
                    const visible = visibleSections[section];
                    return (
                        <button
                            key={section}
                            type="button"
                            className={joinClasses(
                                SIM_BORDER_NONE,
                                'simulator-inline-flex',
                                SIM_FLEX_CENTER_MOD,
                                SIM_ROUNDED_NONE,
                                SIM_DEV_TOOLBAR_BUTTON,
                                visible && SIM_DEV_TOOLBAR_BUTTON_ACTIVE,
                            )}
                            onClick={() => onToggleSection(section)}
                            aria-pressed={visible}
                            aria-label={DEVELOPER_TOOLBAR_LABELS[section]}
                            title={DEVELOPER_TOOLBAR_LABELS[section]}
                        >
                            <span aria-hidden>{DEVELOPER_TOOLBAR_ICONS[section]}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
