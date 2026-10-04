import { createContext, useContext, useLayoutEffect, type ReactNode } from 'react';

/** The nearest device shell owns the active screen's bottom action menu. */
export const ScreenActionMenuContext = createContext<((menu: ReactNode) => void) | null>(null);

/** Register a stable menu with the shell, or let a standalone view render it locally. */
export function useScreenActionMenu(menu: ReactNode): boolean {
    const update = useContext(ScreenActionMenuContext);
    useLayoutEffect(() => {
        update?.(menu);
        return () => update?.(null);
    }, [menu, update]);
    return update !== null;
}
