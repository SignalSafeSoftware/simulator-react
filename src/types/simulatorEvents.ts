/**
 * Simulator interaction event contract (normalized).
 * Emitted for analytics, debugging, and scenario orchestration. TreeSpec owns meaning/outcomes.
 *
 * Normalized contract — every event includes:
 *   - event type: `kind` (required)
 *   - template/session context: `template_id`, `template_key`, `run_id`, `attempt_id` when available (optional, flat)
 *   - app: `app` (required)
 *   - screen: `screen` (required)
 *   - action key: `action_key` when the interaction targets a specific entity (optional)
 *   - metadata: `metadata` for extra payload (optional; consistent object, no ad hoc top-level fields per app)
 *   - timestamp: `timestamp` ISO string (required)
 */

/** High-value event kinds the simulator can emit (event type vocabulary). */
export type SimulatorEventKind =
    | 'app_opened'
    | 'screen_viewed'
    | 'thread_opened'
    | 'email_opened'
    | 'contact_opened'
    | 'search_performed'
    | 'link_clicked'
    | 'attachment_opened'
    | 'attachment_downloaded'
    | 'call_answered'
    | 'call_ignored'
    | 'dial_started'
    | 'form_submitted'
    | 'message_sent'
    | 'button_clicked'
    | 'page_viewed'
    | 'store_opened'
    | 'settings_opened'
    | 'report_clicked'
    | 'download_clicked'
    | 'check_contact_clicked'
    | 'voicemail_opened'
    | 'directory_entry_viewed';

/** Metadata payload: extra data for the host; keys are stable (e.g. messageId, threadId, href). No per-app ad hoc top-level fields. */
export type SimulatorEventMetadata = Record<string, unknown>;

/**
 * Normalized interaction event. All events use this single shape; no app-specific event types.
 */
export interface SimulatorInteractionEvent {
    /** Event type (required). */
    kind: SimulatorEventKind;
    /** App where the interaction occurred or resulting app for nav (required). */
    app: string;
    /** Screen within that app (required). */
    screen: string;
    /** Action target id when relevant (e.g. messageId, threadId, href, pageId) (optional). */
    action_key?: string;
    /** Template/session identifiers when available (optional). */
    template_id?: number | null;
    template_key?: string | null;
    run_id?: number | null;
    attempt_id?: string | null;
    /** Extra payload; use consistent keys (optional). */
    metadata?: SimulatorEventMetadata;
    /** ISO timestamp when the event was emitted (required). */
    timestamp: string;
}
