/**
 * Structured author preview report for simulator templates.
 * Compact summary of entry point, apps, counts, trusted sources, key actions, and lint/validation.
 * For admin/workspace preview only; simulator-scoped.
 *
 * **App usage:** not imported by current `frontend/workspace/src` or `frontend/administration/src` subpaths;
 * used internally by {@link SimulatorDeveloperToolsPanel} and the `utils/simulatorPreviewReport` package export for tests/tooling.
 */

import type { SimulatorTemplatePayload } from '../types/session';
import type { SimulatorApp } from '../types/portableSimulator';
import { analyzeReachability } from './simulatorReachability';
import { lintSimulatorPayload } from './lintSimulatorPayload';
import { validateSimulatorPayload } from './validateSimulatorPayload';

export interface SimulatorPreviewReport {
    /** Entry app and screen (from entry_point or channel default). */
    entryPoint: { app: string; screen: string };
    /** Apps that are used (reachable) in this template. */
    appsUsed: string[];
    /** Number of contacts. */
    contactsCount: number;
    /** Number of inbox messages (email list). */
    inboxCount: number;
    /** Number of messages in the SMS thread. */
    threadMessageCount: number;
    /** Number of browser pages. */
    browserPagesCount: number;
    /** Number of directory (trusted source) entries. */
    directoryCount: number;
    /** Key actions that are available (e.g. open_email, click_link, submit_form). */
    keyActions: string[];
    /** True if payload passes validateSimulatorPayload. */
    validationOk: boolean;
    /** Number of lint warnings. */
    lintWarningCount: number;
    /** Total unreachable items (screens + contacts + inbox + pages). */
    unreachableCount: number;
    /** Whether browser page graph has a cycle. */
    browserHasCycle: boolean;
}

function getDefaultEntryScreen(entryApp: SimulatorApp, payload: SimulatorTemplatePayload): string {
    switch (entryApp) {
        case 'email':
            return 'list';
        case 'messages':
            return 'threads';
        case 'phone':
            return 'history';
        case 'internet':
            return payload.browser?.defaultPageId ?? payload.browser?.pages?.[0]?.id ?? 'landing';
        case 'home':
            return 'home';
        default:
            return 'list';
    }
}

function getEntryPoint(payload: SimulatorTemplatePayload, entryApp: SimulatorApp): { app: string; screen: string } {
    const defaultScreen = getDefaultEntryScreen(entryApp, payload);
    const secondaryDefault = payload.device?.secondaryDefaults?.[entryApp];
    const entryScreen =
        payload.entryPoint?.app === entryApp && payload.entryPoint?.screen != null
            ? String(payload.entryPoint.screen)
            : secondaryDefault ?? defaultScreen;
    return { app: entryApp, screen: entryScreen };
}

function getUnreachableCount(report: ReturnType<typeof analyzeReachability>): number {
    return (
        report.unreachable.screens.length +
        report.unreachable.contacts.length +
        report.unreachable.inboxMessageIds.length +
        report.unreachable.browserPageIds.length
    );
}

function hasEmailAccess(
    payload: SimulatorTemplatePayload,
    counts: { inboxCount: number }
): boolean {
    return counts.inboxCount > 0 || payload.email?.selectedMessage != null;
}

function hasBrowserFormAction(payload: SimulatorTemplatePayload): boolean {
    return payload.browser?.pages?.some(
        (page) =>
            (page?.formFields?.length ?? 0) > 0 ||
            (page as { submitTargetPageId?: string }).submitTargetPageId != null
    ) ?? false;
}

function hasEmailLinks(payload: SimulatorTemplatePayload): boolean {
    const detailLinks =
        (payload.email?.selectedMessage as { links?: unknown[] } | undefined)?.links?.length ?? 0;
    const inboxHasLinks =
        payload.email?.inbox?.some((row) => (row as { links?: unknown }).links != null) ?? false;
    return detailLinks > 0 || inboxHasLinks;
}

function addEmailKeyActions(
    keyActions: string[],
    payload: SimulatorTemplatePayload,
    report: ReturnType<typeof analyzeReachability>,
    counts: { inboxCount: number }
): void {
    if (report.reachableApps.includes('email') && hasEmailAccess(payload, counts)) {
        keyActions.push('open_email');
    }
}

function addMessagesKeyActions(
    keyActions: string[],
    report: ReturnType<typeof analyzeReachability>,
    counts: { threadMessageCount: number }
): void {
    if (report.reachableApps.includes('messages') && counts.threadMessageCount > 0) {
        keyActions.push('open_thread');
    }
}

function addBrowserKeyActions(
    keyActions: string[],
    payload: SimulatorTemplatePayload,
    report: ReturnType<typeof analyzeReachability>,
    counts: { threadMessageCount: number; browserPagesCount: number }
): void {
    if (report.reachableApps.includes('internet') && counts.browserPagesCount > 0) {
        keyActions.push('open_page');
        if (hasBrowserFormAction(payload)) {
            keyActions.push('submit_form');
        }
    }

    if ((hasEmailLinks(payload) || counts.threadMessageCount > 0) && counts.browserPagesCount > 0) {
        keyActions.push('click_link');
    }
}

function addPhoneKeyActions(
    keyActions: string[],
    payload: SimulatorTemplatePayload,
    report: ReturnType<typeof analyzeReachability>,
    counts: { contactsCount: number; directoryCount: number }
): void {
    if (!report.reachableApps.includes('phone')) {
        return;
    }
    if (payload.phone?.content != null) {
        keyActions.push('answer_call', 'ignore_call');
    }
    if (counts.directoryCount > 0) {
        keyActions.push('view_directory_entry');
    }
    if (counts.contactsCount > 0) {
        keyActions.push('open_contact', 'check_contact');
    }
    keyActions.push('dial_phone');
}

function addVerificationKeyActions(
    keyActions: string[],
    report: ReturnType<typeof analyzeReachability>,
    counts: { contactsCount: number }
): void {
    if (
        counts.contactsCount > 0 &&
        (report.reachableApps.includes('email') || report.reachableApps.includes('messages'))
    ) {
        keyActions.push('check_contact');
    }
}

function addHomeKeyActions(
    keyActions: string[],
    report: ReturnType<typeof analyzeReachability>
): void {
    if (report.reachableApps.includes('home')) {
        keyActions.push('open_store', 'open_settings');
    }
}

function collectKeyActions(
    payload: SimulatorTemplatePayload,
    report: ReturnType<typeof analyzeReachability>,
    counts: {
        contactsCount: number;
        inboxCount: number;
        threadMessageCount: number;
        browserPagesCount: number;
        directoryCount: number;
    }
): string[] {
    const keyActions: string[] = [];
    addEmailKeyActions(keyActions, payload, report, counts);
    addMessagesKeyActions(keyActions, report, counts);
    addBrowserKeyActions(keyActions, payload, report, counts);
    addPhoneKeyActions(keyActions, payload, report, counts);
    addVerificationKeyActions(keyActions, report, counts);
    addHomeKeyActions(keyActions, report);
    return [...new Set(keyActions)].sort((left, right) => left.localeCompare(right));
}

/**
 * Build a structured preview report from a simulator template payload.
 * Reuses reachability and lint; safe to call on any payload (catches validation errors).
 */
export function buildSimulatorPreviewReport(payload: SimulatorTemplatePayload): SimulatorPreviewReport {
    const report = analyzeReachability(payload);
    const lint = lintSimulatorPayload(payload);

    let validationOk = true;
    try {
        validateSimulatorPayload(payload);
    } catch {
        validationOk = false;
    }

    const entryApp = report.entryApp ?? 'email';
    const entryPoint = getEntryPoint(payload, entryApp);

    const contactsCount = payload.contacts?.length ?? 0;
    const inboxCount = payload.email?.inbox?.length ?? 0;
    const threadMessageCount = payload.sms?.thread?.messages?.length ?? 0;
    const browserPagesCount = payload.browser?.pages?.length ?? 0;
    const directoryCount = payload.directory?.length ?? 0;
    const unreachableCount = getUnreachableCount(report);
    const keyActions = collectKeyActions(payload, report, {
        contactsCount,
        inboxCount,
        threadMessageCount,
        browserPagesCount,
        directoryCount,
    });

    return {
        entryPoint,
        appsUsed: [...report.reachableApps],
        contactsCount,
        inboxCount,
        threadMessageCount,
        browserPagesCount,
        directoryCount,
        keyActions,
        validationOk,
        lintWarningCount: lint.warnings.length,
        unreachableCount,
        browserHasCycle: report.browserHasCycle ?? false,
    };
}
