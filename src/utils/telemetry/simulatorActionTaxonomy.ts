/**
 * Canonical simulator action taxonomy: type literals, categories, and validation.
 * Single source of truth for which actions exist and how they are grouped.
 * Simulator-scoped only; no TreeSpec outcome semantics.
 *
 * @see docs/simulator/simulator-runtime-integration.md (§ Action taxonomy)
 */

import type { SimulatorAction } from '../../types/session.js';

// -----------------------------------------------------------------------------
// Canonical action type list (must match SimulatorAction union in session.ts)
// -----------------------------------------------------------------------------

export const SimulatorActionType = Object.freeze({
    NavigateScreen: 'navigate_screen',
    OpenApp: 'open_app',
    OpenContact: 'open_contact',
    OpenThread: 'open_thread',
    OpenEmail: 'open_email',
    OpenPage: 'open_page',
    SubmitForm: 'submit_form',
    AnswerCall: 'answer_call',
    IgnoreCall: 'ignore_call',
    SearchContacts: 'search_contacts',
    ClickLink: 'click_link',
    OpenAttachment: 'open_attachment',
    DownloadAttachment: 'download_attachment',
    Report: 'report',
    CheckContact: 'check_contact',
    CheckContacts: 'check_contacts',
    SendReply: 'send_reply',
    DialPhone: 'dial_phone',
    OpenVoicemail: 'open_voicemail',
    OpenStore: 'open_store',
    OpenSettings: 'open_settings',
    DownloadClick: 'download_click',
    SwitchChannel: 'switch_channel',
    ViewDirectoryEntry: 'view_directory_entry',
} as const);

export type SimulatorActionType = (typeof SimulatorActionType)[keyof typeof SimulatorActionType];

export const SIMULATOR_ACTION_TYPES: readonly SimulatorActionType[] =
    Object.values(SimulatorActionType);

// Compile-time exhaustiveness: taxonomy and SimulatorAction union must stay in sync.
type _UnionTypes = SimulatorAction['type'];
type _AssertTaxonomyExhaustive = _UnionTypes extends SimulatorActionType
    ? SimulatorActionType extends _UnionTypes
        ? unknown
        : never
    : never;
const _exhaustiveCheck: _AssertTaxonomyExhaustive = true;
Object.freeze([_exhaustiveCheck]);

// -----------------------------------------------------------------------------
// Categories (for docs, tooling, and validation)
// -----------------------------------------------------------------------------

export const SIMULATOR_ACTION_CATEGORY = {
    APP_SWITCHING: 'app_switching',
    LOCAL_NAVIGATION: 'local_navigation',
    OPEN_ENTITY: 'open_entity',
    BROWSER_PAGE: 'browser_page',
    FORM_SUBMISSION: 'form_submission',
    CALL_HANDLING: 'call_handling',
    SEARCH_VERIFICATION: 'search_verification',
    CONTENT_ACTION: 'content_action',
    HOME_NAVIGATION: 'home_navigation',
} as const;

export type SimulatorActionCategory =
    (typeof SIMULATOR_ACTION_CATEGORY)[keyof typeof SIMULATOR_ACTION_CATEGORY];

export const SIMULATOR_ACTION_CATEGORIES: Record<SimulatorActionType, SimulatorActionCategory> = {
    [SimulatorActionType.NavigateScreen]: SIMULATOR_ACTION_CATEGORY.LOCAL_NAVIGATION,
    [SimulatorActionType.OpenApp]: SIMULATOR_ACTION_CATEGORY.APP_SWITCHING,
    [SimulatorActionType.SwitchChannel]: SIMULATOR_ACTION_CATEGORY.APP_SWITCHING,
    [SimulatorActionType.OpenContact]: SIMULATOR_ACTION_CATEGORY.OPEN_ENTITY,
    [SimulatorActionType.OpenThread]: SIMULATOR_ACTION_CATEGORY.OPEN_ENTITY,
    [SimulatorActionType.OpenEmail]: SIMULATOR_ACTION_CATEGORY.OPEN_ENTITY,
    [SimulatorActionType.OpenPage]: SIMULATOR_ACTION_CATEGORY.OPEN_ENTITY,
    [SimulatorActionType.ClickLink]: SIMULATOR_ACTION_CATEGORY.BROWSER_PAGE,
    [SimulatorActionType.SubmitForm]: SIMULATOR_ACTION_CATEGORY.FORM_SUBMISSION,
    [SimulatorActionType.AnswerCall]: SIMULATOR_ACTION_CATEGORY.CALL_HANDLING,
    [SimulatorActionType.IgnoreCall]: SIMULATOR_ACTION_CATEGORY.CALL_HANDLING,
    [SimulatorActionType.DialPhone]: SIMULATOR_ACTION_CATEGORY.CALL_HANDLING,
    [SimulatorActionType.OpenVoicemail]: SIMULATOR_ACTION_CATEGORY.CALL_HANDLING,
    [SimulatorActionType.SearchContacts]: SIMULATOR_ACTION_CATEGORY.SEARCH_VERIFICATION,
    [SimulatorActionType.CheckContact]: SIMULATOR_ACTION_CATEGORY.SEARCH_VERIFICATION,
    [SimulatorActionType.CheckContacts]: SIMULATOR_ACTION_CATEGORY.SEARCH_VERIFICATION,
    [SimulatorActionType.ViewDirectoryEntry]: SIMULATOR_ACTION_CATEGORY.SEARCH_VERIFICATION,
    [SimulatorActionType.OpenAttachment]: SIMULATOR_ACTION_CATEGORY.CONTENT_ACTION,
    [SimulatorActionType.DownloadAttachment]: SIMULATOR_ACTION_CATEGORY.CONTENT_ACTION,
    [SimulatorActionType.DownloadClick]: SIMULATOR_ACTION_CATEGORY.CONTENT_ACTION,
    [SimulatorActionType.SendReply]: SIMULATOR_ACTION_CATEGORY.CONTENT_ACTION,
    [SimulatorActionType.Report]: SIMULATOR_ACTION_CATEGORY.CONTENT_ACTION,
    [SimulatorActionType.OpenStore]: SIMULATOR_ACTION_CATEGORY.HOME_NAVIGATION,
    [SimulatorActionType.OpenSettings]: SIMULATOR_ACTION_CATEGORY.HOME_NAVIGATION,
};

/** Get the category for an action type. */
export function getSimulatorActionCategory(type: SimulatorActionType): SimulatorActionCategory {
    return SIMULATOR_ACTION_CATEGORIES[type];
}

/** Type guard: true if string is a canonical action type. */
export function isSimulatorActionType(s: string): s is SimulatorActionType {
    return (SIMULATOR_ACTION_TYPES as readonly string[]).includes(s);
}

// -----------------------------------------------------------------------------
// Validation (payload shape per type)
// -----------------------------------------------------------------------------

function hasRequiredPayload(type: SimulatorActionType, obj: Record<string, unknown>): boolean {
    switch (type) {
        case SimulatorActionType.NavigateScreen:
            return typeof obj.app === 'string' && typeof obj.screen === 'string';
        case SimulatorActionType.OpenApp:
            return typeof obj.app === 'string';
        case SimulatorActionType.OpenContact:
            return typeof obj.contactId === 'string';
        case SimulatorActionType.OpenThread:
            return typeof obj.threadId === 'string';
        case SimulatorActionType.OpenEmail:
            return typeof obj.messageId === 'string';
        case SimulatorActionType.OpenPage:
            return typeof obj.pageId === 'string';
        case SimulatorActionType.ViewDirectoryEntry:
            return typeof obj.entryId === 'string';
        case SimulatorActionType.SwitchChannel:
            return typeof obj.channel === 'string';
        default:
            return true;
    }
}

/**
 * Validate that a value is a well-formed SimulatorAction (canonical type + required payload).
 * Use for host boundaries, serialization, or tests. Returns the value typed as SimulatorAction when true.
 */
export function validateSimulatorAction(obj: unknown): obj is SimulatorAction {
    if (obj == null || typeof obj !== 'object') return false;
    const o = obj as Record<string, unknown>;
    if (typeof o.type !== 'string') return false;
    if (!isSimulatorActionType(o.type)) return false;
    return hasRequiredPayload(o.type, o);
}
