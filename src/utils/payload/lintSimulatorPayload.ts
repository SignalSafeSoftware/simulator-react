import { DEFAULT_INTERNET_SCREEN, type SimulatorTemplatePayload } from '../../types/session.js';
import {
    SimulatorEmailScreenId,
    SimulatorMessagesScreenId,
    SimulatorPhoneScreenId,
} from '@signalsafe/simulator-core/devicePayload';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import { englishLocale } from '../../i18n/englishLocale.js';
/**
 * Advisory linting for simulator template payloads.
 * Runs after validation; does not throw. Catches quality/authoring issues that
 * are technically valid but likely mistakes (empty entry content, unreachable
 * targets, missing sender identity, duplicate keys, etc.).
 * Kept separate from validateSimulatorPayload (hard validation).
 */

import { keyNamingSuggestion, type KeyFamily } from './simulatorKeyPatterns.js';

export const SimulatorLintCode = Object.freeze({
    EntryAppEmpty: 'entry_app_empty',
    DuplicateKeys: 'duplicate_keys',
    KeyNaming: 'key_naming',
    BrowserPageBare: 'browser_page_bare',
    EntryPointUnreachable: 'entry_point_unreachable',
    MessagesNoSenderIdentity: 'messages_no_sender_identity',
    PhoneVerificationWithoutContacts: 'phone_verification_without_contacts',
    UnreachableActionTarget: 'unreachable_action_target',
} as const);
export type SimulatorLintCode = (typeof SimulatorLintCode)[keyof typeof SimulatorLintCode];

export interface SimulatorLintWarning {
    /** One of {@link SimulatorLintCode}, or a host-defined code. */
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
    code: SimulatorLintCode,
    message: string,
    path?: string,
): void {
    warnings.push({ code, message, path });
}

function lintEmailEntry(
    payload: SimulatorTemplatePayload,
    screen: string | null,
    warnings: SimulatorLintWarning[],
): void {
    const hasInbox = (payload.email?.inbox?.length ?? 0) > 0;
    const hasDetail = payload.email?.selectedMessage != null;
    if (screen === SimulatorEmailScreenId.Detail && !hasDetail && !hasInbox) {
        add(
            warnings,
            SimulatorLintCode.EntryAppEmpty,
            englishLocale.t(
                'copy.lintSimulatorPayload.entry.point.is.email.detail.but.there.is.no.message.or.inbox',
            ),
            'entry_point',
        );
        return;
    }
    if (!hasInbox && !hasDetail) {
        add(
            warnings,
            SimulatorLintCode.EntryAppEmpty,
            englishLocale.t(
                'copy.lintSimulatorPayload.entry.point.is.email.but.inbox.and.selected.message.are.empty',
            ),
            'entry_point',
        );
    }
}

function lintMessagesEntry(
    payload: SimulatorTemplatePayload,
    screen: string | null,
    warnings: SimulatorLintWarning[],
): void {
    const hasThread = (payload.sms?.thread?.messages?.length ?? 0) > 0;
    if (screen === SimulatorMessagesScreenId.ThreadDetail && !hasThread) {
        add(
            warnings,
            SimulatorLintCode.EntryAppEmpty,
            englishLocale.t(
                'copy.lintSimulatorPayload.entry.point.is.messages.thread.detail.but.the.thread.has.no.messages',
            ),
            'entry_point',
        );
        return;
    }
    if (!hasThread) {
        add(
            warnings,
            SimulatorLintCode.EntryAppEmpty,
            englishLocale.t(
                'copy.lintSimulatorPayload.entry.point.is.messages.but.the.sms.thread.is.empty',
            ),
            'entry_point',
        );
    }
}

function lintInternetEntry(
    payload: SimulatorTemplatePayload,
    screen: string | null,
    entryPoint: SimulatorTemplatePayload['entryPoint'],
    warnings: SimulatorLintWarning[],
): void {
    const pages = payload.browser?.pages ?? [];
    const pageIds = new Set(pages.map((p) => p?.id).filter(Boolean));
    if (pages.length === 0) {
        add(
            warnings,
            SimulatorLintCode.EntryAppEmpty,
            englishLocale.t(
                'copy.lintSimulatorPayload.entry.point.is.internet.but.there.are.no.browser.pages',
            ),
            'entry_point',
        );
        return;
    }
    if (screen != null && screen !== DEFAULT_INTERNET_SCREEN && !pageIds.has(screen)) {
        add(
            warnings,
            SimulatorLintCode.EntryPointUnreachable,
            `Entry screen "${entryPoint?.screen}" is not in browser.pages; user will see default page.`,
            'entry_point',
        );
    }
}

function lintPhoneEntry(
    payload: SimulatorTemplatePayload,
    screen: string | null,
    warnings: SimulatorLintWarning[],
): void {
    const hasPhone = payload.phone?.content != null;
    const needsPhoneContent =
        screen === SimulatorPhoneScreenId.IncomingCall ||
        screen === SimulatorPhoneScreenId.Dial ||
        screen === SimulatorPhoneScreenId.Contacts;
    if (needsPhoneContent && !hasPhone && payload.phone == null) {
        add(
            warnings,
            SimulatorLintCode.EntryAppEmpty,
            englishLocale.t(
                'copy.lintSimulatorPayload.entry.point.is.phone.but.phone.content.is.missing',
            ),
            'entry_point',
        );
    }
}

function lintHomeEntry(payload: SimulatorTemplatePayload, warnings: SimulatorLintWarning[]): void {
    const widgets = payload.home?.widgets ?? [];
    const apps = payload.home?.featuredApps ?? [];
    if (widgets.length === 0 && apps.length === 0) {
        add(
            warnings,
            SimulatorLintCode.EntryAppEmpty,
            englishLocale.t(
                'copy.lintSimulatorPayload.entry.point.is.home.but.widgets.and.featured.apps.are.empty',
            ),
            'entry_point',
        );
    }
}

function lintEntryAppContent(
    payload: SimulatorTemplatePayload,
    app: string | null,
    screen: string | null,
    entryPoint: SimulatorTemplatePayload['entryPoint'],
    warnings: SimulatorLintWarning[],
): void {
    switch (app) {
        case SimulatorApp.Email:
            lintEmailEntry(payload, screen, warnings);
            return;
        case SimulatorApp.Messages:
            lintMessagesEntry(payload, screen, warnings);
            return;
        case SimulatorApp.Internet:
            lintInternetEntry(payload, screen, entryPoint, warnings);
            return;
        case SimulatorApp.Phone:
            lintPhoneEntry(payload, screen, warnings);
            return;
        case SimulatorApp.Home:
            lintHomeEntry(payload, warnings);
            return;
        default:
            return;
    }
}

function lintBrowserActionTargets(
    browserPages: NonNullable<SimulatorTemplatePayload['browser']>['pages'] | undefined,
    warnings: SimulatorLintWarning[],
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
                    SimulatorLintCode.UnreachableActionTarget,
                    `Button targets page "${target}" which is not in browser.pages.`,
                    `browser.pages[${i}]`,
                );
            }
        });
    });
}

function lintBareBrowserPages(
    browserPages: NonNullable<SimulatorTemplatePayload['browser']>['pages'] | undefined,
    warnings: SimulatorLintWarning[],
): void {
    (browserPages ?? []).forEach((page, i) => {
        if (page == null) return;
        const title = (page.title ?? '').trim();
        const url = (page.url ?? '').trim();
        const content = (page.content ?? '').trim();
        if (title === '' && url === '' && content === '') {
            add(
                warnings,
                SimulatorLintCode.BrowserPageBare,
                englishLocale.t(
                    'copy.lintSimulatorPayload.browser.page.has.no.title.url.or.content',
                ),
                `browser.pages[${i}]`,
            );
        }
    });
}

function lintMessagesSenderIdentity(
    payload: SimulatorTemplatePayload,
    warnings: SimulatorLintWarning[],
): void {
    const sms = payload.sms;
    if (!sms?.thread?.messages?.length) {
        return;
    }
    const thread = sms.thread;
    const hasSender =
        (thread.sender_display_name != null && String(thread.sender_display_name).trim() !== '') ||
        (thread.sender_number != null && String(thread.sender_number).trim() !== '');
    if (!hasSender) {
        add(
            warnings,
            SimulatorLintCode.MessagesNoSenderIdentity,
            'SMS thread has messages but no sender_display_name or sender_number; "Check contact" may be unclear.',
            'sms.thread',
        );
    }
}

function lintPhoneVerificationContacts(
    payload: SimulatorTemplatePayload,
    app: string | null,
    warnings: SimulatorLintWarning[],
): void {
    const phone = payload.phone;
    const contacts = payload.contacts ?? [];
    const hasContacts = Array.isArray(contacts) && contacts.length > 0;
    const hasPhoneChoices = (phone?.content?.choices?.length ?? 0) > 0;
    if (app === SimulatorApp.Phone && hasPhoneChoices && !hasContacts) {
        add(
            warnings,
            SimulatorLintCode.PhoneVerificationWithoutContacts,
            englishLocale.t(
                'copy.lintSimulatorPayload.phone.scenario.has.choices.e.g.verification.but.no.contacts.list.learners.cannot.match.a.c',
            ),
            'phone',
        );
    }
}

function addDuplicateIdWarnings(
    warnings: SimulatorLintWarning[],
    ids: Array<string | null | undefined>,
    code: SimulatorLintCode,
    makeMessage: (id: string) => string,
    path: string,
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
    warnings: SimulatorLintWarning[],
): void {
    const browserPages = payload.browser?.pages ?? [];
    const contactList = payload.contacts ?? [];
    const inbox = payload.email?.inbox ?? [];

    addDuplicateIdWarnings(
        warnings,
        browserPages.map((p) => p?.id),
        SimulatorLintCode.DuplicateKeys,
        (id) => `Duplicate browser page id: "${id}".`,
        'browser.pages',
    );
    addDuplicateIdWarnings(
        warnings,
        contactList.map((contact) => contact?.id),
        SimulatorLintCode.DuplicateKeys,
        (id) => `Duplicate contact id: "${id}".`,
        'contacts',
    );
    addDuplicateIdWarnings(
        warnings,
        inbox.map((row) => row?.id),
        SimulatorLintCode.DuplicateKeys,
        (id) => `Duplicate inbox message id: "${id}".`,
        'email.inbox',
    );
}

function addKeyNamingWarnings(
    warnings: SimulatorLintWarning[],
    payload: SimulatorTemplatePayload,
): void {
    const suggest = (value: string, family: KeyFamily, path: string): void => {
        const msg = keyNamingSuggestion(value, family);
        if (msg != null) {
            add(warnings, SimulatorLintCode.KeyNaming, msg, path);
        }
    };

    if (payload.templateKey != null && payload.templateKey !== '') {
        suggest(payload.templateKey, 'template', 'templateKey');
    }
    (payload.contacts ?? []).forEach((contact, i) => {
        if (contact?.id != null) suggest(contact.id, 'contact', `contacts[${i}].id`);
    });
    (payload.directory ?? []).forEach((entry, i) => {
        if (entry?.id != null)
            suggest(entry.id, SimulatorPhoneScreenId.Directory, `directory[${i}].id`);
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
