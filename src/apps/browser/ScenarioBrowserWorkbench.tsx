import { useMemo, useRef } from 'react';
import { SimulatorActionType } from '../../utils/telemetry/simulatorActionTaxonomy.js';
import { getBrowserSubmitTargetId } from '../../utils/navigation/simulatorSecondaryMenuHelpers.js';
import { SimulatorActions } from '../../actions/simulatorActions.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import type { SimulatorAction, SimulatorBrowserPayload } from '../../types/session.js';
import BrowserWorkbench from './BrowserWorkbench.js';
import { scenarioBrowserAction, scenarioBrowserPage } from './scenarioBrowserPage.js';

/** Device and scenario content share the workbench's address bar, sandbox and history. */
export default function ScenarioBrowserWorkbench({
    payload,
    screen,
    onAction,
    themeCss,
    onNavigate,
}: Readonly<{
    payload: SimulatorBrowserPayload | null;
    screen: string;
    onAction: (action: SimulatorAction) => void;
    themeCss?: string;
    onNavigate?: (pageId: string) => void;
}>) {
    const { t } = useSimulatorLocale();
    const visited = useRef(false);
    const pages = useMemo(
        () => payload?.pages.map((page) => scenarioBrowserPage(page, t)) ?? [],
        [payload, t],
    );
    return (
        <BrowserWorkbench
            pages={pages}
            showActionStatus={false}
            pageId={screen}
            themeCss={themeCss}
            onNavigate={(page) => {
                if (payload?.pages.some((item) => item.id === page.id)) {
                    if (visited.current) onNavigate?.(page.id);
                    onAction(SimulatorActions.openPage(page.id));
                }
                visited.current = true;
            }}
            onAction={(event) => {
                const page = payload?.pages.find((item) => item.id === event.pageId);
                const action = page && scenarioBrowserAction(page, event);
                if (!action || !page) return;
                onAction(action);
                const targetId =
                    action.type === SimulatorActionType.SubmitForm
                        ? getBrowserSubmitTargetId(page.submitTargetPageId)
                        : action.type === SimulatorActionType.ClickLink
                          ? action.pageId
                          : undefined;
                const target = payload?.pages.find(
                    (item) =>
                        item.id === targetId ||
                        (action.type === SimulatorActionType.ClickLink && item.url === action.href),
                );
                if (target) return scenarioBrowserPage(target, t);
            }}
        />
    );
}
