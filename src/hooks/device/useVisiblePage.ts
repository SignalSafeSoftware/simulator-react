import { useState } from 'react';

export const SIMULATOR_PAGE_SIZE = 20;

/** Bound rendering while retaining the host's complete local search results. */
export function useVisiblePage(scope: string) {
    const [page, setPage] = useState({ scope, count: SIMULATOR_PAGE_SIZE });
    const count = page.scope === scope ? page.count : SIMULATOR_PAGE_SIZE;
    return {
        count,
        loadMore: () => setPage({ scope, count: count + SIMULATOR_PAGE_SIZE }),
    };
}
