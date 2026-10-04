import { createContext, useContext, useLayoutEffect } from 'react';

/** Submission state shared by the active form and its surrounding shell. */
export interface ComposerState {
    valid: boolean;
    pending: boolean;
}
export const ComposerStateContext = createContext<{
    state: ComposerState | null;
    update: (state: ComposerState | null) => void;
} | null>(null);
export const useComposerState = () => useContext(ComposerStateContext);
export function useReportComposerState(valid: boolean, pending: boolean) {
    const update = useComposerState()?.update;
    useLayoutEffect(() => {
        update?.({ valid, pending });
        return () => update?.(null);
    }, [update, valid, pending]);
}
