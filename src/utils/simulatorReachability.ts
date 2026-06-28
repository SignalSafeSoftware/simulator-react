/**
 * Reachability analysis for full-device simulator templates.
 * Starting from entry_point, computes which screens and entities are reachable
 * via app switching (main menu) and in-app navigation (screens, buttons, list items).
 * Does not modify runtime behavior; analysis only.
 */

import type { SimulatorTemplatePayload } from '../types/session.js';
import type { SimulatorApp } from '../types/portableSimulator.js';

const PHONE_SCREENS: string[] = ['history', 'contacts', 'dial', 'incoming_call', 'voicemail', 'directory'];
const HOME_SCREENS: string[] = ['home', 'store', 'settings'];

export interface ReachabilityReport {
    /** App that is the entry (from entry_point or channel). */
    entryApp: SimulatorApp | null;
    /** Apps that can be opened (entry + main menu). */
    reachableApps: SimulatorApp[];
    /** Screen ids per app that are reachable. */
    reachableScreens: Record<SimulatorApp, string[]>;
    /** Entity ids that are reachable (contacts, inbox, browser pages). */
    reachableEntities: {
        contacts: string[];
        inboxMessageIds: string[];
        browserPageIds: string[];
    };
    /** Screens/entities defined in payload but not reachable. */
    unreachable: {
        screens: Array<{ app: SimulatorApp; screen: string }>;
        contacts: string[];
        inboxMessageIds: string[];
        browserPageIds: string[];
    };
    /** When true, browser graph has at least one cycle (e.g. A → B → A). */
    browserHasCycle: boolean;
}

function getEntryApp(payload: SimulatorTemplatePayload): SimulatorApp | null {
    const ep = payload.entryPoint;
    if (ep?.app != null) return ep.app;
    const ch = payload.channel;
    if (ch === 'sms') return 'messages';
    if (ch === 'browser') return 'internet';
    if (ch === 'phone' || ch === 'contacts') return 'phone';
    if (ch === 'home') return 'home';
    if (ch === 'email') return 'email';
    return null;
}

function getReachableApps(payload: SimulatorTemplatePayload, entryApp: SimulatorApp | null): SimulatorApp[] {
    const apps = new Set<SimulatorApp>();
    if (entryApp != null) apps.add(entryApp);
    const device = payload.device;
    if (device?.mainMenuItems != null) {
        device.mainMenuItems.forEach((item) => {
            const id = item?.id;
            if (typeof id === 'string' && isApp(id)) apps.add(id as SimulatorApp);
        });
    }
    return Array.from(apps);
}

function isApp(s: string): boolean {
    return ['email', 'messages', 'internet', 'phone', 'home'].includes(s);
}

interface BrowserPageLike {
    id?: string;
    buttons?: Array<{ targetPageId?: string }>;
}

function reachableBrowserPagesTyped(
    pages: BrowserPageLike[],
    startPageId: string
): { pageIds: Set<string>; hasCycle: boolean } {
    const idToPage = new Map<string, BrowserPageLike>();
    pages.forEach((p) => {
        if (p?.id != null) idToPage.set(p.id, p);
    });
    const reachable = new Set<string>();
    let hasCycle = false;
    const queue: string[] = [startPageId];
    reachable.add(startPageId);
    while (queue.length > 0) {
        const pageId = queue.shift()!;
        const page = idToPage.get(pageId);
        const buttons = page?.buttons ?? [];
        for (const btn of buttons) {
            const target = btn.targetPageId;
            if (target == null || target === '') continue;
            if (reachable.has(target)) {
                hasCycle = true;
                continue;
            }
            reachable.add(target);
            queue.push(target);
        }
    }
    return { pageIds: reachable, hasCycle };
}

function populateEmailReachability(
    payload: SimulatorTemplatePayload,
    reachableApps: SimulatorApp[],
    reachableScreens: Record<SimulatorApp, string[]>,
    reachableEntities: ReachabilityReport['reachableEntities']
): void {
    if (!reachableApps.includes('email') || payload.email == null) {
        return;
    }

    reachableScreens.email.push('list');
    const inbox = payload.email.inbox ?? [];
    if (inbox.length === 0) {
        return;
    }

    reachableScreens.email.push('detail');
    inbox.forEach((row) => {
        if (row?.id != null) {
            reachableEntities.inboxMessageIds.push(row.id);
        }
    });
}

function populateMessagesReachability(
    payload: SimulatorTemplatePayload,
    reachableApps: SimulatorApp[],
    reachableScreens: Record<SimulatorApp, string[]>
): void {
    if (!reachableApps.includes('messages') || payload.sms == null) {
        return;
    }

    reachableScreens.messages.push('threads', 'new_thread');
    const messages = payload.sms.thread?.messages ?? [];
    if (messages.length > 0) {
        reachableScreens.messages.push('thread_detail');
    }
}

function populateInternetReachability(
    payload: SimulatorTemplatePayload,
    entryApp: SimulatorApp | null,
    reachableApps: SimulatorApp[],
    reachableScreens: Record<SimulatorApp, string[]>,
    reachableEntities: ReachabilityReport['reachableEntities']
): boolean {
    if (!reachableApps.includes('internet') || payload.browser == null) {
        return false;
    }

    const pages = payload.browser.pages ?? [];
    const pageIds = pages.map((page) => page?.id).filter((id): id is string => Boolean(id));
    const pageIdSet = new Set(pageIds);
    if (pageIdSet.size === 0) {
        return false;
    }

    const defaultId = payload.browser.defaultPageId ?? pages[0]?.id ?? 'landing';
    let startId = pageIdSet.has(defaultId) ? defaultId : (pages[0]?.id ?? 'landing');
    if (entryApp === 'internet' && payload.entryPoint?.screen != null) {
        const entryScreen = String(payload.entryPoint.screen).toLowerCase();
        if (pageIdSet.has(entryScreen)) {
            startId = entryScreen;
        }
    }

    const { pageIds: reachablePageIds, hasCycle } = reachableBrowserPagesTyped(pages, startId);
    reachableScreens.internet = Array.from(reachablePageIds);
    reachableEntities.browserPageIds = Array.from(reachablePageIds);
    return hasCycle;
}

function populatePhoneReachability(
    payload: SimulatorTemplatePayload,
    reachableApps: SimulatorApp[],
    reachableScreens: Record<SimulatorApp, string[]>,
    reachableEntities: ReachabilityReport['reachableEntities']
): void {
    if (!reachableApps.includes('phone')) {
        return;
    }

    reachableScreens.phone = [...PHONE_SCREENS];
    const contacts = payload.contacts ?? [];
    if (!Array.isArray(contacts)) {
        return;
    }

    contacts.forEach((contact) => {
        if (contact?.id != null) {
            reachableEntities.contacts.push(contact.id);
        }
    });
}

function populateHomeReachability(
    reachableApps: SimulatorApp[],
    reachableScreens: Record<SimulatorApp, string[]>
): void {
    if (reachableApps.includes('home')) {
        reachableScreens.home = [...HOME_SCREENS];
    }
}

function getAllBrowserIds(payload: SimulatorTemplatePayload): string[] {
    return (payload.browser?.pages ?? []).map((page) => page?.id).filter((id): id is string => Boolean(id));
}

function getAllContactIds(payload: SimulatorTemplatePayload): string[] {
    return (payload.contacts ?? [])
        .map((contact) => contact?.id)
        .filter((id): id is string => Boolean(id));
}

function getAllInboxIds(payload: SimulatorTemplatePayload): string[] {
    return (payload.email?.inbox ?? []).map((row) => row?.id).filter((id): id is string => Boolean(id));
}

function appendReachableAppUnreachables(
    app: SimulatorApp,
    reachableScreens: Record<SimulatorApp, string[]>,
    allBrowserIds: string[],
    unreachableScreens: Array<{ app: SimulatorApp; screen: string }>
): void {
    const reachableSet = new Set(reachableScreens[app]);
    if (app === 'email') {
        ['list', 'detail'].forEach((screen) => {
            if (!reachableSet.has(screen)) {
                unreachableScreens.push({ app, screen });
            }
        });
        return;
    }

    if (app === 'messages') {
        ['threads', 'thread_detail', 'new_thread'].forEach((screen) => {
            if (!reachableSet.has(screen)) {
                unreachableScreens.push({ app, screen });
            }
        });
        return;
    }

    if (app === 'internet') {
        allBrowserIds.forEach((pageId) => {
            if (!reachableSet.has(pageId)) {
                unreachableScreens.push({ app, screen: pageId });
            }
        });
    }
}

function hasDefinedContentForApp(
    app: SimulatorApp,
    payload: SimulatorTemplatePayload,
    allBrowserIds: string[]
): boolean {
    if (app === 'email') {
        return payload.email != null;
    }
    if (app === 'messages') {
        return payload.sms != null;
    }
    if (app === 'internet') {
        return allBrowserIds.length > 0;
    }
    if (app === 'phone') {
        return payload.phone != null;
    }
    return payload.home != null;
}

function getDefinedScreensForApp(app: SimulatorApp, allBrowserIds: string[]): string[] {
    if (app === 'phone') {
        return PHONE_SCREENS;
    }
    if (app === 'home') {
        return HOME_SCREENS;
    }
    if (app === 'internet') {
        return allBrowserIds;
    }
    if (app === 'messages') {
        return ['threads', 'thread_detail', 'new_thread'];
    }
    return ['list', 'detail'];
}

/**
 * Compute reachability for a validated simulator template payload.
 * Safe to call on any payload; does not throw.
 */
export function analyzeReachability(payload: SimulatorTemplatePayload): ReachabilityReport {
    const entryApp = getEntryApp(payload);
    const reachableApps = getReachableApps(payload, entryApp);

    const reachableScreens: Record<SimulatorApp, string[]> = {
        email: [],
        messages: [],
        internet: [],
        phone: [],
        home: [],
    };

    const reachableEntities = {
        contacts: [] as string[],
        inboxMessageIds: [] as string[],
        browserPageIds: [] as string[],
    };

    let browserHasCycle = false;

    populateEmailReachability(payload, reachableApps, reachableScreens, reachableEntities);
    populateMessagesReachability(payload, reachableApps, reachableScreens);
    browserHasCycle = populateInternetReachability(payload, entryApp, reachableApps, reachableScreens, reachableEntities);
    populatePhoneReachability(payload, reachableApps, reachableScreens, reachableEntities);
    populateHomeReachability(reachableApps, reachableScreens);

    // --- Unreachable: defined in payload but not reachable ---
    const allBrowserIds = getAllBrowserIds(payload);
    const allContactIds = getAllContactIds(payload);
    const allInboxIds = getAllInboxIds(payload);

    const unreachableScreens: Array<{ app: SimulatorApp; screen: string }> = [];
    reachableApps.forEach((app) => {
        appendReachableAppUnreachables(app, reachableScreens, allBrowserIds, unreachableScreens);
        // phone/home: all screens reachable when app is, so nothing to add
    });
    // Apps with content but not in reachableApps: all their screens are unreachable
    (['email', 'messages', 'internet', 'phone', 'home'] as const).forEach((app) => {
        if (reachableApps.includes(app) || !hasDefinedContentForApp(app, payload, allBrowserIds)) {
            return;
        }
        const screens = getDefinedScreensForApp(app, allBrowserIds);
        screens.forEach((s) => unreachableScreens.push({ app, screen: s }));
    });

    const reachableContactSet = new Set(reachableEntities.contacts);
    const reachableInboxSet = new Set(reachableEntities.inboxMessageIds);
    const reachablePageSet = new Set(reachableEntities.browserPageIds);

    const unreachableBrowserPageIds = allBrowserIds.filter((id) => !reachablePageSet.has(id));

    return {
        entryApp,
        reachableApps,
        reachableScreens,
        reachableEntities,
        unreachable: {
            screens: unreachableScreens,
            contacts: allContactIds.filter((id) => !reachableContactSet.has(id)),
            inboxMessageIds: allInboxIds.filter((id) => !reachableInboxSet.has(id)),
            browserPageIds: unreachableBrowserPageIds,
        },
        browserHasCycle,
    };
}
