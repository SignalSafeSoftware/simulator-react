import { ChevronRight } from 'lucide-react';
import { SIM_LIST_ERROR } from '../../ui/styles/simulatorClasses.js';
import { LoadMore } from '../../ui/lists/LoadMore.js';
import type { Secret } from '@signalsafe/simulator-core/apps/contracts';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { SearchBox } from './VaultFolders.js';
import type { SecretPage, TypeLabels, VisiblePage } from './vaultShared.js';

export function SecretList({
    secrets,
    visiblePage,
    query,
    onQuery,
    busy,
    typeLabels,
    onEdit,
}: Readonly<{
    secrets: SecretPage;
    visiblePage: VisiblePage;
    query: string;
    onQuery: (query: string) => void;
    busy: boolean;
    typeLabels: TypeLabels;
    onEdit: (secret: Secret) => void;
}>) {
    const { t } = useSimulatorLocale();
    return (
        <div className="vault-folder-group">
            <SearchBox label={t('app.vault.searchSecrets')} value={query} onChange={onQuery} />
            <ul className="vault-list-group" aria-label={t('app.vault.folderSecrets')}>
                {secrets.records.map((item) => (
                    <li key={item.id}>
                        <button type="button" disabled={busy} onClick={() => onEdit(item)}>
                            <span>
                                <strong>{item.title}</strong>
                            </span>
                            <span className="vault-secret-type">{typeLabels[item.type]}</span>
                            <ChevronRight size={18} aria-hidden="true" />
                        </button>
                    </li>
                ))}
            </ul>
            {secrets.error && (
                <p className={SIM_LIST_ERROR} role="alert">
                    {secrets.error}
                </p>
            )}
            <LoadMore
                count={visiblePage.count}
                hasMore={visiblePage.count < secrets.total}
                loading={secrets.loading}
                error={secrets.error}
                onLoadMore={secrets.error ? secrets.retry : visiblePage.loadMore}
                label={t('app.vault.loadMore')}
            />
            {!secrets.loading && !secrets.error && secrets.records.length === 0 && (
                <p>{query ? t('app.vault.noMatchingSecrets') : t('app.vault.noSecrets')}</p>
            )}
        </div>
    );
}
