/**
 * Development/admin reachability report for simulator templates.
 * Shows which screens and entities are reachable from the entry flow.
 */
import {
    SIM_BORDER_TOP,
    SIM_MUTED,
    SIM_TEXT_BODY,
    SIM_TEXT_SEMIBOLD,
    SIM_TEXT_SM,
    SIM_TEXT_WARNING,
    joinClasses,
} from '../ui/styles/simulatorClasses.js';
import { isRecord } from '@signalsafe/tree-spec';
import { useSimulatorLocale } from '../i18n/SimulatorLocale.js';
import { simSpacing } from '../simulatorStyles.js';
import { type ReachabilityReport } from '../utils/navigation/simulatorReachability.js';
import { CollapsibleReport } from './CollapsibleReport.js';

export interface SimulatorReachabilityReportProps {
    report: ReachabilityReport;
    /** Optional class for the container. */
    className?: string;
    defaultExpanded?: boolean;
}

function Line({ label, value }: Readonly<{ label: string; value: string | string[] }>) {
    const text = Array.isArray(value) ? value.join(', ') || '—' : value;
    return (
        <div className={SIM_TEXT_SM}>
            <span className={SIM_MUTED}>{label}:</span>{' '}
            <span className={SIM_TEXT_BODY}>{text}</span>
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
    if (isRecord(value)) {
        if (typeof value.app === 'string' || typeof value.screen === 'string') {
            return trimSlashes(
                `${formatUnknownValue(value.app)}/${formatUnknownValue(value.screen)}`,
            );
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
    const screenLocale = useSimulatorLocale();

    const {
        entryApp,
        reachableApps,
        reachableScreens,
        reachableEntities,
        unreachable,
        browserHasCycle,
    } = report;

    const unreachableCount =
        unreachable.screens.length +
        unreachable.contacts.length +
        unreachable.inboxMessageIds.length +
        unreachable.browserPageIds.length;
    const hasUnreachable = unreachableCount > 0;

    return (
        <CollapsibleReport
            testId='simulator-reachability-report'
            title={
                <>
                    {screenLocale.t('screen.simulatorReachabilityReport.reachability')}
                    {hasUnreachable
                        ? screenLocale.t('screen.simulatorReachabilityReport.value1.unreachable', {
                              value1: String(unreachableCount),
                          })
                        : ''}
                </>
            }
            className={className}
            defaultExpanded={defaultExpanded}
        >
            <Line
                label={screenLocale.t('screen.simulatorReachabilityReport.entry.app')}
                value={entryApp ?? '—'}
            />
            <Line
                label={screenLocale.t('screen.simulatorReachabilityReport.reachable.apps')}
                value={reachableApps}
            />
            {reachableApps.map((app) => {
                const screens = reachableScreens[app];
                if (screens.length === 0) return null;
                return (
                    <Line
                        key={app}
                        label={screenLocale.t('screen.simulatorReachabilityReport.value1.screens', {
                            value1: String(app),
                        })}
                        value={screens}
                    />
                );
            })}
            {(reachableEntities.contacts.length > 0 ||
                reachableEntities.inboxMessageIds.length > 0 ||
                reachableEntities.browserPageIds.length > 0) && (
                <>
                    {reachableEntities.contacts.length > 0 && (
                        <Line
                            label={screenLocale.t(
                                'screen.simulatorReachabilityReport.reachable.contacts',
                            )}
                            value={reachableEntities.contacts}
                        />
                    )}
                    {reachableEntities.inboxMessageIds.length > 0 && (
                        <Line
                            label={screenLocale.t(
                                'screen.simulatorReachabilityReport.reachable.inbox',
                            )}
                            value={reachableEntities.inboxMessageIds}
                        />
                    )}
                    {reachableEntities.browserPageIds.length > 0 && (
                        <Line
                            label={screenLocale.t(
                                'screen.simulatorReachabilityReport.reachable.pages',
                            )}
                            value={reachableEntities.browserPageIds}
                        />
                    )}
                </>
            )}
            {hasUnreachable && (
                <div className={joinClasses(simSpacing.mt2, simSpacing.pt2, SIM_BORDER_TOP)}>
                    <span className={joinClasses(SIM_MUTED, SIM_TEXT_SEMIBOLD)}>
                        {screenLocale.t('screen.simulatorReachabilityReport.unreachable')}
                    </span>
                    {unreachable.screens.length > 0 && (
                        <div className={simSpacing.mt1}>
                            {screenLocale.t('screen.simulatorReachabilityReport.screens')}
                            {unreachable.screens.map((s) => formatScreenRef(s)).join(', ')}
                        </div>
                    )}
                    {unreachable.contacts.length > 0 && (
                        <div>
                            {screenLocale.t('screen.simulatorReachabilityReport.contacts')}
                            {unreachable.contacts.join(', ')}
                        </div>
                    )}
                    {unreachable.inboxMessageIds.length > 0 && (
                        <div>
                            {screenLocale.t('screen.simulatorReachabilityReport.inbox')}
                            {unreachable.inboxMessageIds.join(', ')}
                        </div>
                    )}
                    {unreachable.browserPageIds.length > 0 && (
                        <div>
                            {screenLocale.t('screen.simulatorReachabilityReport.pages')}
                            {unreachable.browserPageIds.join(', ')}
                        </div>
                    )}
                </div>
            )}
            {browserHasCycle && (
                <div className={joinClasses(simSpacing.mt2, SIM_TEXT_WARNING)}>
                    {screenLocale.t(
                        'screen.simulatorReachabilityReport.browser.navigation.has.a.cycle.e.g.a.b.a',
                    )}
                </div>
            )}
        </CollapsibleReport>
    );
}
