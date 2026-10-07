import { createContext, type ReactNode, type Ref } from 'react';

/** Presentation-only extension points; hosts own paging and requests. */
export const SimulatorListFooterContext = createContext<ReactNode>(null);
export interface SimulatorTimelinePaging {
    hasMore: boolean;
    loading: boolean;
    error?: string;
    onLoadEarlier: () => void;
}

export interface SimulatorTimelineOptions {
    /** Stable host identity for conversations loaded separately from the session payload. */
    threadId?: string;
    paging?: SimulatorTimelinePaging;
    header?: ReactNode;
    scrollRef?: Ref<HTMLDivElement>;
    contentRef?: Ref<HTMLUListElement>;
}
export const SimulatorTimelineContext = createContext<SimulatorTimelineOptions>({});
