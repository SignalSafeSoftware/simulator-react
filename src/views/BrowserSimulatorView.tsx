/**
 * Internet app: page-based browser. Wireframe: "Internet" banner, then browser chrome + page content.
 * Resolves current page by screen (page id), emits open_page, delegates to BrowserPageRenderer.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import type { SimulatorAction, SimulatorBrowserPayload } from '../types/session.js';
import { SimulatorActions } from '../actions/index.js';
import BrowserPageRenderer from './BrowserPageRenderer.js';
import type {
    SimulatorChoiceRenderProps,
    SimulatorFeedbackRenderProps,
} from '../ui/renderSlots.js';
import { SIM_FLEX_COL, SIM_MUTED, joinClasses } from '../ui/simulatorClasses.js';

export interface BrowserSimulatorViewProps {
    payload: SimulatorBrowserPayload | null;
    screen: string;
    stack?: string[];
    onAction: (action: SimulatorAction) => void;
    onBack?: () => void;
    renderChoice?: (choice: SimulatorChoiceRenderProps) => ReactNode;
    renderFeedback?: (feedback: SimulatorFeedbackRenderProps) => ReactNode;
}

export default function BrowserSimulatorView({
    payload,
    screen,
    stack = [],
    onAction,
    onBack,
    renderChoice,
    renderFeedback,
}: Readonly<BrowserSimulatorViewProps>) {
    const pages = payload?.pages ?? [];
    const currentPage =
        pages.find((p) => p.id === screen) ?? pages[0] ?? null;

    const onActionRef = useRef(onAction);
    onActionRef.current = onAction;
    const lastEmittedPageIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (currentPage == null) return;
        const pageId = currentPage.id;
        if (lastEmittedPageIdRef.current === pageId) return;
        lastEmittedPageIdRef.current = pageId;
        onActionRef.current(SimulatorActions.openPage(pageId));
    }, [currentPage?.id]);

    if (payload == null) {
        return <p className={joinClasses(SIM_MUTED, 'simulator-text--sm', 'simulator-text--empty')}>No browser for this scenario.</p>;
    }
    if (pages.length === 0 || currentPage == null) {
        return <p className={joinClasses(SIM_MUTED, 'simulator-text--sm', 'simulator-text--empty')}>No pages for this site.</p>;
    }

    return (
        <div className={joinClasses(SIM_FLEX_COL, 'simulator-flex--grow', 'simulator-min-h-0')}>
            <BrowserPageRenderer
                page={currentPage}
                onAction={onAction}
                onBack={stack.length > 0 ? onBack : undefined}
                renderChoice={renderChoice}
                renderFeedback={renderFeedback}
            />
        </div>
    );
}
