import { useEffect, useRef, useState } from 'react';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { samplePage } from './browserWorkbenchPages.js';
import type { MockPage } from './BrowserWorkbench.js';
function samePage(left: MockPage, right: MockPage): boolean {
    return (
        left.id === right.id &&
        left.title === right.title &&
        left.url === right.url &&
        left.html === right.html &&
        left.css === right.css
    );
}
const EMPTY_PAGES: readonly MockPage[] = [];

interface BrowserHistory {
    history: MockPage[];
    position: number;
    page: MockPage;
}

export function useBrowserHistory(
    pages: readonly MockPage[] = EMPTY_PAGES,
    pageId?: string,
    onNavigate?: (page: MockPage) => void,
) {
    const { t } = useSimulatorLocale();
    const [nav, setNav] = useState<BrowserHistory>(() => {
        const sample = pages.find((item) => item.id === pageId) ?? pages[0] ?? samplePage(t);
        return { history: [sample], position: 0, page: sample };
    });
    const { page } = nav;
    const [address, setAddress] = useState(page.url);
    const requestedId = pageId ?? pages[0]?.id;
    const previousRequest = useRef(requestedId);
    const previousIds = useRef(new Set(pages.map((item) => item.id)));
    const navigateCallback = useRef(onNavigate);
    navigateCallback.current = onNavigate;
    useEffect(() => {
        const requestChanged = previousRequest.current !== requestedId;
        const ids = new Set(pages.map((item) => item.id));
        const removed = new Set([...previousIds.current].filter((id) => !ids.has(id)));
        previousRequest.current = requestedId;
        previousIds.current = ids;
        setNav((current) => {
            const selected = pages.find((item) => item.id === requestedId) ?? pages[0];
            const currentPage = pages.find((item) => item.id === current.page.id);
            const target =
                requestChanged || removed.has(current.page.id)
                    ? (selected ?? samplePage(t))
                    : (currentPage ?? current.page);
            const nextHistory = current.history
                .filter((item) => !removed.has(item.id))
                .map((item) => {
                    const updated = pages.find((candidate) => candidate.id === item.id);
                    return updated && !samePage(updated, item) ? updated : item;
                });
            const nextPosition =
                current.history
                    .slice(0, current.position + 1)
                    .filter((item) => !removed.has(item.id)).length - 1;
            if (target.id !== current.page.id || nextPosition < 0) {
                const history = [...nextHistory.slice(0, nextPosition + 1), target].slice(-100);
                return { history, position: history.length - 1, page: target };
            }
            if (
                samePage(target, current.page) &&
                nextHistory.every((item, index) => item === current.history[index]) &&
                nextHistory.length === current.history.length
            )
                return current;
            return { history: nextHistory, position: nextPosition, page: target };
        });
    }, [pages, requestedId, t]);
    const lastNavigation = useRef<{ id: string; url: string } | null>(null);
    useEffect(() => {
        if (lastNavigation.current?.id === page.id && lastNavigation.current.url === page.url)
            return;
        lastNavigation.current = { id: page.id, url: page.url };
        setAddress(page.url);
        navigateCallback.current?.(page);
    }, [page]);
    return { nav, setNav, address, setAddress };
}
