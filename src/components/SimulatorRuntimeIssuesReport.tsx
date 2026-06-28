import { useId, useState } from 'react';
import {
    SimulatorCard,
    SimulatorCardBody,
    SimulatorCardHeader,
    SimulatorCollapse,
} from '../ui/primitives.js';
import { simSpacing } from '../simulatorStyles.js';
import { SIM_MUTED, joinClasses, simBtnToneClass } from '../ui/simulatorClasses.js';
import type { SimulatorRuntimeIssue } from '../developerTools.js';

export interface SimulatorRuntimeIssuesReportProps {
    issues: SimulatorRuntimeIssue[];
    className?: string;
    defaultExpanded?: boolean;
}

function formatIssueCountSummary(issueCount: number, errorCount: number): string {
    if (issueCount === 0) {
        return '— none';
    }

    const issueLabel = issueCount === 1 ? 'issue' : 'issues';
    if (errorCount === 0) {
        return `— ${issueCount} ${issueLabel}`;
    }

    const errorLabel = errorCount === 1 ? 'error' : 'errors';
    return `— ${issueCount} ${issueLabel}, ${errorCount} ${errorLabel}`;
}

function formatIssueLocation(issue: SimulatorRuntimeIssue): string | null {
    if (issue.node_id == null && issue.choice_id == null) {
        return null;
    }

    const nodeId = issue.node_id ?? 'node ?';
    if (issue.choice_id == null) {
        return `(${nodeId})`;
    }

    return `(${nodeId} / ${issue.choice_id})`;
}

export default function SimulatorRuntimeIssuesReport({
    issues,
    className,
    defaultExpanded = false,
}: Readonly<SimulatorRuntimeIssuesReportProps>) {
    const bodyId = useId();
    const [open, setOpen] = useState(defaultExpanded);
    const errorCount = issues.filter((issue) => issue.severity === 'error').length;
    const summary = formatIssueCountSummary(issues.length, errorCount);

    return (
        <SimulatorCard className={joinClasses(simSpacing.mb2, className)} data-testid="simulator-runtime-issues-report">
            <SimulatorCardHeader
                className={joinClasses('simulator-text--sm', 'simulator-surface--header', simSpacing.py1, simSpacing.px2)}
            >
                <button
                    type="button"
                    className={joinClasses(
                        simBtnToneClass('link'),
                        'simulator-btn--plain',
                        'simulator-text--semibold',
                        'simulator-text--body',
                    )}
                    onClick={() => setOpen((prev: boolean) => !prev)}
                    aria-expanded={open}
                    aria-controls={bodyId}
                >
                    Runtime issues
                </button>
                <span className={joinClasses(SIM_MUTED, 'simulator-inline-gap')}>{summary}</span>
            </SimulatorCardHeader>
            <SimulatorCollapse open={open}>
                <SimulatorCardBody id={bodyId} className={joinClasses('simulator-text--sm', simSpacing.py2, simSpacing.px2)}>
                    {issues.length === 0 ? (
                        <div className={SIM_MUTED}>No runtime issues detected.</div>
                    ) : (
                        <ul className={joinClasses(simSpacing.mb0, 'simulator-spacing--ps-3')}>
                            {issues.map((issue, index) => (
                                <li key={`${issue.severity}-${issue.message}-${issue.node_id ?? ''}-${issue.choice_id ?? ''}-${index}`}>
                                    <span className={issue.severity === 'error' ? 'simulator-text--danger' : 'simulator-text--warning'}>
                                        {issue.severity}
                                    </span>
                                    {': '}
                                    <span>{issue.message}</span>
                                    {formatIssueLocation(issue) != null && (
                                        <span className={SIM_MUTED}> {formatIssueLocation(issue)}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </SimulatorCardBody>
            </SimulatorCollapse>
        </SimulatorCard>
    );
}
