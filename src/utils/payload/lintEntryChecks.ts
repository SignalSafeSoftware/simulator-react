import { DEFAULT_INTERNET_SCREEN, type SimulatorTemplatePayload } from '../../types/session.js';
import { ownValue } from '../lookup.js';
import { SimulatorLintCode, type SimulatorLintWarning } from './lintSimulatorPayload.js';
import { PayloadSection } from './payloadSections.js';
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

import { add } from './lintHelpers.js';

export function lintEmailEntry(
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
            PayloadSection.EntryPoint,
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
            PayloadSection.EntryPoint,
        );
    }
}

export function lintMessagesEntry(
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
            PayloadSection.EntryPoint,
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
            PayloadSection.EntryPoint,
        );
    }
}

export function lintInternetEntry(
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
            PayloadSection.EntryPoint,
        );
        return;
    }
    if (screen != null && screen !== DEFAULT_INTERNET_SCREEN && !pageIds.has(screen)) {
        add(
            warnings,
            SimulatorLintCode.EntryPointUnreachable,
            `Entry screen "${entryPoint?.screen}" is not in browser.pages; user will see default page.`,
            PayloadSection.EntryPoint,
        );
    }
}

export function lintPhoneEntry(
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
            PayloadSection.EntryPoint,
        );
    }
}

export function lintHomeEntry(
    payload: SimulatorTemplatePayload,
    warnings: SimulatorLintWarning[],
): void {
    const widgets = payload.home?.widgets ?? [];
    const apps = payload.home?.featuredApps ?? [];
    if (widgets.length === 0 && apps.length === 0) {
        add(
            warnings,
            SimulatorLintCode.EntryAppEmpty,
            englishLocale.t(
                'copy.lintSimulatorPayload.entry.point.is.home.but.widgets.and.featured.apps.are.empty',
            ),
            PayloadSection.EntryPoint,
        );
    }
}

type EntryLinter = (
    payload: SimulatorTemplatePayload,
    screen: string | null,
    entryPoint: SimulatorTemplatePayload['entryPoint'],
    warnings: SimulatorLintWarning[],
) => void;

export const ENTRY_LINTERS: Readonly<Record<SimulatorApp, EntryLinter>> = Object.freeze({
    [SimulatorApp.Email]: (payload, screen, _entryPoint, warnings) =>
        lintEmailEntry(payload, screen, warnings),
    [SimulatorApp.Messages]: (payload, screen, _entryPoint, warnings) =>
        lintMessagesEntry(payload, screen, warnings),
    [SimulatorApp.Internet]: lintInternetEntry,
    [SimulatorApp.Phone]: (payload, screen, _entryPoint, warnings) =>
        lintPhoneEntry(payload, screen, warnings),
    [SimulatorApp.Home]: (payload, _screen, _entryPoint, warnings) =>
        lintHomeEntry(payload, warnings),
});

export function lintEntryAppContent(
    payload: SimulatorTemplatePayload,
    app: string | null,
    screen: string | null,
    entryPoint: SimulatorTemplatePayload['entryPoint'],
    warnings: SimulatorLintWarning[],
): void {
    ownValue(ENTRY_LINTERS, app ?? '')?.(payload, screen, entryPoint, warnings);
}
