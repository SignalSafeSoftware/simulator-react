/**
 * Maps simulator actions to normalized interaction events.
 * Single event shape: kind, app, screen, session context, action_key when relevant, metadata.
 */

import type { SimulatorAction, SimulatorViewState, SimulatorTemplatePayload } from '../types/session.js';
import type { SimulatorInteractionEvent, SimulatorEventKind } from '../types/simulatorEvents.js';

function getCurrentScreen(view: SimulatorViewState, app: string): string {
    switch (app) {
        case 'phone':
            return view.phone.screen;
        case 'email':
            return view.email.screen;
        case 'messages':
            return view.messages.screen;
        case 'internet':
            return view.internet.screen;
        case 'home':
            return view.home.screen;
        default:
            return '';
    }
}

/** Session context from payload (flat fields for compatibility). */
function getSessionContext(payload: SimulatorTemplatePayload | null): Pick<
    SimulatorInteractionEvent,
    'template_id' | 'template_key' | 'run_id' | 'attempt_id'
> {
    if (payload == null) return {};
    return {
        template_id: payload.templateId ?? undefined,
        template_key: payload.templateKey ?? undefined,
        run_id: payload.runId ?? undefined,
        attempt_id: stringifyOptionalValue(payload.attemptId),
    };
}

function stringifyOptionalValue(value: string | number | null | undefined): string | undefined {
    if (value == null) {
        return undefined;
    }
    return String(value);
}

function buildIndexedActionKey(
    prefix: string,
    value: number | null | undefined
): string | undefined {
    if (value == null) {
        return undefined;
    }
    return `${prefix}_${value}`;
}

/** Build a normalized event: required kind, app, screen, timestamp; optional session, action_key, metadata. */
function baseEvent(
    kind: SimulatorEventKind,
    view: SimulatorViewState,
    payload: SimulatorTemplatePayload | null,
    overrides: Partial<SimulatorInteractionEvent> = {}
): SimulatorInteractionEvent {
    const app = view.activeApp;
    const screen = getCurrentScreen(view, app);
    const session = getSessionContext(payload);
    return {
        kind,
        app,
        screen,
        ...session,
        timestamp: new Date().toISOString(),
        ...overrides,
    };
}

/**
 * Map a simulator action to a single interaction event, or null if no event should be emitted.
 */
export function actionToInteractionEvent(
    action: SimulatorAction,
    view: SimulatorViewState,
    payload: SimulatorTemplatePayload | null
): SimulatorInteractionEvent | null {
    const app = view.activeApp;
    const screen = getCurrentScreen(view, app);

    switch (action.type) {
        case 'open_email':
            return baseEvent('email_opened', view, payload, {
                action_key: action.messageId,
                metadata: { messageId: action.messageId },
            });
        case 'open_thread':
            return baseEvent('thread_opened', view, payload, {
                action_key: action.threadId,
                metadata: { threadId: action.threadId },
            });
        case 'open_contact':
            return baseEvent('contact_opened', view, payload, {
                action_key: action.contactId,
                metadata: { contactId: action.contactId },
            });
        case 'click_link':
            return baseEvent('link_clicked', view, payload, {
                action_key: action.href ?? buildIndexedActionKey('link', action.linkIndex),
                metadata: { href: action.href, linkIndex: action.linkIndex, pageId: action.pageId },
            });
        case 'open_attachment':
            return baseEvent('attachment_opened', view, payload, {
                action_key: buildIndexedActionKey('attachment', action.attachmentIndex),
                metadata: { attachmentIndex: action.attachmentIndex },
            });
        case 'download_attachment':
            return baseEvent('attachment_downloaded', view, payload, {
                action_key: buildIndexedActionKey('attachment', action.attachmentIndex),
                metadata: { attachmentIndex: action.attachmentIndex },
            });
        case 'answer_call':
            return baseEvent('call_answered', view, payload, {
                metadata: { choiceIndex: action.choiceIndex },
            });
        case 'ignore_call':
            return baseEvent('call_ignored', view, payload);
        case 'dial_phone':
            return baseEvent('dial_started', view, payload, {
                action_key: action.dialedNumber,
                metadata: { dialedNumber: action.dialedNumber },
            });
        case 'submit_form':
            return baseEvent('form_submitted', view, payload, {
                metadata: { submitMetadata: action.submitMetadata },
            });
        case 'send_reply':
            return baseEvent('message_sent', view, payload, {
                metadata: { replyText: action.replyText },
            });
        case 'open_page':
            return baseEvent('page_viewed', view, payload, {
                action_key: action.pageId,
                screen: action.pageId ?? screen,
                metadata: { pageId: action.pageId },
            });
        case 'open_voicemail':
            return baseEvent('voicemail_opened', view, payload);
        case 'open_store':
            return baseEvent('store_opened', view, payload);
        case 'open_settings':
            return baseEvent('settings_opened', view, payload);
        case 'report':
            return baseEvent('report_clicked', view, payload);
        case 'download_click':
            return baseEvent('download_clicked', view, payload, {
                action_key: action.downloadTarget,
                metadata: { downloadTarget: action.downloadTarget },
            });
        case 'check_contact':
        case 'check_contacts':
            return baseEvent('check_contact_clicked', view, payload);
        case 'view_directory_entry':
            return baseEvent('directory_entry_viewed', view, payload, {
                action_key: action.entryId,
                metadata: { entryId: action.entryId },
            });
        case 'search_contacts':
            return baseEvent('search_performed', view, payload, {
                metadata: { query: action.query },
            });
        case 'navigate_screen':
        case 'open_app':
        case 'switch_channel':
            return null;
        default:
            return null;
    }
}

/**
 * Build app_opened event when user switches app (e.g. via shell nav).
 */
export function appOpenedEvent(
    newApp: string,
    view: SimulatorViewState,
    payload: SimulatorTemplatePayload | null
): SimulatorInteractionEvent {
    const screen = getCurrentScreen(view, newApp);
    return baseEvent('app_opened', view, payload, { app: newApp, screen });
}

/**
 * Build screen_viewed event when user navigates to a screen within an app.
 */
export function screenViewedEvent(
    app: string,
    screen: string,
    view: SimulatorViewState,
    payload: SimulatorTemplatePayload | null
): SimulatorInteractionEvent {
    return baseEvent('screen_viewed', view, payload, { app, screen });
}
