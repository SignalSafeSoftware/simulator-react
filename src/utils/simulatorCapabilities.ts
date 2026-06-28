/**
 * Lightweight capability flags derived from simulator payload so the shell can
 * show/hide features predictably (e.g. no Store, no Dial, no voicemail).
 * Derived from data only; no separate entitlement system. Single source of truth
 * for "is this feature available in this template?"
 */

import type { SimulatorTemplatePayload } from '../types/session.js';

/** Per-app feature flags derived from payload. Used for nav/tab visibility and empty states. */
export interface SimulatorCapabilities {
    phone: {
        /** Show Dial tab (payload has phone app). */
        dial: boolean;
        /** Show voicemail row / screen (payload has voicemail transcript). */
        voicemail: boolean;
        /** Show Directory tab (payload has directory entries). */
        directory: boolean;
    };
    home: {
        /** Show Store tile and store screen (payload has featured apps). */
        store: boolean;
        /** Show Settings tile and settings screen (payload has settings sections). */
        settings: boolean;
    };
    /** Email has at least one message with an attachment (for future attachment UI toggles). */
    emailAttachments: boolean;
    /** At least one browser page has form fields (for future form-related UI). */
    browserForms: boolean;
}

function hasNonEmptyString(value: unknown): boolean {
    return typeof value === 'string' && value.trim() !== '';
}

function hasSelectedMessageAttachment(payload: SimulatorTemplatePayload): boolean {
    const selectedMessage = payload.email?.selectedMessage;
    if (selectedMessage == null || !('attachment_name' in selectedMessage)) {
        return false;
    }
    return hasNonEmptyString((selectedMessage as { attachment_name?: string }).attachment_name);
}

function hasInboxAttachment(payload: SimulatorTemplatePayload): boolean {
    const inbox = payload.email?.inbox;
    if (!Array.isArray(inbox)) {
        return false;
    }
    return inbox.some((row) => {
        if (!('attachment_name' in row)) {
            return false;
        }
        return hasNonEmptyString((row as { attachment_name?: string }).attachment_name);
    });
}

function hasEmailAttachments(payload: SimulatorTemplatePayload): boolean {
    return hasSelectedMessageAttachment(payload) || hasInboxAttachment(payload);
}

function hasBrowserForms(payload: SimulatorTemplatePayload): boolean {
    const pages = payload.browser?.pages;
    if (!Array.isArray(pages)) {
        return false;
    }
    return pages.some((page) => {
        const fields = (page as { formFields?: unknown[] }).formFields;
        return Array.isArray(fields) && fields.length > 0;
    });
}

/**
 * Derive capabilities from the current payload. Pure function; safe to call on every render.
 * Does not duplicate logic that views already do inline—this is the single place that defines
 * "is X available?" so the shell and views can use it consistently.
 */
export function getSimulatorCapabilities(payload: SimulatorTemplatePayload): SimulatorCapabilities {
    const phone = payload.phone;
    const hasPhone = phone != null;
    const directory = payload.directory;
    const hasDirectory = Array.isArray(directory) && directory.length > 0;
    const voicemailTranscript = phone?.voicemailTranscript;
    const hasVoicemail =
        typeof voicemailTranscript === 'string' && voicemailTranscript.trim().length > 0;

    const home = payload.home;
    const featuredApps = home?.featuredApps ?? [];
    const settingsSections = home?.settingsSections ?? [];
    const hasStore = featuredApps.length > 0;
    const hasSettings = settingsSections.length > 0;

    return {
        phone: {
            dial: hasPhone,
            voicemail: hasVoicemail,
            directory: hasDirectory,
        },
        home: {
            store: hasStore,
            settings: hasSettings,
        },
        emailAttachments: hasEmailAttachments(payload),
        browserForms: hasBrowserForms(payload),
    };
}
