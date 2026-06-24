import { useMemo } from 'react';
import type { SimulatorTemplatePayload } from './types/session';
import { analyzeReachability } from './utils/simulatorReachability';
import { buildSimulatorPreviewReport } from './utils/simulatorPreviewReport';
import {
    resolveSimulatorDeveloperTools,
    type SimulatorDeveloperTools,
    type SimulatorRuntimeIssue,
} from './developerTools';
import SimulatorAuthorPreviewReport from './components/SimulatorAuthorPreviewReport';
import SimulatorReachabilityReport from './components/SimulatorReachabilityReport';
import SimulatorSessionTimeline, { type TimelineEntry } from './components/SimulatorSessionTimeline';
import SimulatorRuntimeIssuesReport from './components/SimulatorRuntimeIssuesReport';

export interface SimulatorDeveloperToolsPanelProps {
    developerTools?: SimulatorDeveloperTools;
    payload?: SimulatorTemplatePayload | null;
    timelineEntries?: TimelineEntry[];
    /** Optional TreeSpec-backed runtime issues supplied by hosts that own that analysis context. */
    runtimeIssues?: SimulatorRuntimeIssue[];
    className?: string;
}

export default function SimulatorDeveloperToolsPanel({
    developerTools,
    payload,
    timelineEntries,
    runtimeIssues,
    className,
}: Readonly<SimulatorDeveloperToolsPanelProps>) {
    const resolved = resolveSimulatorDeveloperTools(developerTools);
    const previewReport = useMemo(
        () => (resolved.sections.summary && payload != null ? buildSimulatorPreviewReport(payload) : null),
        [resolved.sections.summary, payload]
    );
    const reachabilityReport = useMemo(
        () => (resolved.sections.reachability && payload != null ? analyzeReachability(payload) : null),
        [resolved.sections.reachability, payload]
    );

    if (!resolved.enabled) {
        return null;
    }

    return (
        <>
            {resolved.sections.summary && previewReport != null && (
                <SimulatorAuthorPreviewReport
                    report={previewReport}
                    className={className}
                    defaultExpanded={resolved.defaultExpanded}
                />
            )}
            {resolved.sections.reachability && reachabilityReport != null && (
                <SimulatorReachabilityReport
                    report={reachabilityReport}
                    className={className}
                    defaultExpanded={resolved.defaultExpanded}
                />
            )}
            {resolved.sections.timeline && timelineEntries != null && (
                <SimulatorSessionTimeline
                    entries={timelineEntries}
                    className={className}
                    defaultExpanded={resolved.defaultExpanded}
                />
            )}
            {resolved.sections.runtimeIssues && runtimeIssues != null && (
                <SimulatorRuntimeIssuesReport
                    issues={runtimeIssues}
                    className={className}
                    defaultExpanded={resolved.defaultExpanded}
                />
            )}
        </>
    );
}
