/**
 * Developer tools section toggle toolbar for SimulatorWithSession.
 */

import type { SimulatorDeveloperSectionKey } from '../developerTools';
import { simBorder, simLayout, simSpacing } from '../simulatorStyles';
import {
    joinClasses,
    SIM_OVERFLOW_HIDDEN,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_WHITE,
} from '../ui/simulatorClasses';
import {
    DEVELOPER_TOOLBAR_ICONS,
    DEVELOPER_TOOLBAR_LABELS,
} from '../utils/simulatorDeveloperToolbarConfig';

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
        <div className={joinClasses(simSpacing.mb2, simBorder.tile, SIM_ROUNDED_NONE, SIM_OVERFLOW_HIDDEN, SIM_SURFACE_WHITE)}>
            <div
                className={joinClasses(simLayout.row, simSpacing.gap2, simSpacing.px1, simSpacing.py1)}
                style={{
                    backgroundColor: '#2f7df6',
                    borderBottom: '1px solid #b9cdef',
                }}
            >
                {sections.map((section) => {
                    const visible = visibleSections[section];
                    return (
                        <button
                            key={section}
                            type="button"
                            className={joinClasses(
                                'simulator-border--none',
                                'simulator-inline-flex',
                                'simulator-flex--center',
                                SIM_ROUNDED_NONE,
                            )}
                            onClick={() => onToggleSection(section)}
                            aria-pressed={visible}
                            aria-label={DEVELOPER_TOOLBAR_LABELS[section]}
                            title={DEVELOPER_TOOLBAR_LABELS[section]}
                            style={{
                                width: 26,
                                height: 26,
                                fontSize: 14,
                                lineHeight: 1,
                                color: '#ffffff',
                                backgroundColor: visible ? 'rgba(255,255,255,0.18)' : 'transparent',
                                boxShadow: visible ? 'inset 0 0 0 1px rgba(255,255,255,0.35)' : 'none',
                            }}
                        >
                            <span aria-hidden>{DEVELOPER_TOOLBAR_ICONS[section]}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
