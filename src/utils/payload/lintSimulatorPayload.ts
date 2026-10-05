import { type SimulatorTemplatePayload } from '../../types/session.js';
import { PayloadSection } from './payloadSections.js';
import {} from '@signalsafe/simulator-core/devicePayload';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import { englishLocale } from '../../i18n/englishLocale.js';
/**
 * Advisory linting for simulator template payloads.
 * Runs after validation; does not throw. Catches quality/authoring issues that
 * are technically valid but likely mistakes (empty entry content, unreachable
 * targets, missing sender identity, duplicate keys, etc.).
 * Kept separate from validateSimulatorPayload (hard validation).
 */

import { KeyFamily, keyNamingSuggestion } from './simulatorKeyPatterns.js';
import { getEntryScreen, add } from './lintHelpers.js';
import { lintEntryAppContent } from './lintEntryChecks.js';

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

function lintBrowserActionTargets(
    browserPages: NonNullable<SimulatorTemplatePayload['browser']>['pages'] | undefined,
    warnings: SimulatorLintWarning[],
): void {
    const pages = browserPages ?? [];
    const browserPageIds = new Set(pages.map((p) => p?.id).filter(Boolean));
    pages.forEach((page, i) => {
        const buttons = page?.buttons ?? [];
        buttons.forEach((btn) => {
            const target = btn.targetPageId;
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
            PayloadSection.Phone,
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
        PayloadSection.Contacts,
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
        suggest(payload.templateKey, KeyFamily.Template, 'templateKey');
    }
    (payload.contacts ?? []).forEach((contact, i) => {
        if (contact?.id != null) suggest(contact.id, KeyFamily.Contact, `contacts[${i}].id`);
    });
    (payload.directory ?? []).forEach((entry, i) => {
        if (entry?.id != null) suggest(entry.id, KeyFamily.Directory, `directory[${i}].id`);
    });
    (payload.email?.inbox ?? []).forEach((row, i) => {
        if (row?.id != null) suggest(row.id, KeyFamily.Message, `email.inbox[${i}].id`);
    });
    (payload.browser?.pages ?? []).forEach((page, i) => {
        if (page?.id != null) suggest(page.id, KeyFamily.Page, `browser.pages[${i}].id`);
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

    lintEntryAppContent(payload, app, screen, ep, warnings, SimulatorLintCode);
    lintBrowserActionTargets(payload.browser?.pages, warnings);
    lintBareBrowserPages(payload.browser?.pages, warnings);
    lintMessagesSenderIdentity(payload, warnings);
    lintPhoneVerificationContacts(payload, app, warnings);
    lintDuplicateKeys(payload, warnings);
    addKeyNamingWarnings(warnings, payload);

    return { warnings };
}
