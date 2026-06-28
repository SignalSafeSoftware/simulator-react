/**
 * Advisory linting for simulator template payloads.
 * Runs after validation; does not throw. Catches quality/authoring issues that
 * are technically valid but likely mistakes (empty entry content, unreachable
 * targets, missing sender identity, duplicate keys, etc.).
 * Kept separate from validateSimulatorPayload (hard validation).
 */

import type {
    SimulatorTemplatePayload,
} from '../types/session.js';
import { keyNamingSuggestion, type KeyFamily } from './simulatorKeyPatterns.js';

export interface SimulatorLintWarning {
    code: string;
    message: string;
    /** Optional path for authors (e.g. "browser.pages[0]", "entry_point"). */
    path?: string;
}

export interface SimulatorLintResult {
    warnings: SimulatorLintWarning[];
}

function getEntryScreen(ep: SimulatorTemplatePayload['entryPoint']): string | null {
    if (ep?.screen == null) {
        return null;
    }
    return String(ep.screen).toLowerCase();
}

function add(
    warnings: SimulatorLintWarning[],
    code: string,
    message: string,
    path?: string
): void {
    warnings.push({ code, message, path });
}

function lintEmailEntry(
    payload: SimulatorTemplatePayload,
    screen: string | null,
    warnings: SimulatorLintWarning[]
): void {
    const hasInbox = (payload.email?.inbox?.length ?? 0) > 0;
    const hasDetail = payload.email?.selectedMessage != null;
    if (screen === 'detail' && !hasDetail && !hasInbox) {
        add(warnings, 'entry_app_empty', 'Entry point is email/detail but there is no message or inbox.', 'entry_point');
        return;
    }
    if (!hasInbox && !hasDetail) {
        add(warnings, 'entry_app_empty', 'Entry point is email but inbox and selected message are empty.', 'entry_point');
    }
}

function lintMessagesEntry(
    payload: SimulatorTemplatePayload,
    screen: string | null,
    warnings: SimulatorLintWarning[]
): void {
    const hasThread = (payload.sms?.thread?.messages?.length ?? 0) > 0;
    if (screen === 'thread_detail' && !hasThread) {
        add(warnings, 'entry_app_empty', 'Entry point is messages/thread_detail but the thread has no messages.', 'entry_point');
        return;
    }
    if (!hasThread) {
        add(warnings, 'entry_app_empty', 'Entry point is messages but the SMS thread is empty.', 'entry_point');
    }
}

function lintInternetEntry(
    payload: SimulatorTemplatePayload,
    screen: string | null,
    entryPoint: SimulatorTemplatePayload['entryPoint'],
    warnings: SimulatorLintWarning[]
): void {
    const pages = payload.browser?.pages ?? [];
    const pageIds = new Set(pages.map((p) => p?.id).filter(Boolean));
    if (pages.length === 0) {
        add(warnings, 'entry_app_empty', 'Entry point is internet but there are no browser pages.', 'entry_point');
        return;
    }
    if (screen != null && screen !== 'landing' && !pageIds.has(screen)) {
        add(
            warnings,
            'entry_point_unreachable',
            `Entry screen "${entryPoint?.screen}" is not in browser.pages; user will see default page.`,
            'entry_point'
        );
    }
}

function lintPhoneEntry(
    payload: SimulatorTemplatePayload,
    screen: string | null,
    warnings: SimulatorLintWarning[]
): void {
    const hasPhone = payload.phone?.content != null;
    const needsPhoneContent =
        screen === 'incoming_call' ||
        screen === 'dial' ||
        screen === 'contacts';
    if (needsPhoneContent && !hasPhone && payload.phone == null) {
        add(warnings, 'entry_app_empty', 'Entry point is phone but phone content is missing.', 'entry_point');
    }
}

function lintHomeEntry(
    payload: SimulatorTemplatePayload,
    warnings: SimulatorLintWarning[]
): void {
    const widgets = payload.home?.widgets ?? [];
    const apps = payload.home?.featuredApps ?? [];
    if (widgets.length === 0 && apps.length === 0) {
        add(warnings, 'entry_app_empty', 'Entry point is home but widgets and featured apps are empty.', 'entry_point');
    }
}

function lintEntryAppContent(
    payload: SimulatorTemplatePayload,
    app: string | null,
    screen: string | null,
    entryPoint: SimulatorTemplatePayload['entryPoint'],
    warnings: SimulatorLintWarning[]
): void {
    switch (app) {
        case 'email':
            lintEmailEntry(payload, screen, warnings);
            return;
        case 'messages':
            lintMessagesEntry(payload, screen, warnings);
            return;
        case 'internet':
            lintInternetEntry(payload, screen, entryPoint, warnings);
            return;
        case 'phone':
            lintPhoneEntry(payload, screen, warnings);
            return;
        case 'home':
            lintHomeEntry(payload, warnings);
            return;
        default:
            return;
    }
}

function lintBrowserActionTargets(
    browserPages: NonNullable<SimulatorTemplatePayload['browser']>['pages'] | undefined,
    warnings: SimulatorLintWarning[]
): void {
    const pages = browserPages ?? [];
    const browserPageIds = new Set(pages.map((p) => p?.id).filter(Boolean));
    pages.forEach((page, i) => {
        const buttons = page?.buttons ?? [];
        buttons.forEach((btn) => {
            const target = (btn as { targetPageId?: string }).targetPageId;
            if (target != null && target !== '' && !browserPageIds.has(target)) {
                add(
                    warnings,
                    'unreachable_action_target',
                    `Button targets page "${target}" which is not in browser.pages.`,
                    `browser.pages[${i}]`
                );
            }
        });
    });
}

function lintBareBrowserPages(
    browserPages: NonNullable<SimulatorTemplatePayload['browser']>['pages'] | undefined,
    warnings: SimulatorLintWarning[]
): void {
    (browserPages ?? []).forEach((page, i) => {
        if (page == null) return;
        const title = (page.title ?? '').trim();
        const url = (page.url ?? '').trim();
        const content = (page.content ?? '').trim();
        if (title === '' && url === '' && content === '') {
            add(
                warnings,
                'browser_page_bare',
                'Browser page has no title, url, or content.',
                `browser.pages[${i}]`
            );
        }
    });
}

function lintMessagesSenderIdentity(
    payload: SimulatorTemplatePayload,
    warnings: SimulatorLintWarning[]
): void {
    const sms = payload.sms;
    if (!(sms?.thread?.messages?.length)) {
        return;
    }
    const thread = sms.thread;
    const hasSender =
        (thread.sender_display_name != null && String(thread.sender_display_name).trim() !== '') ||
        (thread.sender_number != null && String(thread.sender_number).trim() !== '');
    if (!hasSender) {
        add(
            warnings,
            'messages_no_sender_identity',
            'SMS thread has messages but no sender_display_name or sender_number; "Check contact" may be unclear.',
            'sms.thread'
        );
    }
}

function lintPhoneVerificationContacts(
    payload: SimulatorTemplatePayload,
    app: string | null,
    warnings: SimulatorLintWarning[]
): void {
    const phone = payload.phone;
    const contacts = payload.contacts ?? [];
    const hasContacts = Array.isArray(contacts) && contacts.length > 0;
    const hasPhoneChoices = (phone?.content?.choices?.length ?? 0) > 0;
    if (app === 'phone' && hasPhoneChoices && !hasContacts) {
        add(
            warnings,
            'phone_verification_without_contacts',
            'Phone scenario has choices (e.g. verification) but no contacts list; learners cannot match a contact.',
            'phone'
        );
    }
}

function addDuplicateIdWarnings(
    warnings: SimulatorLintWarning[],
    ids: Array<string | null | undefined>,
    code: string,
    makeMessage: (id: string) => string,
    path: string
): void {
    const counts = new Map<string, number>();
    ids.forEach((id) => {
        if (id != null) {
            counts.set(id, (counts.get(id) ?? 0) + 1);
        }
    });
    counts.forEach((count, id) => {
        if (count > 1) {
            add(warnings, code, makeMessage(id), path);
        }
    });
}

function lintDuplicateKeys(
    payload: SimulatorTemplatePayload,
    warnings: SimulatorLintWarning[]
): void {
    const browserPages = payload.browser?.pages ?? [];
    const contactList = payload.contacts ?? [];
    const inbox = payload.email?.inbox ?? [];

    addDuplicateIdWarnings(
        warnings,
        browserPages.map((p) => p?.id),
        'duplicate_keys',
        (id) => `Duplicate browser page id: "${id}".`,
        'browser.pages'
    );
    addDuplicateIdWarnings(
        warnings,
        contactList.map((contact) => contact?.id),
        'duplicate_keys',
        (id) => `Duplicate contact id: "${id}".`,
        'contacts'
    );
    addDuplicateIdWarnings(
        warnings,
        inbox.map((row) => row?.id),
        'duplicate_keys',
        (id) => `Duplicate inbox message id: "${id}".`,
        'email.inbox'
    );
}

function addKeyNamingWarnings(
    warnings: SimulatorLintWarning[],
    payload: SimulatorTemplatePayload
): void {
    const suggest = (value: string, family: KeyFamily, path: string): void => {
        const msg = keyNamingSuggestion(value, family);
        if (msg != null) {
            add(warnings, 'key_naming', msg, path);
        }
    };

    if (payload.templateKey != null && payload.templateKey !== '') {
        suggest(payload.templateKey, 'template', 'templateKey');
    }
    (payload.contacts ?? []).forEach((contact, i) => {
        if (contact?.id != null) suggest(contact.id, 'contact', `contacts[${i}].id`);
    });
    (payload.directory ?? []).forEach((entry, i) => {
        if (entry?.id != null) suggest(entry.id, 'directory', `directory[${i}].id`);
    });
    (payload.email?.inbox ?? []).forEach((row, i) => {
        if (row?.id != null) suggest(row.id, 'message', `email.inbox[${i}].id`);
    });
    (payload.browser?.pages ?? []).forEach((page, i) => {
        if (page?.id != null) suggest(page.id, 'page', `browser.pages[${i}].id`);
    });
}

/**
 * Lint a validated simulator template payload. Advisory only; never throws.
 * Call after validateSimulatorPayload (or on payload that has already passed validation).
 */
export function lintSimulatorPayload(payload: SimulatorTemplatePayload): SimulatorLintResult {
    const warnings: SimulatorLintWarning[] = [];
    const ep = payload.entryPoint;
    const app = ep?.app ?? null;
    const screen = getEntryScreen(ep);

    lintEntryAppContent(payload, app, screen, ep, warnings);
    lintBrowserActionTargets(payload.browser?.pages, warnings);
    lintBareBrowserPages(payload.browser?.pages, warnings);
    lintMessagesSenderIdentity(payload, warnings);
    lintPhoneVerificationContacts(payload, app, warnings);
    lintDuplicateKeys(payload, warnings);
    addKeyNamingWarnings(warnings, payload);

    return { warnings };
}
