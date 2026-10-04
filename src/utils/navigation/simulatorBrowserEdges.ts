import { BrowserLayout } from '../../types/session.js';
import type { SimulatorBrowserPage } from '../../types/session.js';
import { DEFAULT_BROWSER_SUBMIT_TARGET } from '../../constants.js';

export interface SimulatorBrowserEdge {
    targetPageId: string;
    action: 'button_click' | 'form_submit';
    label?: string;
}

/** Declarative navigation supported by the browser renderer. IDs remain case-sensitive. */
export function simulatorBrowserEdges(page: SimulatorBrowserPage): SimulatorBrowserEdge[] {
    const edges: SimulatorBrowserEdge[] = [];
    for (const button of page.buttons ?? []) {
        if (button.targetPageId)
            edges.push({
                targetPageId: button.targetPageId,
                action: 'button_click',
                label: button.label,
            });
    }
    const layout = normalizeBrowserLayout(page.layout);
    if (
        (layout === BrowserLayout.Login || layout === BrowserLayout.Landing) &&
        (page.formFields?.length ?? 0) > 0
    ) {
        edges.push({
            targetPageId: page.submitTargetPageId ?? DEFAULT_BROWSER_SUBMIT_TARGET,
            action: 'form_submit',
        });
    }
    return edges;
}

export function normalizeBrowserLayout(layout: string | undefined): string {
    const layoutNorm = (layout ?? BrowserLayout.Content).toLowerCase();
    // Master templates use page_layout "centered" / "split" for login gates; renderer uses "login".
    if (layoutNorm === 'centered' || layoutNorm === 'split') {
        return BrowserLayout.Login;
    }
    return layoutNorm;
}
