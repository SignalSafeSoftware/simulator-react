import { useSimulatorLocale } from '../i18n/SimulatorLocale.js';
/**
 * Development/admin reachability report for simulator templates.
 * Shows which screens and entities are reachable from the entry flow.
 */
import { useId, useState } from 'react';
import {
    SimulatorCard,
    SimulatorCardBody,
    SimulatorCardHeader,
    SimulatorCollapse,
} from '../ui/primitives.js';
import { simSpacing } from '../simulatorStyles.js';
import { SIM_MUTED, joinClasses, simBtnToneClass, SIM_BORDER_TOP } from '../ui/simulatorClasses.js';
import type { ReachabilityReport } from '../utils/simulatorReachability.js';

export interface SimulatorReachabilityReportProps {
    report: ReachabilityReport;
    /** Optional class for the container. */
    className?: string;
    defaultExpanded?: boolean;
}

function Line({ label, value }: Readonly<{ label: string; value: string | string[] }>) {
    const text = Array.isArray(value) ? value.join(', ') || '—' : value;
    return (
        <div className="simulator-text--sm">
            <span className={SIM_MUTED}>{label}:</span>{' '}
            <span className="simulator-text--body">{text}</span>
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
    const screenLocale = useSimulatorLocale();

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
        <SimulatorCard
            className={joinClasses(simSpacing.mb2, className)}
            data-testid="simulator-reachability-report"
        >
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
                        simBtnToneClass('link'),
                        'simulator-btn--plain',
                        'simulator-text--semibold',
                        'simulator-text--body',
                    )}
                    onClick={() => setOpen((prev: boolean) => !prev)}
                    aria-expanded={open}
                    aria-controls={bodyId}
                >
                    {screenLocale.t('screen.simulatorReachabilityReport.reachability')}
                    {hasUnreachable
                        ? screenLocale.t('screen.simulatorReachabilityReport.value1.unreachable', {
                              value1: String(
                                  unreachable.screens.length +
                                      unreachable.contacts.length +
                                      unreachable.inboxMessageIds.length +
                                      unreachable.browserPageIds.length,
                              ),
                          })
                        : ''}
                </button>
            </SimulatorCardHeader>
            <SimulatorCollapse open={open}>
                <SimulatorCardBody
                    id={bodyId}
                    className={joinClasses('simulator-text--sm', simSpacing.py2, simSpacing.px2)}
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
                                label={screenLocale.t(
                                    'screen.simulatorReachabilityReport.value1.screens',
                                    { value1: String(app) },
                                )}
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
                        <div
                            className={joinClasses(simSpacing.mt2, simSpacing.pt2, SIM_BORDER_TOP)}
                        >
                            <span className={joinClasses(SIM_MUTED, 'simulator-text--semibold')}>
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
                        <div className={joinClasses(simSpacing.mt2, 'simulator-text--warning')}>
                            {screenLocale.t(
                                'screen.simulatorReachabilityReport.browser.navigation.has.a.cycle.e.g.a.b.a',
                            )}
                        </div>
                    )}
                </SimulatorCardBody>
            </SimulatorCollapse>
        </SimulatorCard>
    );
}
