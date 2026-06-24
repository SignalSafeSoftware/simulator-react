/**
 * Navigation graph for simulator templates: apps, screens, and declarative action transitions.
 * Used for export and debug only; no TreeSpec branching. Semantics are simulator navigation only.
 */

import type { SimulatorTemplatePayload } from '../types/session';
import type { SimulatorApp } from '../types/portableSimulator';
import { DEFAULT_BROWSER_SUBMIT_TARGET } from '../constants';
import { analyzeReachability } from './simulatorReachability';

const APPS: SimulatorApp[] = ['email', 'messages', 'internet', 'phone', 'home'];
const PHONE_SCREENS = ['history', 'contacts', 'dial', 'incoming_call', 'voicemail', 'directory'];
const HOME_SCREENS = ['home', 'store', 'settings'];

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

/** Resolve link href to browser page id (first page whose url matches or contains href). */
function resolveLinkTargetPageId(href: string | undefined, pages: Array<{ id?: string; url?: string }>): string | null {
    if (href == null || href === '') return null;
    const normalized = href.trim().toLowerCase();
    for (const p of pages) {
        const u = (p.url ?? '').trim().toLowerCase();
        if (u === normalized || u.endsWith(normalized) || normalized.endsWith(u)) return p.id ?? null;
    }
    return null;
}

function getNodeLabel(
    app: SimulatorApp,
    screen: string,
    payload: SimulatorTemplatePayload
): string | undefined {
    return app === 'internet'
        ? payload.browser?.pages?.find((page) => page.id === screen)?.title ?? screen
        : screen;
}

function buildReachableNodes(
    reachableScreens: ReturnType<typeof analyzeReachability>['reachableScreens'],
    payload: SimulatorTemplatePayload
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
    defaultScreen: (app: SimulatorApp) => string
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
    backwardAction: string
): void {
    if (!reachableScreens.includes(from.screen) || !reachableScreens.includes(to.screen)) return;
    edges.push(
        { from: nodeId(from.app, from.screen), to: nodeId(to.app, to.screen), action: forwardAction },
        { from: nodeId(to.app, to.screen), to: nodeId(from.app, from.screen), action: backwardAction }
    );
}

function addBrowserEdges(
    edges: SimulatorNavGraphEdge[],
    payload: SimulatorTemplatePayload,
    reachableBrowserScreens: readonly string[]
): void {
    for (const page of payload.browser?.pages ?? []) {
        if (!reachableBrowserScreens.includes(page.id)) continue;
        const fromId = nodeId('internet', page.id);

        for (const button of page.buttons ?? []) {
            const targetPageId = (button as { targetPageId?: string }).targetPageId;
            if (targetPageId != null && reachableBrowserScreens.includes(targetPageId)) {
                edges.push({
                    from: fromId,
                    to: nodeId('internet', targetPageId),
                    action: 'button_click',
                    label: (button as { label?: string }).label,
                });
            }
        }

        const submitTargetPageId = page.submitTargetPageId ?? DEFAULT_BROWSER_SUBMIT_TARGET;
        if (submitTargetPageId !== page.id && reachableBrowserScreens.includes(submitTargetPageId)) {
            edges.push({ from: fromId, to: nodeId('internet', submitTargetPageId), action: 'form_submit' });
        }
    }
}

function addTabEdges(
    edges: SimulatorNavGraphEdge[],
    app: 'phone' | 'home',
    screens: readonly string[],
    reachableScreens: readonly string[]
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
    from: { app: 'email' | 'messages'; screen: string },
    links: Array<{ href?: string }> | undefined,
    browserPages: Array<{ id?: string; url?: string }>,
    reachableBrowserScreens: readonly string[]
): void {
    if (!links?.length) return;
    for (const link of links) {
        const pageId = resolveLinkTargetPageId(link.href, browserPages);
        if (pageId != null && reachableBrowserScreens.includes(pageId)) {
            edges.push({
                from: nodeId(from.app, from.screen),
                to: nodeId('internet', pageId),
                action: 'click_link',
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
    const entryApp = report.entryApp ?? 'email';
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
        { app: 'email', screen: 'list' },
        { app: 'email', screen: 'detail' },
        'open_email',
        'back'
    );

    // Messages: threads ↔ thread_detail, threads ↔ new_thread
    addPairedEdge(
        edges,
        reachableScreens.messages,
        { app: 'messages', screen: 'threads' },
        { app: 'messages', screen: 'thread_detail' },
        'open_thread',
        'back'
    );
    addPairedEdge(
        edges,
        reachableScreens.messages,
        { app: 'messages', screen: 'threads' },
        { app: 'messages', screen: 'new_thread' },
        'new_thread',
        'back'
    );

    // Internet: button and form_submit edges
    addBrowserEdges(edges, payload, reachableScreens.internet);

    // Phone: tab switching between screens
    addTabEdges(edges, 'phone', PHONE_SCREENS, reachableScreens.phone);

    // Home: tab between home, store, settings
    addTabEdges(edges, 'home', HOME_SCREENS, reachableScreens.home);

    // Cross-app: click_link from email:detail or messages:thread_detail to internet:pageId
    const browserPages = payload.browser?.pages ?? [];
    const emailDetail = payload.email?.selectedMessage ?? payload.email?.inbox?.[0];
    const emailLinks = (emailDetail as { links?: Array<{ href?: string }> } | undefined)?.links;
    if (reachableScreens.email.includes('detail')) {
        addContentLinkEdges(edges, { app: 'email', screen: 'detail' }, emailLinks, browserPages, reachableScreens.internet);
    }

    const smsThread = payload.sms?.thread;
    const threadLinks = (smsThread as { links?: Array<{ href?: string }> } | undefined)?.links;
    if (reachableScreens.messages.includes('thread_detail')) {
        addContentLinkEdges(
            edges,
            { app: 'messages', screen: 'thread_detail' },
            threadLinks,
            browserPages,
            reachableScreens.internet
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
