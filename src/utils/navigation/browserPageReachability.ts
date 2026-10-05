import type { SimulatorBrowserPage } from '../../types/session.js';
import { simulatorBrowserEdges } from './simulatorBrowserEdges.js';

/** Pages reachable from a start page, plus whether the link graph contains a cycle. */
export function reachableBrowserPages(
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
