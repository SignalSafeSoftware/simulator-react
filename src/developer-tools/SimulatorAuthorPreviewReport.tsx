/**
 * Structured author preview report: entry point, apps, counts, key actions, validation/lint.
 * Shown in admin/workspace preview only; compact and readable.
 */
import {
    SIM_BORDER_TOP,
    SIM_MUTED,
    SIM_TEXT_BODY,
    SIM_TEXT_DANGER,
    SIM_TEXT_SM,
    SIM_TEXT_WARNING,
    joinClasses,
} from '../ui/styles/simulatorClasses.js';
import { useSimulatorLocale } from '../i18n/SimulatorLocale.js';
import { Fragment, isValidElement } from 'react';
import { simSpacing } from '../simulatorStyles.js';
import { type SimulatorPreviewReport } from '../utils/preview/simulatorPreviewReport.js';
import { withStableKeys } from '../utils/lists/stableKeys.js';
import { CollapsibleReport } from './CollapsibleReport.js';

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
        const keyedItems = withStableKeys(items, previewKeyBase);
        return (
            <>
                {keyedItems.map(({ item, key }, index) => (
                    <Fragment key={key}>
                        {index > 0 ? ', ' : null}
                        {item}
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
        <div className={SIM_TEXT_SM}>
            <span className={SIM_MUTED}>{label}:</span>{' '}
            <span className={SIM_TEXT_BODY}>{formatPreviewValue(value)}</span>
        </div>
    );
}

export default function SimulatorAuthorPreviewReport({
    report,
    className,
    defaultExpanded = false,
}: Readonly<SimulatorAuthorPreviewReportProps>) {
    const screenLocale = useSimulatorLocale();

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
        <CollapsibleReport
            testId="simulator-author-preview-report"
            title={screenLocale.t('screen.simulatorAuthorPreviewReport.template.summary')}
            summary={<>— {summary}</>}
            className={className}
            defaultExpanded={defaultExpanded}
        >
            <Line
                label={screenLocale.t('screen.simulatorAuthorPreviewReport.entry')}
                value={`${entryPoint.app} / ${entryPoint.screen}`}
            />
            <Line
                label={screenLocale.t('screen.simulatorAuthorPreviewReport.apps.used')}
                value={appsUsed.join(', ') || '—'}
            />
            <Line
                label={screenLocale.t('screen.simulatorAuthorPreviewReport.contacts')}
                value={String(contactsCount)}
            />
            <Line
                label={screenLocale.t('screen.simulatorAuthorPreviewReport.inbox.messages')}
                value={String(inboxCount)}
            />
            <Line
                label={screenLocale.t('screen.simulatorAuthorPreviewReport.sms.thread.messages')}
                value={String(threadMessageCount)}
            />
            <Line
                label={screenLocale.t('screen.simulatorAuthorPreviewReport.browser.pages')}
                value={String(browserPagesCount)}
            />
            <Line
                label={screenLocale.t(
                    'screen.simulatorAuthorPreviewReport.directory.trusted.sources',
                )}
                value={String(directoryCount)}
            />
            <Line
                label={screenLocale.t('screen.simulatorAuthorPreviewReport.key.actions')}
                value={keyActions.length > 0 ? keyActions : '—'}
            />
            <div className={joinClasses(simSpacing.mt2, simSpacing.pt2, SIM_BORDER_TOP)}>
                <Line
                    label={screenLocale.t('screen.simulatorAuthorPreviewReport.validation')}
                    value={
                        validationOk ? (
                            <span className="simulator-text--success">
                                {screenLocale.t('screen.simulatorAuthorPreviewReport.ok')}
                            </span>
                        ) : (
                            <span className={SIM_TEXT_DANGER}>
                                {screenLocale.t('screen.simulatorAuthorPreviewReport.failed')}
                            </span>
                        )
                    }
                />
                <Line
                    label={screenLocale.t('screen.simulatorAuthorPreviewReport.lint.warnings')}
                    value={String(lintWarningCount)}
                />
                {unreachableCount > 0 && (
                    <Line
                        label={screenLocale.t(
                            'screen.simulatorAuthorPreviewReport.unreachable.items',
                        )}
                        value={<span className={SIM_TEXT_WARNING}>{unreachableCount}</span>}
                    />
                )}
                {browserHasCycle && (
                    <div className={joinClasses(SIM_TEXT_WARNING, simSpacing.mt1)}>
                        {screenLocale.t(
                            'screen.simulatorAuthorPreviewReport.browser.has.navigation.cycle',
                        )}
                    </div>
                )}
            </div>
        </CollapsibleReport>
    );
}
