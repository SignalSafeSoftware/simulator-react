/**
 * Session timeline view for dev/admin/QA: timestamp, app/screen, event type, target summary.
 * Uses normalized SimulatorInteractionEvent; no TreeSpec scoring. Shown only in preview/compact mode.
 */
import { useId, useState } from 'react';
import { Card, Collapse } from 'react-bootstrap';
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
    return labels[kind] ?? kind.split('_').join(' ');
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
        <Card className={`mb-2 ${className ?? ''}`.trim()} data-testid="simulator-session-timeline">
            <Card.Header className="py-1 px-2 small bg-light">
                <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none text-dark fw-medium"
                    onClick={() => setOpen((prev: boolean) => !prev)}
                    aria-expanded={open}
                    aria-controls={bodyId}
                >
                    Session timeline
                </button>
                <span className="text-muted ms-1">— {entries.length} event{entries.length === 1 ? '' : 's'}</span>
            </Card.Header>
            <Collapse in={open}>
                <Card.Body id={bodyId} className="small py-2 px-2">
                    {entries.length === 0 ? (
                        <div className="text-muted">No events yet. Interact with the simulator to see the timeline.</div>
                    ) : (
                        <ul className="list-unstyled mb-0">
                            {entries.map((entry, i) => {
                                const target = targetSummary(entry);
                                return (
                                    <li key={`${entry.timestamp}-${entry.kind}-${i}`} className="d-flex flex-wrap gap-1 align-items-baseline py-1 border-bottom border-light">
                                        <span className="text-muted" style={{ minWidth: '4.5rem' }}>
                                            {formatTime(entry.timestamp)}
                                        </span>
                                        <span className="text-dark">
                                            {entry.app}/{entry.screen}
                                        </span>
                                        <span className="fw-medium">{kindLabel(entry.kind)}</span>
                                        {target != null && (
                                            <span className="text-muted text-break">{target}</span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Card.Body>
            </Collapse>
        </Card>
    );
}
