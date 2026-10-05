import { englishLocale } from '../../i18n/englishLocale.js';
import { PayloadSection } from './payloadSections.js';
import type { SimulatorDiffItem } from './simulatorPayloadDiff.js';
/**
 * Lightweight diff for simulator payloads (simulator_json).
 * Produces a short, meaning-focused summary of changes for authors/admins.
 * Simulator-scoped only; no generic JSON diff.
 */

import { isRecord } from '@signalsafe/tree-spec';

import {
    arrayLength,
    childArrayLength,
    formatUnknownValue,
    getEntryPoint,
    entryPointLabel,
    idsFromArray,
    recordOrUndefined,
    setDiff,
} from './payloadDiffHelpers.js';

export function addEntryPointDiff(
    out: SimulatorDiffItem[],
    left: Record<string, unknown>,
    right: Record<string, unknown>,
): void {
    const leftLabel = entryPointLabel(getEntryPoint(left));
    const rightLabel = entryPointLabel(getEntryPoint(right));
    if (leftLabel === rightLabel) return;
    out.push({
        section: PayloadSection.EntryPoint,
        change: `Entry point: ${leftLabel} → ${rightLabel}`,
    });
}

export function addDeviceDiff(
    out: SimulatorDiffItem[],
    left: Record<string, unknown>,
    right: Record<string, unknown>,
): void {
    const leftDevice = isRecord(left.device) ? left.device : {};
    const rightDevice = isRecord(right.device) ? right.device : {};
    const leftMenu = idsFromArray(leftDevice.main_menu_items);
    const rightMenu = idsFromArray(rightDevice.main_menu_items);
    const leftMenuKey = JSON.stringify(
        [...leftMenu].sort((leftId, rightId) => leftId.localeCompare(rightId)),
    );
    const rightMenuKey = JSON.stringify(
        [...rightMenu].sort((leftId, rightId) => leftId.localeCompare(rightId)),
    );

    if (leftMenu.length !== rightMenu.length || leftMenuKey !== rightMenuKey) {
        out.push({
            section: PayloadSection.Device,
            change: `Device menu: ${leftMenu.length} → ${rightMenu.length} items`,
            detail:
                leftMenu.length === rightMenu.length
                    ? englishLocale.t('copy.simulatorPayloadDiff.order.or.ids.changed')
                    : undefined,
        });
    }

    const leftDefaults = isRecord(leftDevice.secondary_defaults)
        ? leftDevice.secondary_defaults
        : {};
    const rightDefaults = isRecord(rightDevice.secondary_defaults)
        ? rightDevice.secondary_defaults
        : {};
    const apps = new Set([...Object.keys(leftDefaults), ...Object.keys(rightDefaults)]);
    const defaultChanges: string[] = [];

    apps.forEach((app) => {
        if (leftDefaults[app] !== rightDefaults[app]) {
            defaultChanges.push(
                `${app}: ${formatUnknownValue(leftDefaults[app])} → ${formatUnknownValue(rightDefaults[app])}`,
            );
        }
    });

    if (defaultChanges.length > 0) {
        out.push({
            section: PayloadSection.Device,
            change: englishLocale.t('copy.simulatorPayloadDiff.device.secondary.defaults.changed'),
            detail: defaultChanges.join('; '),
        });
    }
}

export function addCollectionDiff(
    out: SimulatorDiffItem[],
    section: string,
    label: string,
    leftIds: string[],
    rightIds: string[],
    detailBuilder: (diff: { added: string[]; removed: string[] }) => string | undefined,
): void {
    const diff = setDiff(leftIds, rightIds);
    if (diff.added.length === 0 && diff.removed.length === 0) return;
    out.push({
        section,
        change: `${label}: ${leftIds.length} → ${rightIds.length}`,
        detail: detailBuilder(diff),
    });
}

export function addPhoneDiff(
    out: SimulatorDiffItem[],
    left: Record<string, unknown>,
    right: Record<string, unknown>,
): void {
    const leftPhone = recordOrUndefined(left.phone);
    const rightPhone = recordOrUndefined(right.phone);
    const leftHasIncoming = isRecord(leftPhone?.incoming_call);
    const rightHasIncoming = isRecord(rightPhone?.incoming_call);
    if (leftHasIncoming !== rightHasIncoming) {
        out.push({
            section: PayloadSection.Phone,
            change: rightHasIncoming
                ? englishLocale.t('copy.simulatorPayloadDiff.phone.incoming.call.added')
                : englishLocale.t('copy.simulatorPayloadDiff.phone.incoming.call.removed'),
        });
    }

    const leftHistoryLength = arrayLength(leftPhone?.history);
    const rightHistoryLength = arrayLength(rightPhone?.history);
    if (leftHistoryLength !== rightHistoryLength) {
        out.push({
            section: PayloadSection.Phone,
            change: `Phone history: ${leftHistoryLength} → ${rightHistoryLength} entries`,
        });
    }
}

export function addEmailDiff(
    out: SimulatorDiffItem[],
    left: Record<string, unknown>,
    right: Record<string, unknown>,
): void {
    const leftEmail = recordOrUndefined(left.email);
    const rightEmail = recordOrUndefined(right.email);
    const leftInbox = idsFromArray(leftEmail?.messages ?? []);
    const rightInbox = idsFromArray(rightEmail?.messages ?? []);

    addCollectionDiff(
        out,
        PayloadSection.Email,
        englishLocale.t('copy.simulatorPayloadDiff.email.inbox'),
        leftInbox,
        rightInbox,
        (diff) => {
            const details = [
                ...diff.added.map((id) => `+${id}`),
                ...diff.removed.map((id) => `-${id}`),
            ];
            return details.slice(0, 8).join(', ') + (details.length > 8 ? '…' : '');
        },
    );

    const leftDetailSubject = isRecord(leftEmail?.detail) ? leftEmail.detail.subject : undefined;
    const rightDetailSubject = isRecord(rightEmail?.detail) ? rightEmail.detail.subject : undefined;
    if (String(leftDetailSubject) !== String(rightDetailSubject)) {
        out.push({
            section: PayloadSection.Email,
            change: englishLocale.t('copy.simulatorPayloadDiff.email.detail.subject.changed'),
        });
    }
}

export function addMessagesDiff(
    out: SimulatorDiffItem[],
    left: Record<string, unknown>,
    right: Record<string, unknown>,
): void {
    const leftMessages = recordOrUndefined(left.messages);
    const rightMessages = recordOrUndefined(right.messages);
    const leftThreads = arrayLength(leftMessages?.threads);
    const rightThreads = arrayLength(rightMessages?.threads);
    if (leftThreads !== rightThreads) {
        out.push({
            section: PayloadSection.Messages,
            change: `Messages threads: ${leftThreads} → ${rightThreads}`,
        });
    }

    const leftMessageCount = childArrayLength(leftMessages, 'thread_detail', 'messages');
    const rightMessageCount = childArrayLength(rightMessages, 'thread_detail', 'messages');
    if (leftMessageCount !== rightMessageCount) {
        out.push({
            section: PayloadSection.Messages,
            change: `Messages thread_detail: ${leftMessageCount} → ${rightMessageCount} messages`,
        });
    }
}

export function addInternetDiff(
    out: SimulatorDiffItem[],
    left: Record<string, unknown>,
    right: Record<string, unknown>,
): void {
    const leftInternet = recordOrUndefined(left.internet);
    const rightInternet = recordOrUndefined(right.internet);
    const leftPages = idsFromArray(leftInternet?.pages ?? []);
    const rightPages = idsFromArray(rightInternet?.pages ?? []);
    addCollectionDiff(
        out,
        PayloadSection.Internet,
        englishLocale.t('copy.simulatorPayloadDiff.browser.pages'),
        leftPages,
        rightPages,
        (diff) => {
            const details = [
                ...diff.added.map((id) => `+${id}`),
                ...diff.removed.map((id) => `-${id}`),
            ].join(', ');
            return details;
        },
    );

    if (out.length > 0) {
        const last = out.at(-1);
        if (
            last?.section === PayloadSection.Internet &&
            last.change === `Browser pages: ${leftPages.length} → ${rightPages.length}`
        ) {
            last.change = `Browser pages: ${leftPages.join(', ') || '(none)'} → ${rightPages.join(', ') || '(none)'}`;
        }
    }

    const leftForms = arrayLength(leftInternet?.forms);
    const rightForms = arrayLength(rightInternet?.forms);
    if (leftForms !== rightForms) {
        out.push({
            section: PayloadSection.Internet,
            change: `Browser forms: ${leftForms} → ${rightForms}`,
        });
    }
}

export function addHomeDiff(
    out: SimulatorDiffItem[],
    left: Record<string, unknown>,
    right: Record<string, unknown>,
): void {
    const leftHome = recordOrUndefined(left.home);
    const rightHome = recordOrUndefined(right.home);
    const leftWidgets = arrayLength(leftHome?.widgets);
    const rightWidgets = arrayLength(rightHome?.widgets);
    const leftStoreApps = childArrayLength(leftHome, 'store', 'featured_apps');
    const rightStoreApps = childArrayLength(rightHome, 'store', 'featured_apps');
    const leftSettingsSections = childArrayLength(leftHome, 'settings', 'sections');
    const rightSettingsSections = childArrayLength(rightHome, 'settings', 'sections');

    if (
        leftWidgets !== rightWidgets ||
        leftStoreApps !== rightStoreApps ||
        leftSettingsSections !== rightSettingsSections
    ) {
        out.push({
            section: PayloadSection.Home,
            change: `Home: widgets ${leftWidgets}→${rightWidgets}, store apps ${leftStoreApps}→${rightStoreApps}, settings sections ${leftSettingsSections}→${rightSettingsSections}`,
        });
    }
}
