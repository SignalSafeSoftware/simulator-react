import { useId, useState } from 'react';
import { Card, Collapse } from 'react-bootstrap';
import type { SimulatorRuntimeIssue } from '../developerTools';

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
        <Card className={`mb-2 ${className ?? ''}`.trim()} data-testid="simulator-runtime-issues-report">
            <Card.Header className="py-1 px-2 small bg-light">
                <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none text-dark fw-medium"
                    onClick={() => setOpen((prev: boolean) => !prev)}
                    aria-expanded={open}
                    aria-controls={bodyId}
                >
                    Runtime issues
                </button>
                <span className="text-muted ms-1">{summary}</span>
            </Card.Header>
            <Collapse in={open}>
                <Card.Body id={bodyId} className="small py-2 px-2">
                    {issues.length === 0 ? (
                        <div className="text-muted">No runtime issues detected.</div>
                    ) : (
                        <ul className="mb-0 ps-3">
                            {issues.map((issue, index) => (
                                <li key={`${issue.severity}-${issue.message}-${issue.node_id ?? ''}-${issue.choice_id ?? ''}-${index}`}>
                                    <span className={issue.severity === 'error' ? 'text-danger' : 'text-warning'}>
                                        {issue.severity}
                                    </span>
                                    {': '}
                                    <span>{issue.message}</span>
                                    {formatIssueLocation(issue) != null && (
                                        <span className="text-muted"> {formatIssueLocation(issue)}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </Card.Body>
            </Collapse>
        </Card>
    );
}
