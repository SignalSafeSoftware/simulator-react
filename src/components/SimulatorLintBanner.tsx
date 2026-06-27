/**
 * Advisory template lint warnings for authors/admins.
 */
import { useId, useState } from 'react';

import type { SimulatorLintWarning } from '../utils/lintSimulatorPayload';
import { SimulatorAlert, SimulatorCollapse } from '../ui/primitives';
import { joinClasses, simBtnToneClass, SIM_MUTED } from '../ui/simulatorClasses';

export interface SimulatorLintBannerProps {
    warnings: SimulatorLintWarning[];
    className?: string;
}

export default function SimulatorLintBanner({ warnings, className }: Readonly<SimulatorLintBannerProps>) {
    const listId = useId();
    const [open, setOpen] = useState(true);
    if (warnings.length === 0) return null;
    return (
        <SimulatorAlert tone="warning" className={joinClasses('simulator-text--sm', className)} data-testid="simulator-lint-banner">
            <button
                type="button"
                className={joinClasses(simBtnToneClass('link'), 'simulator-btn--plain', 'simulator-text--semibold')}
                onClick={() => setOpen((prev: boolean) => !prev)}
                aria-expanded={open}
                aria-controls={listId}
            >
                Template suggestions ({warnings.length})
            </button>
            <span className={joinClasses(SIM_MUTED, 'simulator-inline-gap')}>— advisory; scenario still runs.</span>
            <SimulatorCollapse open={open} id={listId} className="simulator-collapse__body">
                <ul className="simulator-list--plain">
                    {warnings.map((w, i) => (
                        <li key={`${w.code}-${i}`}>
                            {w.path != null && <span className={SIM_MUTED}>{w.path}: </span>}
                            {w.message}
                        </li>
                    ))}
                </ul>
            </SimulatorCollapse>
        </SimulatorAlert>
    );
}
