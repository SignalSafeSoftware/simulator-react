/**
 * Preview-only fallback world: minimal placeholders so partial templates can preview.
 * Used when entry_point points at an app/screen but that slice is missing or empty.
 * Does not hide validation errors: call only after payload has passed validation.
 * Simulator-scoped; not used in run or production paths.
 */

import type {
    SimulatorTemplatePayload,
    SimulatorEmailPayload,
    SimulatorInboxRow,
    SimulatorSmsPayload,
    SimulatorBrowserPayload,
    SimulatorBrowserPage,
    SimulatorPhonePayload,
} from '../types/session';
import type { SimulatorEntryPoint } from '../types/portableSimulator';

/** Placeholder id prefix so content can be recognized as fallback (e.g. for a badge or banner). */
export const PREVIEW_PLACEHOLDER_ID_PREFIX = '__preview_placeholder';

const PLACEHOLDER_LABEL = '[Preview placeholder – add content in simulator_json]';

function needsEmailFallback(entry: SimulatorEntryPoint | null, email: SimulatorEmailPayload | null): boolean {
    if (entry?.app !== 'email') return false;
    if (email == null) return true;
    if (entry.screen === 'detail') {
        const hasDetail = email.selectedMessage != null || (email.inbox?.length ?? 0) > 0;
        return !hasDetail;
    }
    return (email.inbox?.length ?? 0) === 0;
}

function buildEmailFallback(): SimulatorEmailPayload {
    const id = `${PREVIEW_PLACEHOLDER_ID_PREFIX}_email`;
    const row: SimulatorInboxRow = {
        id,
        subject: PLACEHOLDER_LABEL,
        from: 'preview@example',
        snippet: 'Add email content in simulator_json.',
    };
    return {
        inbox: [row],
        selectedMessage: {
            subject: PLACEHOLDER_LABEL,
            from: 'preview@example',
            body: 'Add email content in simulator_json to replace this placeholder.',
            from_display_name: undefined,
            to: undefined,
            cc: undefined,
            date_at: undefined,
            unread: undefined,
            reply_to: undefined,
            return_path: undefined,
            links: [],
            attachment_name: undefined,
            attachment_type: undefined,
            attachment_behavior: undefined,
        },
        selectedMessageId: id,
    };
}

function needsMessagesFallback(entry: SimulatorEntryPoint | null, sms: SimulatorSmsPayload | null): boolean {
    if (entry?.app !== 'messages') return false;
    if (sms == null) return true;
    if (entry.screen === 'thread_detail') {
        return !sms.thread?.messages?.length;
    }
    return true;
}

function buildSmsFallback(): SimulatorSmsPayload {
    return {
        thread: {
            messages: [
                { from: 'them', text: PLACEHOLDER_LABEL, delay_seconds: 0 },
            ],
            sender_display_name: undefined,
            sender_number: undefined,
            last_at: undefined,
            unread: false,
        },
        visibleMessageCount: 0,
    };
}

function needsBrowserFallback(entry: SimulatorEntryPoint | null, browser: SimulatorBrowserPayload | null): boolean {
    if (entry?.app !== 'internet') return false;
    if (browser == null) return true;
    const pages = browser.pages ?? [];
    const screen = entry.screen ?? 'landing';
    const hasPage = pages.some((p) => p?.id === screen);
    return pages.length === 0 || !hasPage;
}

function buildBrowserFallback(entryScreen: string): SimulatorBrowserPayload {
    const id = entryScreen && entryScreen !== 'landing' ? entryScreen : `${PREVIEW_PLACEHOLDER_ID_PREFIX}_landing`;
    const page: SimulatorBrowserPage = {
        id,
        url: 'https://example.com/',
        title: PLACEHOLDER_LABEL,
        layout: 'content',
        content: 'Add browser.pages in simulator_json to replace this placeholder.',
    };
    return {
        pages: [page],
        defaultPageId: id,
    };
}

function needsPhoneFallback(entry: SimulatorEntryPoint | null, phone: SimulatorPhonePayload | null): boolean {
    if (entry?.app !== 'phone') return false;
    if (entry.screen === 'incoming_call' && phone?.content == null) return true;
    return false;
}

function buildPhoneFallback(): SimulatorPhonePayload {
    return {
        content: {
            transcript: PLACEHOLDER_LABEL,
            choices: [],
            phone_number: '',
            caller_name: undefined,
            caller_title: undefined,
            avatar_url: undefined,
        },
        chosenIndex: null,
        callHistory: undefined,
        voicemailTranscript: undefined,
        voicemailCallerName: undefined,
        voicemailTimestamp: undefined,
    };
}

/**
 * Apply minimal preview fallbacks when entry_point targets an app/screen that has no content.
 * Call only in preview mode, after validation. Does not modify payload when no fallback is needed.
 * Returns the payload (possibly with one or more slices filled) and whether any fallback was applied.
 */
export function applyPreviewFallback(
    payload: SimulatorTemplatePayload
): { payload: SimulatorTemplatePayload; fallbackApplied: boolean } {
    const entry = payload.entryPoint ?? null;
    let next = payload;
    let applied = false;

    if (needsEmailFallback(entry, next.email)) {
        next = { ...next, email: buildEmailFallback() };
        applied = true;
    }
    if (needsMessagesFallback(entry, next.sms)) {
        next = { ...next, sms: buildSmsFallback() };
        applied = true;
    }
    if (needsBrowserFallback(entry, next.browser)) {
        const screen = entry?.screen ?? 'landing';
        next = { ...next, browser: buildBrowserFallback(screen) };
        applied = true;
    }
    if (needsPhoneFallback(entry, next.phone)) {
        next = { ...next, phone: buildPhoneFallback() };
        applied = true;
    }

    return { payload: next, fallbackApplied: applied };
}
