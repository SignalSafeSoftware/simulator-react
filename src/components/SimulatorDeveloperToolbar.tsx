/**
 * Developer tools section toggle toolbar for SimulatorWithSession.
 */

import type { SimulatorDeveloperSectionKey } from '../developerTools';
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
        <div className="mb-2 border border-secondary rounded-0 overflow-hidden bg-white">
            <div
                className="d-flex align-items-center gap-1 px-1 py-1"
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
                            className="border-0 d-inline-flex align-items-center justify-content-center rounded-0"
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
