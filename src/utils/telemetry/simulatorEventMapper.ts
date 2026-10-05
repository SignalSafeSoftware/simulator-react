import { SimulatorEventKind, type SimulatorInteractionEvent } from '../../types/simulatorEvents.js';
import { SimulatorActionType } from './simulatorActionTaxonomy.js';
import { isSimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
/**
 * Maps simulator actions to normalized interaction events.
 * Single event shape: kind, app, screen, session context, action_key when relevant, metadata.
 */

import {
    getCurrentScreenForApp,
    type SimulatorAction,
    type SimulatorViewState,
    type SimulatorTemplatePayload,
} from '../../types/session.js';

function getCurrentScreen(view: SimulatorViewState, app: string): string {
    return isSimulatorApp(app) ? getCurrentScreenForApp(view, app) : '';
}

/** Session identity fields required by the interaction telemetry contract. */
function getSessionContext(
    payload: SimulatorTemplatePayload | null,
): Pick<SimulatorInteractionEvent, 'template_id' | 'template_key' | 'run_id' | 'attempt_id'> {
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
    value: number | null | undefined,
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
    overrides: Partial<SimulatorInteractionEvent> = {},
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
    payload: SimulatorTemplatePayload | null,
): SimulatorInteractionEvent | null {
    const app = view.activeApp;
    const screen = getCurrentScreen(view, app);

    switch (action.type) {
        case SimulatorActionType.OpenEmail:
            return baseEvent(SimulatorEventKind.EmailOpened, view, payload, {
                action_key: action.messageId,
                metadata: { messageId: action.messageId },
            });
        case SimulatorActionType.OpenThread:
            return baseEvent(SimulatorEventKind.ThreadOpened, view, payload, {
                action_key: action.threadId,
                metadata: { threadId: action.threadId },
            });
        case SimulatorActionType.OpenContact:
            return baseEvent(SimulatorEventKind.ContactOpened, view, payload, {
                action_key: action.contactId,
                metadata: { contactId: action.contactId },
            });
        case SimulatorActionType.ClickLink:
            return baseEvent(SimulatorEventKind.LinkClicked, view, payload, {
                action_key: action.href ?? buildIndexedActionKey('link', action.linkIndex),
                metadata: { href: action.href, linkIndex: action.linkIndex, pageId: action.pageId },
            });
        case SimulatorActionType.OpenAttachment:
            return baseEvent(SimulatorEventKind.AttachmentOpened, view, payload, {
                action_key: buildIndexedActionKey('attachment', action.attachmentIndex),
                metadata: { attachmentIndex: action.attachmentIndex },
            });
        case SimulatorActionType.DownloadAttachment:
            return baseEvent(SimulatorEventKind.AttachmentDownloaded, view, payload, {
                action_key: buildIndexedActionKey('attachment', action.attachmentIndex),
                metadata: { attachmentIndex: action.attachmentIndex },
            });
        case SimulatorActionType.AnswerCall:
            return baseEvent(SimulatorEventKind.CallAnswered, view, payload, {
                metadata: { choiceIndex: action.choiceIndex },
            });
        case SimulatorActionType.IgnoreCall:
            return baseEvent(SimulatorEventKind.CallIgnored, view, payload);
        case SimulatorActionType.DialPhone:
            return baseEvent(SimulatorEventKind.DialStarted, view, payload, {
                action_key: action.dialedNumber,
                metadata: { dialedNumber: action.dialedNumber },
            });
        case SimulatorActionType.SubmitForm:
            return baseEvent(SimulatorEventKind.FormSubmitted, view, payload, {
                metadata: { submitMetadata: action.submitMetadata },
            });
        case SimulatorActionType.SendReply:
            return baseEvent(SimulatorEventKind.MessageSent, view, payload, {
                metadata: { replyText: action.replyText },
            });
        case SimulatorActionType.OpenPage:
            return baseEvent(SimulatorEventKind.PageViewed, view, payload, {
                action_key: action.pageId,
                screen: action.pageId ?? screen,
                metadata: { pageId: action.pageId },
            });
        case SimulatorActionType.OpenVoicemail:
            return baseEvent(SimulatorEventKind.VoicemailOpened, view, payload);
        case SimulatorActionType.OpenStore:
            return baseEvent(SimulatorEventKind.StoreOpened, view, payload);
        case SimulatorActionType.OpenSettings:
            return baseEvent(SimulatorEventKind.SettingsOpened, view, payload);
        case SimulatorActionType.Report:
            return baseEvent(SimulatorEventKind.ReportClicked, view, payload);
        case SimulatorActionType.DownloadClick:
            return baseEvent(SimulatorEventKind.DownloadClicked, view, payload, {
                action_key: action.downloadTarget,
                metadata: { downloadTarget: action.downloadTarget },
            });
        case SimulatorActionType.CheckContact:
        case SimulatorActionType.CheckContacts:
            return baseEvent(SimulatorEventKind.CheckContactClicked, view, payload);
        case SimulatorActionType.ViewDirectoryEntry:
            return baseEvent(SimulatorEventKind.DirectoryEntryViewed, view, payload, {
                action_key: action.entryId,
                metadata: { entryId: action.entryId },
            });
        case SimulatorActionType.SearchContacts:
            return baseEvent(SimulatorEventKind.SearchPerformed, view, payload, {
                metadata: { query: action.query },
            });
        case SimulatorActionType.NavigateScreen:
        case SimulatorActionType.OpenApp:
        case SimulatorActionType.SwitchChannel:
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
    payload: SimulatorTemplatePayload | null,
): SimulatorInteractionEvent {
    const screen = getCurrentScreen(view, newApp);
    return baseEvent(SimulatorEventKind.AppOpened, view, payload, { app: newApp, screen });
}

/**
 * Build screen_viewed event when user navigates to a screen within an app.
 */
export function screenViewedEvent(
    app: string,
    screen: string,
    view: SimulatorViewState,
    payload: SimulatorTemplatePayload | null,
): SimulatorInteractionEvent {
    return baseEvent(SimulatorEventKind.ScreenViewed, view, payload, { app, screen });
}
