/**
 * Session timeline view for dev/admin/QA: timestamp, app/screen, event type, target summary.
 * Uses normalized SimulatorInteractionEvent; no TreeSpec scoring. Shown only in preview/compact mode.
 */
import { useId, useState } from 'react';
import {
    SimulatorCard,
    SimulatorCardBody,
    SimulatorCardHeader,
    SimulatorCollapse,
} from '../ui/primitives';
import { simSpacing } from '../simulatorStyles';
import {
    joinClasses,
    SIM_FLEX,
    SIM_MUTED,
    simBtnToneClass,
} from '../ui/simulatorClasses';
import type { SimulatorInteractionEvent } from '../types/simulatorEvents';

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
        return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
        return iso.slice(11, 19) || iso;
    }
}

function kindLabel(kind: string): string {
    const labels: Record<string, string> = {
        session_started: 'Session started',
        app_opened: 'App opened',
        screen_viewed: 'Screen viewed',
        email_opened: 'Email opened',
        thread_opened: 'Thread opened',
        contact_opened: 'Contact opened',
        link_clicked: 'Link clicked',
        form_submitted: 'Form submitted',
        report_clicked: 'Report clicked',
        call_answered: 'Call answered',
        call_ignored: 'Call ignored',
        dial_started: 'Dial started',
        check_contact_clicked: 'Check contact',
        directory_entry_viewed: 'Directory viewed',
        page_viewed: 'Page viewed',
        voicemail_opened: 'Voicemail opened',
        open_store: 'Store opened',
        store_opened: 'Store opened',
        settings_opened: 'Settings opened',
        attachment_opened: 'Attachment opened',
        attachment_downloaded: 'Attachment downloaded',
        message_sent: 'Message sent',
        download_clicked: 'Download clicked',
        search_performed: 'Search',
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
    const bodyId = useId();
    const [open, setOpen] = useState(defaultExpanded);
    return (
        <SimulatorCard className={joinClasses(simSpacing.mb2, className)} data-testid="simulator-session-timeline">
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
                    Session timeline
                </button>
                <span className={joinClasses(SIM_MUTED, 'simulator-inline-gap')}>— {entries.length} event{entries.length === 1 ? '' : 's'}</span>
            </SimulatorCardHeader>
            <SimulatorCollapse open={open}>
                <SimulatorCardBody id={bodyId} className={joinClasses('simulator-text--sm', simSpacing.py2, simSpacing.px2)}>
                    {entries.length === 0 ? (
                        <div className={SIM_MUTED}>No events yet. Interact with the simulator to see the timeline.</div>
                    ) : (
                        <ul className={joinClasses('simulator-list--plain', simSpacing.mb0)}>
                            {entries.map((entry, i) => {
                                const target = targetSummary(entry);
                                return (
                                    <li
                                        key={`${entry.timestamp}-${entry.kind}-${i}`}
                                        className={joinClasses(
                                            SIM_FLEX,
                                            'simulator-flex--wrap',
                                            'simulator-spacing--gap',
                                            'simulator-flex--align-baseline',
                                            simSpacing.py1,
                                            'simulator-border simulator-border--bottom',
                                            'simulator-border--light',
                                        )}
                                    >
                                        <span className={SIM_MUTED} style={{ minWidth: '4.5rem' }}>
                                            {formatTime(entry.timestamp)}
                                        </span>
                                        <span className="simulator-text--body">
                                            {entry.app}/{entry.screen}
                                        </span>
                                        <span className="simulator-text--semibold">{kindLabel(entry.kind)}</span>
                                        {target != null && (
                                            <span className={joinClasses(SIM_MUTED, 'simulator-text--break')}>{target}</span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </SimulatorCardBody>
            </SimulatorCollapse>
        </SimulatorCard>
    );
}
