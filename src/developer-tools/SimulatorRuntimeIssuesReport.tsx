import { SIM_MUTED, joinClasses } from '../ui/simulatorClasses.js';
import { useSimulatorLocale } from '../i18n/SimulatorLocale.js';
import { simSpacing } from '../simulatorStyles.js';
import { CollapsibleReport } from './CollapsibleReport.js';
import { type SimulatorRuntimeIssue } from './configuration.js';

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
    const screenLocale = useSimulatorLocale();

    const errorCount = issues.filter((issue) => issue.severity === 'error').length;
    const summary = formatIssueCountSummary(issues.length, errorCount);

    return (
        <CollapsibleReport
            testId="simulator-runtime-issues-report"
            title={screenLocale.t('screen.simulatorRuntimeIssuesReport.runtime.issues')}
            summary={summary}
            className={className}
            defaultExpanded={defaultExpanded}
        >
            {issues.length === 0 ? (
                <div className={SIM_MUTED}>
                    {screenLocale.t(
                        'screen.simulatorRuntimeIssuesReport.no.runtime.issues.detected',
                    )}
                </div>
            ) : (
                <ul className={joinClasses(simSpacing.mb0, 'simulator-spacing--ps-3')}>
                    {issues.map((issue, index) => (
                        <li
                            key={`${issue.severity}-${issue.message}-${issue.node_id ?? ''}-${issue.choice_id ?? ''}-${index}`}
                        >
                            <span
                                className={
                                    issue.severity === 'error'
                                        ? 'simulator-text--danger'
                                        : 'simulator-text--warning'
                                }
                            >
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
        </CollapsibleReport>
    );
}
