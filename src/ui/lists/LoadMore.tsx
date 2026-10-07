import { useEffect, useRef } from 'react';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';

/** Presentation-only boundary: the host owns cursors, requests and retries. */
export function LoadMore({
    hasMore,
    loading,
    error,
    onLoadMore,
    label,
    automatic = true,
    count,
}: Readonly<{
    hasMore: boolean;
    loading: boolean;
    error: string;
    onLoadMore: () => unknown;
    label: string;
    automatic?: boolean;
    count: number;
}>) {
    const locale = useSimulatorLocale();
    const target = useRef<HTMLButtonElement>(null);
    const callback = useRef(onLoadMore);
    const blocked = useRef(loading || Boolean(error));
    useEffect(() => {
        callback.current = onLoadMore;
        blocked.current = loading || Boolean(error);
    }, [onLoadMore, loading, error]);
    useEffect(() => {
        if (
            !automatic ||
            !hasMore ||
            !target.current ||
            typeof IntersectionObserver === 'undefined'
        )
            return;
        let requested = false;
        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) {
                    requested = false;
                } else if (!requested && !blocked.current) {
                    requested = true;
                    void callback.current();
                }
            }
        });
        observer.observe(target.current);
        return () => {
            requested = true;
            observer.disconnect();
        };
    }, [automatic, hasMore]);
    if (!hasMore && !error) return null;
    let text = label;
    if (loading) text = locale.t('list.loadingMore');
    else if (error) text = locale.t('app.retry');
    return (
        <button
            ref={target}
            type='button'
            className='simulator-load-more'
            aria-busy={loading}
            data-loaded-count={count}
            disabled={loading}
            onClick={() => void onLoadMore()}
        >
            {text}
        </button>
    );
}
