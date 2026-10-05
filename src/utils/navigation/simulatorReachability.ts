import {
    DEFAULT_INTERNET_SCREEN,
    SimulatorChannel,
    type SimulatorTemplatePayload,
    type SimulatorBrowserPage,
} from '../../types/session.js';
import {
    SimulatorEmailScreenId,
    SimulatorHomeScreenId,
    SimulatorMessagesScreenId,
    SimulatorPhoneScreenId,
} from '@signalsafe/simulator-core/devicePayload';
import { simulatorBrowserEdges } from './simulatorBrowserEdges.js';
import type { KnownAppScreenRef } from '../../types/shapes.js';
/**
 * Reachability analysis for full-device simulator templates.
 * Starting from entry_point, computes which screens and entities are reachable
 * via app switching (main menu) and in-app navigation (screens, buttons, list items).
 * Does not modify runtime behavior; analysis only.
 */

import { SimulatorApp, isSimulatorApp } from '@signalsafe/simulator-core/simulatorApp';

const PHONE_SCREENS = Object.values(SimulatorPhoneScreenId);
const HOME_SCREENS = Object.values(SimulatorHomeScreenId);

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
        screens: KnownAppScreenRef[];
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
    if (ch === SimulatorChannel.Sms) return SimulatorApp.Messages;
    if (ch === SimulatorChannel.Browser) return SimulatorApp.Internet;
    if (ch === SimulatorChannel.Phone || ch === SimulatorChannel.Contacts)
        return SimulatorApp.Phone;
    if (ch === SimulatorChannel.Home) return SimulatorApp.Home;
    if (ch === SimulatorChannel.Email) return SimulatorApp.Email;
    return null;
}

function getReachableApps(
    payload: SimulatorTemplatePayload,
    entryApp: SimulatorApp | null,
): SimulatorApp[] {
    const apps = new Set<SimulatorApp>();
    if (entryApp != null) apps.add(entryApp);
    const device = payload.device;
    if (device?.mainMenuItems != null) {
        device.mainMenuItems.forEach((item) => {
            const id = item?.id;
            if (isSimulatorApp(id)) apps.add(id);
        });
    }
    return Array.from(apps);
}

function reachableBrowserPagesTyped(
    pages: SimulatorBrowserPage[],
    startPageId: string,
): { pageIds: Set<string>; hasCycle: boolean } {
    const byId = new Map(pages.map((page) => [page.id, page]));
    const reachable = new Set<string>();
    const active = new Set<string>();
    let hasCycle = false;
    // Iterative DFS avoids call-stack overflow for large authored graphs.
    const pending = [{ id: startPageId, exiting: false }];
    for (let frame = pending.pop(); frame; frame = pending.pop()) {
        if (frame.exiting) {
            active.delete(frame.id);
            continue;
        }
        if (active.has(frame.id)) {
            hasCycle = true;
            continue;
        }
        if (reachable.has(frame.id)) continue;
        const page = byId.get(frame.id);
        if (!page) continue;
        reachable.add(frame.id);
        active.add(frame.id);
        pending.push({ id: frame.id, exiting: true });
        for (const edge of simulatorBrowserEdges(page).reverse()) {
            pending.push({ id: edge.targetPageId, exiting: false });
        }
    }
    return { pageIds: reachable, hasCycle };
}

function populateEmailReachability(
    payload: SimulatorTemplatePayload,
    reachableApps: SimulatorApp[],
    reachableScreens: Record<SimulatorApp, string[]>,
    reachableEntities: ReachabilityReport['reachableEntities'],
): void {
    if (!reachableApps.includes(SimulatorApp.Email) || payload.email == null) {
        return;
    }

    reachableScreens.email.push(SimulatorEmailScreenId.List);
    const inbox = payload.email.inbox ?? [];
    if (inbox.length === 0) {
        return;
    }

    reachableScreens.email.push(SimulatorEmailScreenId.Detail);
    inbox.forEach((row) => {
        if (row?.id != null) {
            reachableEntities.inboxMessageIds.push(row.id);
        }
    });
}

function populateMessagesReachability(
    payload: SimulatorTemplatePayload,
    reachableApps: SimulatorApp[],
    reachableScreens: Record<SimulatorApp, string[]>,
): void {
    if (!reachableApps.includes(SimulatorApp.Messages) || payload.sms == null) {
        return;
    }

    reachableScreens.messages.push(
        SimulatorMessagesScreenId.Threads,
        SimulatorMessagesScreenId.NewThread,
    );
    const messages = payload.sms.thread?.messages ?? [];
    if (messages.length > 0) {
        reachableScreens.messages.push(SimulatorMessagesScreenId.ThreadDetail);
    }
}

function populateInternetReachability(
    payload: SimulatorTemplatePayload,
    entryApp: SimulatorApp | null,
    reachableApps: SimulatorApp[],
    reachableScreens: Record<SimulatorApp, string[]>,
    reachableEntities: ReachabilityReport['reachableEntities'],
): boolean {
    if (!reachableApps.includes(SimulatorApp.Internet) || payload.browser == null) {
        return false;
    }

    const pages = payload.browser.pages ?? [];
    const pageIds = definedIds(pages);
    const pageIdSet = new Set(pageIds);
    if (pageIdSet.size === 0) {
        return false;
    }

    const defaultId = payload.browser.defaultPageId ?? pages[0]?.id ?? DEFAULT_INTERNET_SCREEN;
    let startId = pageIdSet.has(defaultId) ? defaultId : (pages[0]?.id ?? DEFAULT_INTERNET_SCREEN);
    if (entryApp === SimulatorApp.Internet && payload.entryPoint?.screen != null) {
        const entryScreen = String(payload.entryPoint.screen);
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
    reachableEntities: ReachabilityReport['reachableEntities'],
): void {
    if (!reachableApps.includes(SimulatorApp.Phone)) {
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
    reachableScreens: Record<SimulatorApp, string[]>,
): void {
    if (reachableApps.includes(SimulatorApp.Home)) {
        reachableScreens.home = [...HOME_SCREENS];
    }
}

function definedIds(items: ReadonlyArray<{ id?: string | null } | null | undefined>): string[] {
    return items.map((item) => item?.id).filter((id): id is string => Boolean(id));
}

function hasDefinedContentForApp(
    app: SimulatorApp,
    payload: SimulatorTemplatePayload,
    allBrowserIds: string[],
): boolean {
    if (app === SimulatorApp.Email) {
        return payload.email != null;
    }
    if (app === SimulatorApp.Messages) {
        return payload.sms != null;
    }
    if (app === SimulatorApp.Internet) {
        return allBrowserIds.length > 0;
    }
    if (app === SimulatorApp.Phone) {
        return payload.phone != null;
    }
    return payload.home != null;
}

function getDefinedScreensForApp(app: SimulatorApp, allBrowserIds: string[]): string[] {
    if (app === SimulatorApp.Phone) {
        return PHONE_SCREENS;
    }
    if (app === SimulatorApp.Home) {
        return HOME_SCREENS;
    }
    if (app === SimulatorApp.Internet) {
        return allBrowserIds;
    }
    if (app === SimulatorApp.Messages) {
        return [
            SimulatorMessagesScreenId.Threads,
            SimulatorMessagesScreenId.ThreadDetail,
            SimulatorMessagesScreenId.NewThread,
        ];
    }
    return [SimulatorEmailScreenId.List, SimulatorEmailScreenId.Detail];
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
    browserHasCycle = populateInternetReachability(
        payload,
        entryApp,
        reachableApps,
        reachableScreens,
        reachableEntities,
    );
    populatePhoneReachability(payload, reachableApps, reachableScreens, reachableEntities);
    populateHomeReachability(reachableApps, reachableScreens);

    // --- Unreachable: defined in payload but not reachable ---
    const allBrowserIds = definedIds(payload.browser?.pages ?? []);
    const allContactIds = definedIds(payload.contacts ?? []);
    const allInboxIds = definedIds(payload.email?.inbox ?? []);

    const unreachableScreens: KnownAppScreenRef[] = [];
    reachableApps.forEach((app) => {
        const reachableSet = new Set(reachableScreens[app]);
        for (const screen of getDefinedScreensForApp(app, allBrowserIds)) {
            if (!reachableSet.has(screen)) unreachableScreens.push({ app, screen });
        }
    });
    // Apps with content but not in reachableApps: all their screens are unreachable
    Object.values(SimulatorApp).forEach((app) => {
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
