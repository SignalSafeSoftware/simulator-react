/**
 * Development/admin reachability report for simulator templates.
 * Shows which screens and entities are reachable from the entry flow.
 */
import { useId, useState } from 'react';
import { Card, Collapse } from 'react-bootstrap';
import type { ReachabilityReport } from '../utils/simulatorReachability';

export interface SimulatorReachabilityReportProps {
    report: ReachabilityReport;
    /** Optional class for the container. */
    className?: string;
    defaultExpanded?: boolean;
}

function Line({ label, value }: Readonly<{ label: string; value: string | string[] }>) {
    const text = Array.isArray(value) ? value.join(', ') || '—' : value;
    return (
        <div className="small">
            <span className="text-muted">{label}:</span>{' '}
            <span className="text-dark">{text}</span>
        </div>
    );
}

function formatUnknownValue(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
        return `${value}`;
    }
    if (value == null) {
        return '';
    }
    try {
        return JSON.stringify(value) ?? '';
    } catch {
        return '[unserializable]';
    }
}

function trimSlashes(value: string): string {
    let start = 0;
    let end = value.length;
    while (start < end && value[start] === '/') {
        start += 1;
    }
    while (end > start && value[end - 1] === '/') {
        end -= 1;
    }
    return value.slice(start, end);
}

function formatScreenRef(value: unknown): string {
    if (value != null && typeof value === 'object') {
        const ref = value as { app?: unknown; screen?: unknown };
        if (typeof ref.app === 'string' || typeof ref.screen === 'string') {
            return trimSlashes(`${formatUnknownValue(ref.app)}/${formatUnknownValue(ref.screen)}`);
        }
        try {
            return JSON.stringify(value);
        } catch {
            return '[unserializable]';
        }
    }
    return formatUnknownValue(value);
}

export default function SimulatorReachabilityReport({
    report,
    className,
    defaultExpanded = false,
}: Readonly<SimulatorReachabilityReportProps>) {
    const bodyId = useId();
    const [open, setOpen] = useState(defaultExpanded);
    const {
        entryApp,
        reachableApps,
        reachableScreens,
        reachableEntities,
        unreachable,
        browserHasCycle,
    } = report;

    const hasUnreachable =
        unreachable.screens.length > 0 ||
        unreachable.contacts.length > 0 ||
        unreachable.inboxMessageIds.length > 0 ||
        unreachable.browserPageIds.length > 0;

    return (
        <Card className={`mb-2 ${className ?? ''}`.trim()} data-testid="simulator-reachability-report">
            <Card.Header className="py-1 px-2 small bg-light">
                <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none text-dark fw-medium"
                    onClick={() => setOpen((prev: boolean) => !prev)}
                    aria-expanded={open}
                    aria-controls={bodyId}
                >
                    Reachability {hasUnreachable ? `(${unreachable.screens.length + unreachable.contacts.length + unreachable.inboxMessageIds.length + unreachable.browserPageIds.length} unreachable)` : ''}
                </button>
            </Card.Header>
            <Collapse in={open}>
                <Card.Body id={bodyId} className="small py-2 px-2">
                    <Line label="Entry app" value={entryApp ?? '—'} />
                    <Line label="Reachable apps" value={reachableApps} />
                    {reachableApps.map((app) => {
                        const screens = reachableScreens[app];
                        if (screens.length === 0) return null;
                        return (
                            <Line key={app} label={`${app} screens`} value={screens} />
                        );
                    })}
                    {(reachableEntities.contacts.length > 0 || reachableEntities.inboxMessageIds.length > 0 || reachableEntities.browserPageIds.length > 0) && (
                        <>
                            {reachableEntities.contacts.length > 0 && (
                                <Line label="Reachable contacts" value={reachableEntities.contacts} />
                            )}
                            {reachableEntities.inboxMessageIds.length > 0 && (
                                <Line label="Reachable inbox" value={reachableEntities.inboxMessageIds} />
                            )}
                            {reachableEntities.browserPageIds.length > 0 && (
                                <Line label="Reachable pages" value={reachableEntities.browserPageIds} />
                            )}
                        </>
                    )}
                    {hasUnreachable && (
                        <div className="mt-2 pt-2 border-top">
                            <span className="text-muted fw-medium">Unreachable</span>
                            {unreachable.screens.length > 0 && (
                                <div className="mt-1">
                                    Screens: {unreachable.screens.map((s) => formatScreenRef(s)).join(', ')}
                                </div>
                            )}
                            {unreachable.contacts.length > 0 && (
                                <div>Contacts: {unreachable.contacts.join(', ')}</div>
                            )}
                            {unreachable.inboxMessageIds.length > 0 && (
                                <div>Inbox: {unreachable.inboxMessageIds.join(', ')}</div>
                            )}
                            {unreachable.browserPageIds.length > 0 && (
                                <div>Pages: {unreachable.browserPageIds.join(', ')}</div>
                            )}
                        </div>
                    )}
                    {browserHasCycle && (
                        <div className="mt-2 text-warning">
                            Browser navigation has a cycle (e.g. A → B → A).
                        </div>
                    )}
                </Card.Body>
            </Collapse>
        </Card>
    );
}
