import {
    BrowserLayout,
    DEFAULT_INTERNET_SCREEN,
    MessageSender,
    type SimulatorTemplatePayload,
    type SimulatorEmailPayload,
    type SimulatorInboxRow,
    type SimulatorSmsPayload,
    type SimulatorBrowserPayload,
    type SimulatorBrowserPage,
    type SimulatorPhonePayload,
} from '../../types/session.js';
import {
    SimulatorEmailScreenId,
    SimulatorMessagesScreenId,
    SimulatorPhoneScreenId,
    type SimulatorEntryPoint,
} from '@signalsafe/simulator-core/devicePayload';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import { englishLocale } from '../../i18n/englishLocale.js';
/**
 * Preview-only fallback world: minimal placeholders so partial templates can preview.
 * Used when entry_point points at an app/screen but that slice is missing or empty.
 * Does not hide validation errors: call only after payload has passed validation.
 * Simulator-scoped; not used in run or production paths.
 */

/** Placeholder id prefix so content can be recognized as fallback (e.g. for a badge or banner). */
export const PREVIEW_PLACEHOLDER_ID_PREFIX = '__preview_placeholder';

const PLACEHOLDER_LABEL = '[Preview placeholder – add content in simulator_json]';

function needsEmailFallback(
    entry: SimulatorEntryPoint | null,
    email: SimulatorEmailPayload | null,
): boolean {
    if (entry?.app !== SimulatorApp.Email) return false;
    if (email == null) return true;
    if (entry.screen === SimulatorEmailScreenId.Detail) {
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
        snippet: englishLocale.t('copy.previewFallbackWorld.add.email.content.in.simulator.json'),
    };
    return {
        inbox: [row],
        selectedMessage: {
            subject: PLACEHOLDER_LABEL,
            from: 'preview@example',
            body: englishLocale.t(
                'copy.previewFallbackWorld.add.email.content.in.simulator.json.to.replace.this.placeholder',
            ),
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

function needsMessagesFallback(
    entry: SimulatorEntryPoint | null,
    sms: SimulatorSmsPayload | null,
): boolean {
    if (entry?.app !== SimulatorApp.Messages) return false;
    if (sms == null) return true;
    if (entry.screen === SimulatorMessagesScreenId.ThreadDetail) {
        return !sms.thread?.messages?.length;
    }
    return true;
}

function buildSmsFallback(): SimulatorSmsPayload {
    return {
        thread: {
            messages: [{ from: MessageSender.Them, text: PLACEHOLDER_LABEL, delay_seconds: 0 }],
            sender_display_name: undefined,
            sender_number: undefined,
            last_at: undefined,
            unread: false,
        },
        visibleMessageCount: 0,
    };
}

function needsBrowserFallback(
    entry: SimulatorEntryPoint | null,
    browser: SimulatorBrowserPayload | null,
): boolean {
    if (entry?.app !== SimulatorApp.Internet) return false;
    if (browser == null) return true;
    const pages = browser.pages ?? [];
    const screen = entry.screen ?? DEFAULT_INTERNET_SCREEN;
    const hasPage = pages.some((p) => p?.id === screen);
    return pages.length === 0 || !hasPage;
}

function buildBrowserFallback(entryScreen: string): SimulatorBrowserPayload {
    const id =
        entryScreen && entryScreen !== DEFAULT_INTERNET_SCREEN
            ? entryScreen
            : `${PREVIEW_PLACEHOLDER_ID_PREFIX}_landing`;
    const page: SimulatorBrowserPage = {
        id,
        url: 'https://example.com/',
        title: PLACEHOLDER_LABEL,
        layout: BrowserLayout.Content,
        content: englishLocale.t(
            'copy.previewFallbackWorld.add.browser.pages.in.simulator.json.to.replace.this.placeholder',
        ),
    };
    return {
        pages: [page],
        defaultPageId: id,
    };
}

function needsPhoneFallback(
    entry: SimulatorEntryPoint | null,
    phone: SimulatorPhonePayload | null,
): boolean {
    if (entry?.app !== SimulatorApp.Phone) return false;
    if (entry.screen === SimulatorPhoneScreenId.IncomingCall && phone?.content == null) return true;
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
export function applyPreviewFallback(payload: SimulatorTemplatePayload): {
    payload: SimulatorTemplatePayload;
    fallbackApplied: boolean;
} {
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
        const screen = entry?.screen ?? DEFAULT_INTERNET_SCREEN;
        next = { ...next, browser: buildBrowserFallback(screen) };
        applied = true;
    }
    if (needsPhoneFallback(entry, next.phone)) {
        next = { ...next, phone: buildPhoneFallback() };
        applied = true;
    }

    return { payload: next, fallbackApplied: applied };
}
