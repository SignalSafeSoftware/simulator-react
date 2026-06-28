/**
 * Structured author preview report: entry point, apps, counts, key actions, validation/lint.
 * Shown in admin/workspace preview only; compact and readable.
 */
import { Fragment, isValidElement, useId, useState } from 'react';
import {
    SimulatorCard,
    SimulatorCardBody,
    SimulatorCardHeader,
    SimulatorCollapse,
} from '../ui/primitives.js';
import { simSpacing } from '../simulatorStyles.js';
import { SIM_MUTED, joinClasses, simBtnToneClass, SIM_BORDER_TOP } from '../ui/simulatorClasses.js';
import type { SimulatorPreviewReport } from '../utils/simulatorPreviewReport.js';

export interface SimulatorAuthorPreviewReportProps {
    report: SimulatorPreviewReport;
    /** Optional class for the container. */
    className?: string;
    defaultExpanded?: boolean;
}

function isPreviewPrimitive(value: React.ReactNode): value is string | number | boolean {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function previewKeyBase(value: React.ReactNode): string {
    if (isPreviewPrimitive(value)) {
        return String(value);
    }
    if (value == null) {
        return 'empty';
    }
    if (isValidElement(value)) {
        if (value.key == null) {
            return 'element';
        }
        return String(value.key);
    }
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value) ?? 'object';
        } catch {
            return 'object';
        }
    }
    return 'unknown';
}

function withStablePreviewKeys(values: React.ReactNode[]): Array<{ key: string; value: React.ReactNode }> {
    const counts = new Map<string, number>();
    return values.map((value) => {
        const base = previewKeyBase(value);
        const nextCount = (counts.get(base) ?? 0) + 1;
        counts.set(base, nextCount);
        return { key: `${base}-${nextCount}`, value };
    });
}

function formatPreviewValue(value: React.ReactNode): React.ReactNode {
    if (value == null || isPreviewPrimitive(value)) {
        return value;
    }
    if (isValidElement(value)) {
        return value;
    }
    if (Array.isArray(value)) {
        const items = value.map((item) => formatPreviewValue(item));
        if (items.every(isPreviewPrimitive)) {
            return items.join(', ');
        }
        const keyedItems = withStablePreviewKeys(items);
        return (
            <>
                {keyedItems.map((item, index) => (
                    <Fragment key={item.key}>
                        {index > 0 ? ', ' : null}
                        {item.value}
                    </Fragment>
                ))}
            </>
        );
    }
    if (typeof value === 'object') {
        const maybeEntryPoint = value as { app?: unknown; screen?: unknown };
        const app = typeof maybeEntryPoint.app === 'string' ? maybeEntryPoint.app : '';
        const screen = typeof maybeEntryPoint.screen === 'string' ? maybeEntryPoint.screen : '';
        if (app !== '' || screen !== '') {
            return `${app} / ${screen}`.trim();
        }
        try {
            return JSON.stringify(value);
        } catch {
            return null;
        }
    }
    if (typeof value === 'bigint') {
        return value;
    }
    return null;
}

function positiveCountSummary(count: number, singular: string, plural: string): string | null {
    if (count === 0) {
        return null;
    }
    if (count === 1) {
        return `1 ${singular}`;
    }
    return `${count} ${plural}`;
}

function Line({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
    return (
        <div className="simulator-text--sm">
            <span className={SIM_MUTED}>{label}:</span>{' '}
            <span className="simulator-text--body">{formatPreviewValue(value)}</span>
        </div>
    );
}

export default function SimulatorAuthorPreviewReport({
    report,
    className,
    defaultExpanded = false,
}: Readonly<SimulatorAuthorPreviewReportProps>) {
    const bodyId = useId();
    const [open, setOpen] = useState(defaultExpanded);
    const {
        entryPoint,
        appsUsed,
        contactsCount,
        inboxCount,
        threadMessageCount,
        browserPagesCount,
        directoryCount,
        keyActions,
        validationOk,
        lintWarningCount,
        unreachableCount,
        browserHasCycle,
    } = report;

    const summary = [
        `${entryPoint.app}/${entryPoint.screen}`,
        positiveCountSummary(appsUsed.length, 'app', 'apps'),
        positiveCountSummary(contactsCount, 'contact', 'contacts'),
        inboxCount > 0 ? `${inboxCount} inbox` : null,
        threadMessageCount > 0 ? `${threadMessageCount} SMS` : null,
        positiveCountSummary(browserPagesCount, 'page', 'pages'),
        directoryCount > 0 ? `${directoryCount} directory` : null,
        lintWarningCount > 0 ? `${lintWarningCount} lint` : null,
        validationOk ? null : 'invalid',
    ]
        .filter(Boolean)
        .join(' · ');

    return (
        <SimulatorCard className={joinClasses(simSpacing.mb2, className)} data-testid="simulator-author-preview-report">
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
                    Template summary
                </button>
                <span className={joinClasses(SIM_MUTED, 'simulator-inline-gap')}>— {summary}</span>
            </SimulatorCardHeader>
            <SimulatorCollapse open={open}>
                <SimulatorCardBody id={bodyId} className={joinClasses('simulator-text--sm', simSpacing.py2, simSpacing.px2)}>
                    <Line label="Entry" value={`${entryPoint.app} / ${entryPoint.screen}`} />
                    <Line label="Apps used" value={appsUsed.join(', ') || '—'} />
                    <Line label="Contacts" value={String(contactsCount)} />
                    <Line label="Inbox messages" value={String(inboxCount)} />
                    <Line label="SMS thread messages" value={String(threadMessageCount)} />
                    <Line label="Browser pages" value={String(browserPagesCount)} />
                    <Line label="Directory (trusted sources)" value={String(directoryCount)} />
                    <Line label="Key actions" value={keyActions.length > 0 ? keyActions : '—'} />
                    <div className={joinClasses(simSpacing.mt2, simSpacing.pt2, SIM_BORDER_TOP)}>
                        <Line
                            label="Validation"
                            value={
                                validationOk ? (
                                    <span className="simulator-text--success">OK</span>
                                ) : (
                                    <span className="simulator-text--danger">Failed</span>
                                )
                            }
                        />
                        <Line label="Lint warnings" value={String(lintWarningCount)} />
                        {unreachableCount > 0 && (
                            <Line label="Unreachable items" value={<span className="simulator-text--warning">{unreachableCount}</span>} />
                        )}
                        {browserHasCycle && (
                            <div className={joinClasses('simulator-text--warning', simSpacing.mt1)}>Browser has navigation cycle.</div>
                        )}
                    </div>
                </SimulatorCardBody>
            </SimulatorCollapse>
        </SimulatorCard>
    );
}
