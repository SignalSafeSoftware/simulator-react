/**
 * Internet app: page-based browser. Wireframe: "Internet" banner, then browser chrome + page content.
 * Resolves current page by screen (page id), emits open_page, delegates to BrowserPageRenderer.
 */
import { useEffect, useRef } from 'react';
import type { SimulatorAction, SimulatorBrowserPayload } from '../types/session';
import { SimulatorActions } from '../actions';
import BrowserPageRenderer from './BrowserPageRenderer';

export interface BrowserSimulatorViewProps {
    payload: SimulatorBrowserPayload | null;
    screen: string;
    stack?: string[];
    onAction: (action: SimulatorAction) => void;
    onBack?: () => void;
}

export default function BrowserSimulatorView({
    payload,
    screen,
    stack = [],
    onAction,
    onBack,
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
        return <p className="text-muted small mb-0">No browser for this scenario.</p>;
    }
    if (pages.length === 0 || currentPage == null) {
        return <p className="text-muted small mb-0">No pages for this site.</p>;
    }

    return (
        <div className="d-flex flex-column flex-grow-1 min-h-0">
            {/* App identity is the shell bottom nav; do not render doc-only diagram labels (e.g. "Internet") inside content. */}
            <BrowserPageRenderer
                page={currentPage}
                onAction={onAction}
                onBack={stack.length > 0 ? onBack : undefined}
            />
        </div>
    );
}
