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
export function SimulatorListGroup({ search, children, loading, empty = false, emptyMessage, loadingLabel }: Readonly<SimulatorListGroupProps>) {
    const locale = useSimulatorLocale();
    const statusLabel = loadingLabel ?? locale.t('list.loading');
    const hostLoading = useContext(SimulatorListLoadingContext);
    const busy = loading ?? hostLoading;
    let content = children;
    if (busy) {
        content = <div className="simulator-list-group__loading">
            <output aria-label={statusLabel}>{statusLabel}</output>
            {[0, 1, 2].map((row) => <div key={row} className="simulator-list-group__skeleton" aria-hidden="true" />)}
        </div>;
    } else if (empty) {
        content = <p className="simulator-list-group__empty">{emptyMessage ?? locale.t('list.empty')}</p>;
    }
    return <section className="simulator-list-group" aria-busy={busy}>
        <div className="simulator-list-group__search">{search}</div>
        {content}
    </section>;
}
