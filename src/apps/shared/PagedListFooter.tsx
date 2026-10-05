import { LoadMore } from '../../ui/lists/LoadMore.js';
import { SIM_LIST_ERROR } from '../../ui/styles/simulatorClasses.js';

interface PagedListState {
    error: string;
    total: number;
    loading: boolean;
    retry: () => unknown;
}

interface VisiblePageState {
    count: number;
    loadMore: () => unknown;
}

/** Error line plus load-more control shared by every paged device list. */
export function PagedListFooter({
    page,
    visible,
    label,
}: Readonly<{ page: PagedListState; visible: VisiblePageState; label: string }>) {
    return (
        <>
            {page.error && (
                <p className={SIM_LIST_ERROR} role="alert">
                    {page.error}
                </p>
            )}
            <LoadMore
                count={visible.count}
                hasMore={visible.count < page.total}
                loading={page.loading}
                error={page.error}
                onLoadMore={page.error ? page.retry : visible.loadMore}
                label={label}
            />
        </>
    );
}
