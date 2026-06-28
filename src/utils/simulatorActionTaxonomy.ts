/**
 * Canonical simulator action taxonomy: type literals, categories, and validation.
 * Single source of truth for which actions exist and how they are grouped.
 * Simulator-scoped only; no TreeSpec outcome semantics.
 *
 * @see docs/simulator/simulator-runtime-integration.md (§ Action taxonomy)
 */

import type { SimulatorAction } from '../types/session.js';

// -----------------------------------------------------------------------------
// Canonical action type list (must match SimulatorAction union in session.ts)
// -----------------------------------------------------------------------------

export const SIMULATOR_ACTION_TYPES = [
    'navigate_screen',
    'open_app',
    'open_contact',
    'open_thread',
    'open_email',
    'open_page',
    'submit_form',
    'answer_call',
    'ignore_call',
    'search_contacts',
    'click_link',
    'open_attachment',
    'download_attachment',
    'report',
    'check_contact',
    'check_contacts',
    'send_reply',
    'dial_phone',
    'open_voicemail',
    'open_store',
    'open_settings',
    'download_click',
    'switch_channel',
    'view_directory_entry',
] as const;

export type SimulatorActionType = (typeof SIMULATOR_ACTION_TYPES)[number];

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

export type SimulatorActionCategory = (typeof SIMULATOR_ACTION_CATEGORY)[keyof typeof SIMULATOR_ACTION_CATEGORY];

export const SIMULATOR_ACTION_CATEGORIES: Record<SimulatorActionType, SimulatorActionCategory> = {
    navigate_screen: SIMULATOR_ACTION_CATEGORY.LOCAL_NAVIGATION,
    open_app: SIMULATOR_ACTION_CATEGORY.APP_SWITCHING,
    switch_channel: SIMULATOR_ACTION_CATEGORY.APP_SWITCHING,
    open_contact: SIMULATOR_ACTION_CATEGORY.OPEN_ENTITY,
    open_thread: SIMULATOR_ACTION_CATEGORY.OPEN_ENTITY,
    open_email: SIMULATOR_ACTION_CATEGORY.OPEN_ENTITY,
    open_page: SIMULATOR_ACTION_CATEGORY.OPEN_ENTITY,
    click_link: SIMULATOR_ACTION_CATEGORY.BROWSER_PAGE,
    submit_form: SIMULATOR_ACTION_CATEGORY.FORM_SUBMISSION,
    answer_call: SIMULATOR_ACTION_CATEGORY.CALL_HANDLING,
    ignore_call: SIMULATOR_ACTION_CATEGORY.CALL_HANDLING,
    dial_phone: SIMULATOR_ACTION_CATEGORY.CALL_HANDLING,
    open_voicemail: SIMULATOR_ACTION_CATEGORY.CALL_HANDLING,
    search_contacts: SIMULATOR_ACTION_CATEGORY.SEARCH_VERIFICATION,
    check_contact: SIMULATOR_ACTION_CATEGORY.SEARCH_VERIFICATION,
    check_contacts: SIMULATOR_ACTION_CATEGORY.SEARCH_VERIFICATION,
    view_directory_entry: SIMULATOR_ACTION_CATEGORY.SEARCH_VERIFICATION,
    open_attachment: SIMULATOR_ACTION_CATEGORY.CONTENT_ACTION,
    download_attachment: SIMULATOR_ACTION_CATEGORY.CONTENT_ACTION,
    download_click: SIMULATOR_ACTION_CATEGORY.CONTENT_ACTION,
    send_reply: SIMULATOR_ACTION_CATEGORY.CONTENT_ACTION,
    report: SIMULATOR_ACTION_CATEGORY.CONTENT_ACTION,
    open_store: SIMULATOR_ACTION_CATEGORY.HOME_NAVIGATION,
    open_settings: SIMULATOR_ACTION_CATEGORY.HOME_NAVIGATION,
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
        case 'navigate_screen':
            return typeof obj.app === 'string' && typeof obj.screen === 'string';
        case 'open_app':
            return typeof obj.app === 'string';
        case 'open_contact':
            return typeof obj.contactId === 'string';
        case 'open_thread':
            return typeof obj.threadId === 'string';
        case 'open_email':
            return typeof obj.messageId === 'string';
        case 'open_page':
            return typeof obj.pageId === 'string';
        case 'view_directory_entry':
            return typeof obj.entryId === 'string';
        case 'switch_channel':
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
