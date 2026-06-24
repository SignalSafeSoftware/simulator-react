/**
 * Lightweight realism checks for canonical simulator examples.
 * Quality controls for reference templates: believable inbox/contacts, browser URLs/titles,
 * phone/sender metadata. Not hard universal rules; low-noise and simulator-scoped only.
 *
 * @see docs/simulator/simulator-authoring.md, docs/simulator/simulator-testing-governance.md
 */

import type { SimulatorTemplatePayload } from '../types/session';

export interface SimulatorRealismIssue {
    code: string;
    message: string;
    path?: string;
}

export interface SimulatorRealismReport {
    /** No blocker-level issues (example would look implausible). */
    pass: boolean;
    /** Issues that make the example a poor reference (e.g. empty list view, no way to verify). */
    blockers: SimulatorRealismIssue[];
    /** Optional improvements (e.g. add contacts for verification). */
    suggestions: SimulatorRealismIssue[];
}

function blocker(
    blockers: SimulatorRealismIssue[],
    code: string,
    message: string,
    path?: string
): void {
    blockers.push({ code, message, path });
}

function suggest(
    suggestions: SimulatorRealismIssue[],
    code: string,
    message: string,
    path?: string
): void {
    suggestions.push({ code, message, path });
}

function checkEmailListEntry(
    payload: SimulatorTemplatePayload,
    app: string | null,
    screen: string | null,
    blockers: SimulatorRealismIssue[]
): void {
    if (app !== 'email' || screen !== 'list') return;
    if ((payload.email?.inbox?.length ?? 0) > 0) return;
    blocker(
        blockers,
        'realism_email_list_empty',
        'Entry is email list but inbox is empty; list view looks implausible.',
        'email.inbox'
    );
}

function checkVerificationSources(
    payload: SimulatorTemplatePayload,
    app: string | null,
    blockers: SimulatorRealismIssue[],
    suggestions: SimulatorRealismIssue[]
): void {
    const detailLinks =
        (payload.email?.selectedMessage as { links?: Array<{ href?: string }> } | undefined)?.links?.length ?? 0;
    const inboxHasLinks =
        payload.email?.inbox?.some((row) => (row as { links?: unknown }).links != null) ?? false;
    const emailHasLinks = detailLinks > 0 || inboxHasLinks;
    const browserHasPages = (payload.browser?.pages?.length ?? 0) > 0;
    const hasContacts = (payload.contacts?.length ?? 0) > 0;
    const hasDirectory = (payload.directory?.length ?? 0) > 0;

    if (app === 'email' && emailHasLinks && browserHasPages && !hasContacts && !hasDirectory) {
        blocker(
            blockers,
            'realism_verification_no_contacts',
            'Email has links and browser pages but no contacts or directory; verification flow is not possible.',
            'contacts'
        );
    }

    const smsHasMessages = (payload.sms?.thread?.messages?.length ?? 0) > 0;
    if (app === 'messages' && smsHasMessages && browserHasPages && !hasContacts && !hasDirectory) {
        suggest(
            suggestions,
            'realism_sms_verification_contacts',
            'SMS thread with browser pages: add contacts or directory so learners can verify sender.',
            'contacts'
        );
    }
}

function checkBrowserPages(
    payload: SimulatorTemplatePayload,
    blockers: SimulatorRealismIssue[],
    suggestions: SimulatorRealismIssue[]
): void {
    (payload.browser?.pages ?? []).forEach((page, index) => {
        if (page == null) return;
        const url = (page.url ?? '').trim();
        const title = (page.title ?? '').trim();
        const path = `browser.pages[${index}]`;

        if (url === '' && title === '') {
            blocker(
                blockers,
                'realism_browser_page_no_url_or_title',
                'Browser page has no url or title; address bar and tab would look empty.',
                path
            );
            return;
        }

        if (title === '' && url !== '') {
            suggest(
                suggestions,
                'realism_browser_page_no_title',
                'Browser page has url but no title; consider adding a title for tab/header.',
                path
            );
        }
    });
}

function checkPhoneEntry(
    payload: SimulatorTemplatePayload,
    app: string | null,
    screen: string | null,
    blockers: SimulatorRealismIssue[],
    suggestions: SimulatorRealismIssue[]
): void {
    if (app === 'phone' && screen === 'incoming_call') {
        const phoneContent = payload.phone?.content;
        if (phoneContent) {
            const transcript = (phoneContent.transcript ?? '').trim();
            const number = (phoneContent.phone_number ?? '').trim();
            const name = (phoneContent.caller_name ?? '').trim();
            if (transcript === '' && number === '' && name === '') {
                blocker(
                    blockers,
                    'realism_phone_incoming_bare',
                    'Incoming call has no transcript, number, or caller name; screen would look empty.',
                    'phone.content'
                );
            } else if (transcript === '' && number === '') {
                suggest(
                    suggestions,
                    'realism_phone_incoming_transcript',
                    'Incoming call has caller name but no transcript or number; add transcript for realism.',
                    'phone.content'
                );
            }
        }
    }

    if (app === 'phone' && screen === 'directory' && !payload.directory?.length && !payload.contacts?.length) {
        blocker(
            blockers,
            'realism_phone_directory_empty',
            'Entry is phone directory but directory and contacts are empty.',
            'directory'
        );
    }
}

function checkSenderMetadata(
    payload: SimulatorTemplatePayload,
    suggestions: SimulatorRealismIssue[]
): void {
    const syntheticSenderPattern = /^(test|sender|user|unknown|n\/?a)$/i;
    const detail = payload.email?.selectedMessage as { from_display_name?: string } | undefined;
    const firstRow = payload.email?.inbox?.[0] as { from_display_name?: string } | undefined;
    const fromDisplay = detail?.from_display_name ?? firstRow?.from_display_name;
    if (fromDisplay == null || String(fromDisplay).trim() === '') return;

    const display = String(fromDisplay).trim();
    if (syntheticSenderPattern.test(display)) {
        suggest(
            suggestions,
            'realism_sender_display_generic',
            `Sender display name "${display}" looks generic; consider a more believable name for examples.`,
            'email'
        );
    }
}

/**
 * Run realism checks on a payload. Intended for canonical examples and fixture worlds.
 * Does not replace lint or validation; use after validateSimulatorPayload.
 * Import from `@signalsafe/simulator-react/utils/simulatorRealismChecks` for tooling and tests.
 */
export function runSimulatorRealismChecks(payload: SimulatorTemplatePayload): SimulatorRealismReport {
    const blockers: SimulatorRealismIssue[] = [];
    const suggestions: SimulatorRealismIssue[] = [];
    const ep = payload.entryPoint;
    const app = ep?.app ?? null;
    const screen = getEntryScreen(ep);
    checkEmailListEntry(payload, app, screen, blockers);
    checkVerificationSources(payload, app, blockers, suggestions);
    checkBrowserPages(payload, blockers, suggestions);
    checkPhoneEntry(payload, app, screen, blockers, suggestions);
    checkSenderMetadata(payload, suggestions);

    return {
        pass: blockers.length === 0,
        blockers,
        suggestions,
    };
}

function getEntryScreen(
    entryPoint: SimulatorTemplatePayload['entryPoint']
): string | null {
    if (entryPoint?.screen == null) {
        return null;
    }
    return String(entryPoint.screen).toLowerCase();
}
