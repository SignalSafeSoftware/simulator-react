/**
 * Session timeline view for dev/admin/QA: timestamp, app/screen, event type, target summary.
 * Uses normalized SimulatorInteractionEvent; no TreeSpec scoring. Shown only in preview/compact mode.
 */
import {
    SIM_BORDER_BOTTOM,
    SIM_FLEX,
    SIM_FLEX_WRAP,
    SIM_LIST_PLAIN,
    SIM_MUTED,
    SIM_TEXT_BODY,
    SIM_TEXT_BREAK,
    SIM_TEXT_SEMIBOLD,
    joinClasses,
} from '../ui/styles/simulatorClasses.js';
import { useSimulatorLocale } from '../i18n/SimulatorLocale.js';
import { simSpacing } from '../simulatorStyles.js';
import { type SimulatorInteractionEvent } from '../types/simulatorEvents.js';
import { CollapsibleReport } from './CollapsibleReport.js';

/** Synthetic entry for "session started" (not part of API event contract). */
export interface SessionStartedEntry {
    kind: 'session_started';
    timestamp: string;
    app: string;
    screen: string;
}

export type TimelineEntry = SimulatorInteractionEvent | SessionStartedEntry;

function isSessionStarted(e: TimelineEntry): e is SessionStartedEntry {
    return e.kind === 'session_started';
}

function formatTime(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    } catch {
        return iso.slice(11, 19) || iso;
    }
}

function kindLabel(kind: string, t: ReturnType<typeof useSimulatorLocale>['t']): string {
    const labels: Record<string, string> = {
        session_started: t('copy.SimulatorSessionTimeline.session.started'),
        app_opened: t('copy.SimulatorSessionTimeline.app.opened'),
        screen_viewed: t('copy.SimulatorSessionTimeline.screen.viewed'),
        email_opened: t('copy.SimulatorSessionTimeline.email.opened'),
        thread_opened: t('copy.SimulatorSessionTimeline.thread.opened'),
        contact_opened: t('copy.SimulatorSessionTimeline.contact.opened'),
        link_clicked: t('copy.SimulatorSessionTimeline.link.clicked'),
        form_submitted: t('copy.SimulatorSessionTimeline.form.submitted'),
        report_clicked: t('copy.SimulatorSessionTimeline.report.clicked'),
        call_answered: t('copy.SimulatorSessionTimeline.call.answered'),
        call_ignored: t('copy.SimulatorSessionTimeline.call.ignored'),
        dial_started: t('copy.SimulatorSessionTimeline.dial.started'),
        check_contact_clicked: t('copy.SimulatorSessionTimeline.check.contact'),
        directory_entry_viewed: t('copy.SimulatorSessionTimeline.directory.viewed'),
        page_viewed: t('copy.SimulatorSessionTimeline.page.viewed'),
        voicemail_opened: t('copy.SimulatorSessionTimeline.voicemail.opened'),
        open_store: t('copy.SimulatorSessionTimeline.store.opened'),
        store_opened: t('copy.SimulatorSessionTimeline.store.opened'),
        settings_opened: t('copy.SimulatorSessionTimeline.settings.opened'),
        attachment_opened: t('copy.SimulatorSessionTimeline.attachment.opened'),
        attachment_downloaded: t('copy.SimulatorSessionTimeline.attachment.downloaded'),
        message_sent: t('copy.SimulatorSessionTimeline.message.sent'),
        download_clicked: t('copy.SimulatorSessionTimeline.download.clicked'),
        search_performed: t('copy.SimulatorSessionTimeline.search.performed'),
    };
    return labels[kind] ?? kind.replaceAll('_', ' ');
}

function metadataText(value: unknown): string | null {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return null;
}

function targetSummary(entry: TimelineEntry): string | null {
    if (isSessionStarted(entry)) return null;
    if (entry.action_key) return entry.action_key;

    const meta = entry.metadata ?? {};
    const href = metadataText(meta.href);
    const query = metadataText(meta.query);

    return (
        metadataText(meta.messageId) ??
        metadataText(meta.threadId) ??
        summarizeHref(href) ??
        metadataText(meta.pageId) ??
        metadataText(meta.contactId) ??
        metadataText(meta.entryId) ??
        metadataText(meta.dialedNumber) ??
        formatQuery(query)
    );
}

function summarizeHref(href: string | null): string | null {
    if (href == null) {
        return null;
    }
    return href.length > 40 ? `${href.slice(0, 40)}…` : href;
}

function formatQuery(query: string | null): string | null {
    if (query == null) {
        return null;
    }
    return `"${query}"`;
}

export interface SimulatorSessionTimelineProps {
    entries: TimelineEntry[];
    /** Optional class for the container. */
    className?: string;
    defaultExpanded?: boolean;
}

export default function SimulatorSessionTimeline({
    entries,
    className,
    defaultExpanded = false,
}: Readonly<SimulatorSessionTimelineProps>) {
    const screenLocale = useSimulatorLocale();

    return (
        <CollapsibleReport
            testId='simulator-session-timeline'
            title={screenLocale.t('screen.simulatorSessionTimeline.session.timeline')}
            summary={
                <>
                    — {entries.length}
                    {screenLocale.t('screen.simulatorSessionTimeline.event')}
                    {entries.length === 1
                        ? ''
                        : screenLocale.t('screen.simulatorSessionTimeline.s')}
                </>
            }
            className={className}
            defaultExpanded={defaultExpanded}
        >
            {entries.length === 0 ? (
                <div className={SIM_MUTED}>
                    {screenLocale.t(
                        'screen.simulatorSessionTimeline.no.events.yet.interact.with.the.simulator.to.see.t',
                    )}
                </div>
            ) : (
                <ul className={joinClasses(SIM_LIST_PLAIN, simSpacing.mb0)}>
                    {entries.map((entry, i) => {
                        const target = targetSummary(entry);
                        return (
                            <li
                                key={`${entry.timestamp}-${entry.kind}-${i}`}
                                className={joinClasses(
                                    SIM_FLEX,
                                    SIM_FLEX_WRAP,
                                    'simulator-spacing--gap',
                                    'simulator-flex--align-baseline',
                                    simSpacing.py1,
                                    SIM_BORDER_BOTTOM,
                                    'simulator-border--light',
                                )}
                            >
                                <span className={SIM_MUTED} style={{ minWidth: '4.5rem' }}>
                                    {formatTime(entry.timestamp)}
                                </span>
                                <span className={SIM_TEXT_BODY}>
                                    {entry.app}/{entry.screen}
                                </span>
                                <span className={SIM_TEXT_SEMIBOLD}>
                                    {kindLabel(entry.kind, screenLocale.t)}
                                </span>
                                {target != null && (
                                    <span className={joinClasses(SIM_MUTED, SIM_TEXT_BREAK)}>
                                        {target}
                                    </span>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </CollapsibleReport>
    );
}
