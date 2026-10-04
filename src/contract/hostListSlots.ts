import { createContext, type ReactNode, type Ref } from 'react';

/** Presentation-only extension points; hosts own paging and requests. */
export const SimulatorListFooterContext = createContext<ReactNode>(null);
export const SimulatorTimelineContext = createContext<{
    header?: ReactNode;
    scrollRef?: Ref<HTMLDivElement>;
    contentRef?: Ref<HTMLUListElement>;
}>({});
