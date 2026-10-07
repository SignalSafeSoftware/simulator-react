import { useLayoutEffect, useRef } from 'react';

/** Focus call details on entry and restore the originating list row on return. */
export function usePhoneHistoryFocus(detailEntryId: string | null | undefined) {
    const rootRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const returnEntryId = useRef<string | null>(null);

    useLayoutEffect(() => {
        if (detailEntryId != null) {
            returnEntryId.current = detailEntryId;
            titleRef.current?.focus();
        } else if (returnEntryId.current != null) {
            const rows = rootRef.current?.querySelectorAll<HTMLButtonElement>(
                'button[data-simulator-history-id]',
            );
            const row = Array.from(rows ?? []).find(
                (candidate) => candidate.dataset.simulatorHistoryId === returnEntryId.current,
            );
            (
                row ?? rootRef.current?.querySelector<HTMLInputElement>('input[type="search"]')
            )?.focus();
            returnEntryId.current = null;
        }
    }, [detailEntryId]);

    return { rootRef, titleRef };
}
