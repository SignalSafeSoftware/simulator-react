import { useId, useState, type ReactNode } from 'react';
import {
    SimulatorButtonTone,
    SIM_MUTED,
    joinClasses,
    simBtnToneClass,
} from '../ui/simulatorClasses.js';
import {
    SimulatorCard,
    SimulatorCardBody,
    SimulatorCardHeader,
    SimulatorCollapse,
} from '../ui/primitives.js';
import { simSpacing } from '../simulatorStyles.js';

export interface CollapsibleReportProps {
    testId: string;
    title: ReactNode;
    summary?: ReactNode;
    className?: string;
    defaultExpanded?: boolean;
    children: ReactNode;
}

/** Shared expandable card used by the developer-tool reports. */
export function CollapsibleReport({
    testId,
    title,
    summary,
    className,
    defaultExpanded = false,
    children,
}: Readonly<CollapsibleReportProps>) {
    const bodyId = useId();
    const [open, setOpen] = useState(defaultExpanded);
    return (
        <SimulatorCard className={joinClasses(simSpacing.mb2, className)} data-testid={testId}>
            <SimulatorCardHeader
                className={joinClasses(
                    'simulator-text--sm',
                    'simulator-surface--header',
                    simSpacing.py1,
                    simSpacing.px2,
                )}
            >
                <button
                    type="button"
                    className={joinClasses(
                        simBtnToneClass(SimulatorButtonTone.Link),
                        'simulator-btn--plain',
                        'simulator-text--semibold',
                        'simulator-text--body',
                    )}
                    onClick={() => setOpen((prev) => !prev)}
                    aria-expanded={open}
                    aria-controls={bodyId}
                >
                    {title}
                </button>
                {summary != null && (
                    <span className={joinClasses(SIM_MUTED, 'simulator-inline-gap')}>
                        {summary}
                    </span>
                )}
            </SimulatorCardHeader>
            <SimulatorCollapse open={open}>
                <SimulatorCardBody
                    id={bodyId}
                    className={joinClasses('simulator-text--sm', simSpacing.py2, simSpacing.px2)}
                >
                    {children}
                </SimulatorCardBody>
            </SimulatorCollapse>
        </SimulatorCard>
    );
}
