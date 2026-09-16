import { useSimulatorLocale } from '../i18n/SimulatorLocale.js';
import { createContext, useContext, type ReactNode } from 'react';

export const SimulatorListLoadingContext = createContext(false);

export interface SimulatorListGroupProps {
    search: ReactNode;
    children?: ReactNode;
    loading?: boolean;
    empty?: boolean;
    emptyMessage?: string;
    loadingLabel?: string;
}

/** Shared searchable list surface; hosts can supply loading once for all list screens. */
export function SimulatorListGroup({ search, children, loading, empty = false, emptyMessage, loadingLabel }: SimulatorListGroupProps) {
    const locale = useSimulatorLocale();
    const statusLabel = loadingLabel ?? locale.t('list.loading');
    const hostLoading = useContext(SimulatorListLoadingContext);
    const busy = loading ?? hostLoading;
    return <section className="simulator-list-group" aria-busy={busy}>
        <div className="simulator-list-group__search">{search}</div>
        {busy ? <div className="simulator-list-group__loading" role="status" aria-label={statusLabel}>
            <span>{statusLabel}</span>
            {[0, 1, 2].map((row) => <div key={row} className="simulator-list-group__skeleton" aria-hidden="true" />)}
        </div> : empty ? <p className="simulator-list-group__empty">{emptyMessage ?? locale.t('list.empty')}</p> : children}
    </section>;
}
