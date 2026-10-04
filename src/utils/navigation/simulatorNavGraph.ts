import { DEFAULT_INTERNET_SCREEN } from '../../types/session.js';
import { SimulatorActionType } from '../telemetry/simulatorActionTaxonomy.js';
/**
 * Navigation graph for simulator templates: apps, screens, and declarative action transitions.
 * Used for export and debug only; no TreeSpec branching. Semantics are simulator navigation only.
 */

import type { SimulatorTemplatePayload } from '../../types/session.js';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import { simulatorBrowserEdges } from './simulatorBrowserEdges.js';
import {
    SimulatorEmailScreenId,
    SimulatorHomeScreenId,
    SimulatorMessagesScreenId,
    SimulatorPhoneScreenId,
} from '@signalsafe/simulator-core/devicePayload';
import { analyzeReachability } from './simulatorReachability.js';

const APPS = Object.values(SimulatorApp);
const PHONE_SCREENS = Object.values(SimulatorPhoneScreenId);
const HOME_SCREENS = Object.values(SimulatorHomeScreenId);

export interface SimulatorNavGraphNode {
    /** Unique id: app:screen (e.g. email:list, internet:landing). */
    id: string;
    app: SimulatorApp;
    screen: string;
    /** Optional short label for display. */
    label?: string;
}

export interface SimulatorNavGraphEdge {
    /** Node id (app:screen). */
    from: string;
    to: string;
    /** Action that triggers the transition (e.g. open_email, button_click, main_menu). */
    action: string;
    /** Optional label (e.g. button label, link text). */
    label?: string;
}

export interface SimulatorNavGraph {
    /** Entry point (where the scenario starts). */
    entry: { app: string; screen: string };
    /** All reachable (app, screen) nodes. */
    nodes: SimulatorNavGraphNode[];
    /** Transitions between nodes. */
    edges: SimulatorNavGraphEdge[];
    /** Optional: browser has at least one cycle (button/page graph). */
    browserHasCycle?: boolean;
}

function nodeId(app: string, screen: string): string {
    return `${app}:${screen}`;
}

function getDefaultScreen(app: SimulatorApp, payload: SimulatorTemplatePayload): string {
    const def = payload.device?.secondaryDefaults?.[app];
    if (def != null && String(def).trim() !== '') return String(def).trim();
    switch (app) {
        case SimulatorApp.Email:
            return SimulatorEmailScreenId.List;
        case SimulatorApp.Messages:
            return SimulatorMessagesScreenId.Threads;
        case SimulatorApp.Phone:
            return SimulatorPhoneScreenId.History;
        case SimulatorApp.Internet:
            return (
                payload.browser?.defaultPageId ??
                payload.browser?.pages?.[0]?.id ??
                DEFAULT_INTERNET_SCREEN
            );
        case SimulatorApp.Home:
            return SimulatorHomeScreenId.Home;
        default:
            return SimulatorEmailScreenId.List;
    }
}

/** Resolve link href to browser page id (first page whose url matches or contains href). */
function resolveLinkTargetPageId(
    href: string | undefined,
    pages: Array<{ id?: string; url?: string }>,
): string | null {
    if (href == null || href === '') return null;
    const normalized = href.trim().toLowerCase();
    for (const p of pages) {
        const u = (p.url ?? '').trim().toLowerCase();
        if (u === normalized || u.endsWith(normalized) || normalized.endsWith(u))
            return p.id ?? null;
    }
    return null;
}

function getNodeLabel(
    app: SimulatorApp,
    screen: string,
    payload: SimulatorTemplatePayload,
): string | undefined {
    return app === SimulatorApp.Internet
        ? (payload.browser?.pages?.find((page) => page.id === screen)?.title ?? screen)
        : screen;
}

function buildReachableNodes(
    reachableScreens: ReturnType<typeof analyzeReachability>['reachableScreens'],
    payload: SimulatorTemplatePayload,
): SimulatorNavGraphNode[] {
    const nodes: SimulatorNavGraphNode[] = [];
    for (const app of APPS) {
        for (const screen of reachableScreens[app] ?? []) {
            nodes.push({
                id: nodeId(app, screen),
                app,
                screen,
                label: getNodeLabel(app, screen, payload),
            });
        }
    }
    return nodes;
}

function addMainMenuEdges(
    edges: SimulatorNavGraphEdge[],
    reachableApps: readonly SimulatorApp[],
    reachableScreens: ReturnType<typeof analyzeReachability>['reachableScreens'],
    nodeIds: ReadonlySet<string>,
    defaultScreen: (app: SimulatorApp) => string,
): void {
    for (const fromApp of reachableApps) {
        for (const fromScreen of reachableScreens[fromApp] ?? []) {
            const fromId = nodeId(fromApp, fromScreen);
            for (const toApp of reachableApps) {
                if (toApp === fromApp) continue;
                const toId = nodeId(toApp, defaultScreen(toApp));
                if (nodeIds.has(toId)) {
                    edges.push({ from: fromId, to: toId, action: 'main_menu' });
                }
            }
        }
    }
}

function addPairedEdge(
    edges: SimulatorNavGraphEdge[],
    reachableScreens: readonly string[],
    from: { app: SimulatorApp; screen: string },
    to: { app: SimulatorApp; screen: string },
    forwardAction: string,
    backwardAction: string,
): void {
    if (!reachableScreens.includes(from.screen) || !reachableScreens.includes(to.screen)) return;
    edges.push(
        {
            from: nodeId(from.app, from.screen),
            to: nodeId(to.app, to.screen),
            action: forwardAction,
        },
        {
            from: nodeId(to.app, to.screen),
            to: nodeId(from.app, from.screen),
            action: backwardAction,
        },
    );
}

function addBrowserEdges(
    edges: SimulatorNavGraphEdge[],
    payload: SimulatorTemplatePayload,
    reachableBrowserScreens: readonly string[],
): void {
    for (const page of payload.browser?.pages ?? []) {
        if (!reachableBrowserScreens.includes(page.id)) continue;
        const fromId = nodeId(SimulatorApp.Internet, page.id);

        for (const edge of simulatorBrowserEdges(page)) {
            if (reachableBrowserScreens.includes(edge.targetPageId)) {
                edges.push({
                    from: fromId,
                    to: nodeId(SimulatorApp.Internet, edge.targetPageId),
                    action: edge.action,
                    label: edge.label,
                });
            }
        }
    }
}

function addTabEdges(
    edges: SimulatorNavGraphEdge[],
    app: typeof SimulatorApp.Phone | typeof SimulatorApp.Home,
    screens: readonly string[],
    reachableScreens: readonly string[],
): void {
    for (const fromScreen of screens) {
        if (!reachableScreens.includes(fromScreen)) continue;
        for (const toScreen of screens) {
            if (fromScreen === toScreen || !reachableScreens.includes(toScreen)) continue;
            edges.push({ from: nodeId(app, fromScreen), to: nodeId(app, toScreen), action: 'tab' });
        }
    }
}

function addContentLinkEdges(
    edges: SimulatorNavGraphEdge[],
    from: { app: typeof SimulatorApp.Email | typeof SimulatorApp.Messages; screen: string },
    links: Array<{ href?: string }> | undefined,
    browserPages: Array<{ id?: string; url?: string }>,
    reachableBrowserScreens: readonly string[],
): void {
    if (!links?.length) return;
    for (const link of links) {
        const pageId = resolveLinkTargetPageId(link.href, browserPages);
        if (pageId != null && reachableBrowserScreens.includes(pageId)) {
            edges.push({
                from: nodeId(from.app, from.screen),
                to: nodeId(SimulatorApp.Internet, pageId),
                action: SimulatorActionType.ClickLink,
                label: link.href ?? undefined,
            });
        }
    }
}

/**
 * Build a navigation graph from a full-device simulator payload.
 * Nodes = reachable (app, screen); edges = main_menu, in-app (open_email, open_thread, button, form_submit), click_link.
 */
export function buildSimulatorNavGraph(payload: SimulatorTemplatePayload): SimulatorNavGraph {
    const report = analyzeReachability(payload);
    const edges: SimulatorNavGraphEdge[] = [];
    const reachableApps = report.reachableApps;
    const reachableScreens = report.reachableScreens;

    const defaultScreen = (app: SimulatorApp): string => getDefaultScreen(app, payload);

    // Entry
    const entryApp = report.entryApp ?? SimulatorApp.Email;
    const entryScreen =
        payload.entryPoint?.app === entryApp && payload.entryPoint?.screen != null
            ? String(payload.entryPoint.screen)
            : defaultScreen(entryApp);
    const entry = { app: entryApp, screen: entryScreen };

    const nodes = buildReachableNodes(reachableScreens, payload);
    const nodeIds = new Set(nodes.map((node) => node.id));

    // Edges: main menu (from any node to other app's default screen)
    addMainMenuEdges(edges, reachableApps, reachableScreens, nodeIds, defaultScreen);

    // Email: list ↔ detail
    addPairedEdge(
        edges,
        reachableScreens.email,
        { app: SimulatorApp.Email, screen: SimulatorEmailScreenId.List },
        { app: SimulatorApp.Email, screen: SimulatorEmailScreenId.Detail },
        SimulatorActionType.OpenEmail,
        'back',
    );

    // Messages: threads ↔ thread_detail, threads ↔ new_thread
    addPairedEdge(
        edges,
        reachableScreens.messages,
        { app: SimulatorApp.Messages, screen: SimulatorMessagesScreenId.Threads },
        { app: SimulatorApp.Messages, screen: SimulatorMessagesScreenId.ThreadDetail },
        SimulatorActionType.OpenThread,
        'back',
    );
    addPairedEdge(
        edges,
        reachableScreens.messages,
        { app: SimulatorApp.Messages, screen: SimulatorMessagesScreenId.Threads },
        { app: SimulatorApp.Messages, screen: SimulatorMessagesScreenId.NewThread },
        'new_thread',
        'back',
    );

    // Internet: button and form_submit edges
    addBrowserEdges(edges, payload, reachableScreens.internet);

    // Phone: tab switching between screens
    addTabEdges(edges, SimulatorApp.Phone, PHONE_SCREENS, reachableScreens.phone);

    // Home: tab between home, store, settings
    addTabEdges(edges, SimulatorApp.Home, HOME_SCREENS, reachableScreens.home);

    // Cross-app: click_link from email:detail or messages:thread_detail to internet:pageId
    const browserPages = payload.browser?.pages ?? [];
    const emailDetail = payload.email?.selectedMessage ?? payload.email?.inbox?.[0];
    const emailLinks = (emailDetail as { links?: Array<{ href?: string }> } | undefined)?.links;
    if (reachableScreens.email.includes(SimulatorEmailScreenId.Detail)) {
        addContentLinkEdges(
            edges,
            { app: SimulatorApp.Email, screen: SimulatorEmailScreenId.Detail },
            emailLinks,
            browserPages,
            reachableScreens.internet,
        );
    }

    const smsThread = payload.sms?.thread;
    const threadLinks = (smsThread as { links?: Array<{ href?: string }> } | undefined)?.links;
    if (reachableScreens.messages.includes(SimulatorMessagesScreenId.ThreadDetail)) {
        addContentLinkEdges(
            edges,
            { app: SimulatorApp.Messages, screen: SimulatorMessagesScreenId.ThreadDetail },
            threadLinks,
            browserPages,
            reachableScreens.internet,
        );
    }

    return {
        entry,
        nodes,
        edges,
        browserHasCycle: report.browserHasCycle,
    };
}

/** Serialize graph to JSON string (for clipboard or file). */
export function simulatorNavGraphToJson(graph: SimulatorNavGraph, pretty = true): string {
    return JSON.stringify(graph, null, pretty ? 2 : undefined);
}
