import { useCallback, useEffect, useLayoutEffect, useRef, type Ref } from 'react';
import type { SimulatorTimelinePaging } from '../../contract/hostListSlots.js';

const FOLLOW_BOTTOM_THRESHOLD_PX = 48;
const EARLIER_PAGE_THRESHOLD_PX = 80;

interface Position {
    thread: string;
    height: number;
    top: number;
    count: number;
    first: string;
    last: string;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
    if (typeof ref === 'function') ref(value);
    else if (ref) Object.assign(ref, { current: value });
}

/** Shared timeline policy: open at latest, follow the bottom, and anchor older-page prepends. */
export function useSmsTimelineScroll({
    active,
    threadId,
    count,
    first,
    last,
    paging,
    scrollRef,
    contentRef,
}: {
    active: boolean;
    threadId: string;
    count: number;
    first: string;
    last: string;
    paging?: SimulatorTimelinePaging;
    scrollRef?: Ref<HTMLDivElement>;
    contentRef?: Ref<HTMLUListElement>;
}) {
    const bodyRef = useRef<HTMLDivElement | null>(null);
    const listRef = useRef<HTMLUListElement | null>(null);
    const position = useRef<Position>();
    const pending = useRef(false);
    const following = useRef(true);
    const loading = paging?.loading ?? false;
    const error = paging?.error ?? '';
    const attachBody = useCallback(
        (body: HTMLDivElement | null) => {
            bodyRef.current = body;
            assignRef(scrollRef, body);
        },
        [scrollRef],
    );
    const attachContent = useCallback(
        (list: HTMLUListElement | null) => {
            listRef.current = list;
            assignRef(contentRef, list);
        },
        [contentRef],
    );

    const loadEarlier = useCallback(() => {
        const body = bodyRef.current;
        if (
            !body ||
            !paging ||
            paging.loading ||
            pending.current ||
            (!paging.hasMore && !paging.error)
        )
            return;
        position.current = {
            thread: threadId,
            height: body.scrollHeight,
            top: body.scrollTop,
            count,
            first,
            last,
        };
        pending.current = true;
        following.current = false;
        paging.onLoadEarlier();
    }, [paging, threadId, count, first, last]);

    useLayoutEffect(() => {
        const body = bodyRef.current;
        if (!body) {
            position.current = undefined;
            pending.current = false;
            following.current = true;
            return;
        }
        const previous = position.current;
        const changedThread = !previous || previous.thread !== threadId;
        if (changedThread) {
            pending.current = false;
            following.current = true;
        }
        const prepended = previous && count > previous.count && first !== previous.first;
        if (changedThread || (previous.count === 0 && count > 0)) {
            body.scrollTop = body.scrollHeight;
        } else if (prepended) {
            body.scrollTop = previous.top + body.scrollHeight - previous.height;
        } else if (following.current && (count !== previous.count || last !== previous.last)) {
            body.scrollTop = body.scrollHeight;
        }
        // A page can contain no messages for this thread; completion still releases its request.
        if (!loading) pending.current = false;
        if (!pending.current || count !== previous?.count) {
            position.current = {
                thread: threadId,
                height: body.scrollHeight,
                top: body.scrollTop,
                count,
                first,
                last,
            };
        }
    }, [active, threadId, count, first, last, loading, error]);

    useEffect(() => {
        const body = bodyRef.current;
        const content = listRef.current;
        if (!body) return;
        const rememberPosition = () => {
            if (position.current && !pending.current) {
                position.current = {
                    ...position.current,
                    height: body.scrollHeight,
                    top: body.scrollTop,
                };
            }
        };
        const scroll = () => {
            following.current =
                body.scrollHeight - body.clientHeight - body.scrollTop <=
                FOLLOW_BOTTOM_THRESHOLD_PX;
            rememberPosition();
            if (body.scrollTop <= EARLIER_PAGE_THRESHOLD_PX && !error) loadEarlier();
        };
        body.addEventListener('scroll', scroll);
        const observer =
            typeof ResizeObserver === 'undefined'
                ? null
                : new ResizeObserver(() => {
                      if (following.current && !pending.current) body.scrollTop = body.scrollHeight;
                      rememberPosition();
                  });
        observer?.observe(body);
        if (content) observer?.observe(content);
        return () => {
            body.removeEventListener('scroll', scroll);
            observer?.disconnect();
        };
    }, [active, loadEarlier, error]);

    return { scrollRef: attachBody, contentRef: attachContent, loadEarlier };
}
