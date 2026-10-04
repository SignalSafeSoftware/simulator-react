import {
    SIM_BTN_PLAIN,
    SIM_LIST_PLAIN,
    SIM_MUTED,
    SIM_TEXT_SEMIBOLD,
    SIM_TEXT_SM,
    SimulatorButtonTone,
    joinClasses,
    simBtnToneClass,
} from '../ui/styles/simulatorClasses.js';
import { useSimulatorLocale } from '../i18n/SimulatorLocale.js';
/**
 * Advisory template lint warnings for authors/admins.
 */
import { useId, useState } from 'react';

import { type SimulatorLintWarning } from '../utils/payload/lintSimulatorPayload.js';
import { SimulatorAlert, SimulatorCollapse } from '../ui/primitives.js';

export interface SimulatorLintBannerProps {
    warnings: SimulatorLintWarning[];
    className?: string;
}

export default function SimulatorLintBanner({
    warnings,
    className,
}: Readonly<SimulatorLintBannerProps>) {
    const screenLocale = useSimulatorLocale();

    const listId = useId();
    const [open, setOpen] = useState(true);
    if (warnings.length === 0) return null;
    return (
        <SimulatorAlert
            tone="warning"
            className={joinClasses(SIM_TEXT_SM, className)}
            data-testid="simulator-lint-banner"
        >
            <button
                type="button"
                className={joinClasses(
                    simBtnToneClass(SimulatorButtonTone.Link),
                    SIM_BTN_PLAIN,
                    SIM_TEXT_SEMIBOLD,
                )}
                onClick={() => setOpen((prev: boolean) => !prev)}
                aria-expanded={open}
                aria-controls={listId}
            >
                {screenLocale.t('screen.simulatorLintBanner.template.suggestions')}
                {warnings.length})
            </button>
            <span className={joinClasses(SIM_MUTED, 'simulator-inline-gap')}>
                {screenLocale.t('screen.simulatorLintBanner.advisory.scenario.still.runs')}
            </span>
            <SimulatorCollapse open={open} id={listId} className="simulator-collapse__body">
                <ul className={SIM_LIST_PLAIN}>
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
