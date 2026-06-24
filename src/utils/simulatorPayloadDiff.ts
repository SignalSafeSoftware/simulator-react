/**
 * Lightweight diff for simulator payloads (simulator_json).
 * Produces a short, meaning-focused summary of changes for authors/admins.
 * Simulator-scoped only; no generic JSON diff.
 */

import { isRecord } from '@signalsafe/tree-spec';

export interface SimulatorDiffItem {
    /** Section that changed (e.g. "entry_point", "contacts", "email"). */
    section: string;
    /** One-line summary (e.g. "Entry point: email/list → messages/thread_detail"). */
    change: string;
    /** Optional detail (e.g. ids added/removed). */
    detail?: string;
}

function getEntryPoint(p: Record<string, unknown>): { app: string; screen: string } | null {
    const ep = p?.entry_point;
    if (!isRecord(ep)) return null;
    const app = typeof ep.app === 'string' ? ep.app : '';
    const screen = typeof ep.screen === 'string' ? ep.screen : '';
    return app ? { app, screen } : null;
}

function idsFromArray(arr: unknown): string[] {
    if (!Array.isArray(arr)) return [];
    return arr
        .map((item) => (isRecord(item) && typeof item.id === 'string' ? item.id : ''))
        .filter(Boolean);
}

function setDiff(left: string[], right: string[]): { added: string[]; removed: string[] } {
    const l = new Set(left);
    const r = new Set(right);
    return {
        added: right.filter((id) => !l.has(id)),
        removed: left.filter((id) => !r.has(id)),
    };
}

function entryPointLabel(entryPoint: { app: string; screen: string } | null): string {
    return entryPoint ? `${entryPoint.app}/${entryPoint.screen}` : '(none)';
}

function idsFromNamedSection(
    payload: Record<string, unknown>,
    section: string
): string[] {
    return idsFromArray(payload[section]);
}

function summarizeDiffItems(items: string[], prefix: '+' | '-'): string {
    return `${prefix}${items.length} (${items.slice(0, 5).join(', ')}${items.length > 5 ? '…' : ''})`;
}

function formatUnknownValue(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
        return `${value}`;
    }
    if (value == null) {
        return '(none)';
    }
    try {
        const json = JSON.stringify(value);
        return json ?? '(none)';
    } catch {
        return '(unserializable)';
    }
}

function addEntryPointDiff(
    out: SimulatorDiffItem[],
    left: Record<string, unknown>,
    right: Record<string, unknown>
): void {
    const leftLabel = entryPointLabel(getEntryPoint(left));
    const rightLabel = entryPointLabel(getEntryPoint(right));
    if (leftLabel === rightLabel) return;
    out.push({
        section: 'entry_point',
        change: `Entry point: ${leftLabel} → ${rightLabel}`,
    });
}

function addDeviceDiff(
    out: SimulatorDiffItem[],
    left: Record<string, unknown>,
    right: Record<string, unknown>
): void {
    const leftDevice = isRecord(left.device) ? left.device : {};
    const rightDevice = isRecord(right.device) ? right.device : {};
    const leftMenu = idsFromArray(leftDevice.main_menu_items);
    const rightMenu = idsFromArray(rightDevice.main_menu_items);
    const leftMenuKey = JSON.stringify([...leftMenu].sort((leftId, rightId) => leftId.localeCompare(rightId)));
    const rightMenuKey = JSON.stringify([...rightMenu].sort((leftId, rightId) => leftId.localeCompare(rightId)));

    if (leftMenu.length !== rightMenu.length || leftMenuKey !== rightMenuKey) {
        out.push({
            section: 'device',
            change: `Device menu: ${leftMenu.length} → ${rightMenu.length} items`,
            detail: leftMenu.length === rightMenu.length ? 'Order or ids changed' : undefined,
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
                `${app}: ${formatUnknownValue(leftDefaults[app])} → ${formatUnknownValue(rightDefaults[app])}`
            );
        }
    });

    if (defaultChanges.length > 0) {
        out.push({
            section: 'device',
            change: 'Device secondary_defaults changed',
            detail: defaultChanges.join('; '),
        });
    }
}

function addCollectionDiff(
    out: SimulatorDiffItem[],
    section: string,
    label: string,
    leftIds: string[],
    rightIds: string[],
    detailBuilder: (diff: { added: string[]; removed: string[] }) => string | undefined
): void {
    const diff = setDiff(leftIds, rightIds);
    if (diff.added.length === 0 && diff.removed.length === 0) return;
    out.push({
        section,
        change: `${label}: ${leftIds.length} → ${rightIds.length}`,
        detail: detailBuilder(diff),
    });
}

function addPhoneDiff(
    out: SimulatorDiffItem[],
    left: Record<string, unknown>,
    right: Record<string, unknown>
): void {
    const leftPhone = left.phone as Record<string, unknown> | undefined;
    const rightPhone = right.phone as Record<string, unknown> | undefined;
    const leftHasIncoming = isRecord(leftPhone?.incoming_call);
    const rightHasIncoming = isRecord(rightPhone?.incoming_call);
    if (leftHasIncoming !== rightHasIncoming) {
        out.push({
            section: 'phone',
            change: rightHasIncoming ? 'Phone: incoming_call added' : 'Phone: incoming_call removed',
        });
    }

    const leftHistoryLength = Array.isArray(leftPhone?.history) ? (leftPhone.history as unknown[]).length : 0;
    const rightHistoryLength = Array.isArray(rightPhone?.history) ? (rightPhone.history as unknown[]).length : 0;
    if (leftHistoryLength !== rightHistoryLength) {
        out.push({
            section: 'phone',
            change: `Phone history: ${leftHistoryLength} → ${rightHistoryLength} entries`,
        });
    }
}

function addEmailDiff(
    out: SimulatorDiffItem[],
    left: Record<string, unknown>,
    right: Record<string, unknown>
): void {
    const leftEmail = left.email as Record<string, unknown> | undefined;
    const rightEmail = right.email as Record<string, unknown> | undefined;
    const leftInbox = idsFromArray(leftEmail?.messages ?? []);
    const rightInbox = idsFromArray(rightEmail?.messages ?? []);

    addCollectionDiff(out, 'email', 'Email inbox', leftInbox, rightInbox, (diff) => {
        const details = [...diff.added.map((id) => `+${id}`), ...diff.removed.map((id) => `-${id}`)];
        return details.slice(0, 8).join(', ') + (details.length > 8 ? '…' : '');
    });

    const leftDetailSubject = isRecord(leftEmail?.detail)
        ? leftEmail.detail.subject
        : undefined;
    const rightDetailSubject = isRecord(rightEmail?.detail)
        ? rightEmail.detail.subject
        : undefined;
    if (String(leftDetailSubject) !== String(rightDetailSubject)) {
        out.push({
            section: 'email',
            change: 'Email detail (subject) changed',
        });
    }
}

function addMessagesDiff(
    out: SimulatorDiffItem[],
    left: Record<string, unknown>,
    right: Record<string, unknown>
): void {
    const leftMessages = left.messages as Record<string, unknown> | undefined;
    const rightMessages = right.messages as Record<string, unknown> | undefined;
    const leftThreads = Array.isArray(leftMessages?.threads) ? (leftMessages.threads as unknown[]).length : 0;
    const rightThreads = Array.isArray(rightMessages?.threads) ? (rightMessages.threads as unknown[]).length : 0;
    if (leftThreads !== rightThreads) {
        out.push({
            section: 'messages',
            change: `Messages threads: ${leftThreads} → ${rightThreads}`,
        });
    }

    const leftThreadDetail = isRecord(leftMessages?.thread_detail)
        ? leftMessages.thread_detail
        : {};
    const rightThreadDetail = isRecord(rightMessages?.thread_detail)
        ? rightMessages.thread_detail
        : {};
    const leftMessageCount = Array.isArray(leftThreadDetail.messages)
        ? (leftThreadDetail.messages as unknown[]).length
        : 0;
    const rightMessageCount = Array.isArray(rightThreadDetail.messages)
        ? (rightThreadDetail.messages as unknown[]).length
        : 0;
    if (leftMessageCount !== rightMessageCount) {
        out.push({
            section: 'messages',
            change: `Messages thread_detail: ${leftMessageCount} → ${rightMessageCount} messages`,
        });
    }
}

function addInternetDiff(
    out: SimulatorDiffItem[],
    left: Record<string, unknown>,
    right: Record<string, unknown>
): void {
    const leftInternet = left.internet as Record<string, unknown> | undefined;
    const rightInternet = right.internet as Record<string, unknown> | undefined;
    const leftPages = idsFromArray(leftInternet?.pages ?? []);
    const rightPages = idsFromArray(rightInternet?.pages ?? []);
    addCollectionDiff(out, 'internet', 'Browser pages', leftPages, rightPages, (diff) => {
        const details = [...diff.added.map((id) => `+${id}`), ...diff.removed.map((id) => `-${id}`)].join(', ');
        return details || undefined;
    });

    if (out.length > 0) {
        const last = out.at(-1);
        if (last?.section === 'internet' && last.change === `Browser pages: ${leftPages.length} → ${rightPages.length}`) {
            last.change = `Browser pages: ${leftPages.join(', ') || '(none)'} → ${rightPages.join(', ') || '(none)'}`;
        }
    }

    const leftForms = Array.isArray(leftInternet?.forms) ? (leftInternet.forms as unknown[]).length : 0;
    const rightForms = Array.isArray(rightInternet?.forms) ? (rightInternet.forms as unknown[]).length : 0;
    if (leftForms !== rightForms) {
        out.push({
            section: 'internet',
            change: `Browser forms: ${leftForms} → ${rightForms}`,
        });
    }
}

function addHomeDiff(
    out: SimulatorDiffItem[],
    left: Record<string, unknown>,
    right: Record<string, unknown>
): void {
    const leftHome = left.home as Record<string, unknown> | undefined;
    const rightHome = right.home as Record<string, unknown> | undefined;
    const leftWidgets = Array.isArray(leftHome?.widgets) ? (leftHome.widgets as unknown[]).length : 0;
    const rightWidgets = Array.isArray(rightHome?.widgets) ? (rightHome.widgets as unknown[]).length : 0;
    const leftStoreApps =
        isRecord(leftHome?.store) && Array.isArray(leftHome.store.featured_apps)
            ? (leftHome.store.featured_apps as unknown[]).length
            : 0;
    const rightStoreApps =
        isRecord(rightHome?.store) && Array.isArray(rightHome.store.featured_apps)
            ? (rightHome.store.featured_apps as unknown[]).length
            : 0;
    const leftSettingsSections =
        isRecord(leftHome?.settings) && Array.isArray(leftHome.settings.sections)
            ? (leftHome.settings.sections as unknown[]).length
            : 0;
    const rightSettingsSections =
        isRecord(rightHome?.settings) && Array.isArray(rightHome.settings.sections)
            ? (rightHome.settings.sections as unknown[]).length
            : 0;

    if (
        leftWidgets !== rightWidgets ||
        leftStoreApps !== rightStoreApps ||
        leftSettingsSections !== rightSettingsSections
    ) {
        out.push({
            section: 'home',
            change: `Home: widgets ${leftWidgets}→${rightWidgets}, store apps ${leftStoreApps}→${rightStoreApps}, settings sections ${leftSettingsSections}→${rightSettingsSections}`,
        });
    }
}

/**
 * Compare two simulator payloads and return a list of meaningful changes.
 * Order: entry_point, device, contacts, directory, phone, email, messages, internet, home.
 */
export function diffSimulatorPayloads(
    left: Record<string, unknown>,
    right: Record<string, unknown>
): SimulatorDiffItem[] {
    const out: SimulatorDiffItem[] = [];
    addEntryPointDiff(out, left, right);
    addDeviceDiff(out, left, right);

    const leftContacts = idsFromNamedSection(left, 'contacts');
    const rightContacts = idsFromNamedSection(right, 'contacts');
    addCollectionDiff(out, 'contacts', 'Contacts', leftContacts, rightContacts, (diff) => {
        const details: string[] = [];
        if (diff.added.length > 0) details.push(summarizeDiffItems(diff.added, '+'));
        if (diff.removed.length > 0) details.push(summarizeDiffItems(diff.removed, '-'));
        return details.join('; ');
    });

    const leftDirectory = idsFromNamedSection(left, 'directory');
    const rightDirectory = idsFromNamedSection(right, 'directory');
    addCollectionDiff(out, 'directory', 'Directory', leftDirectory, rightDirectory, (diff) =>
        [...diff.added.map((id) => `+${id}`), ...diff.removed.map((id) => `-${id}`)].join(', ')
    );
    if (out.length > 0) {
        const last = out.at(-1);
        if (last?.section === 'directory' && last.change === `Directory: ${leftDirectory.length} → ${rightDirectory.length}`) {
            last.change = `Directory: ${leftDirectory.length} → ${rightDirectory.length} entries`;
        }
    }

    addPhoneDiff(out, left, right);
    addEmailDiff(out, left, right);
    addMessagesDiff(out, left, right);
    addInternetDiff(out, left, right);
    addHomeDiff(out, left, right);

    return out;
}
