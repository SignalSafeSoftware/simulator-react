import { useEffect, useRef, useState } from 'react';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import type {
    DeviceCollection,
    DeviceQuery,
    DeviceRecords,
} from '@signalsafe/simulator-core/apps/deviceData';
import type { DeviceStore } from '@signalsafe/simulator-core/apps/store';
const PAGE_SIZE = 20;
export function useDevicePage<K extends DeviceCollection>(
    store: DeviceStore,
    collection: K,
    query: DeviceQuery,
    count: number,
    enabled = true,
) {
    const [result, setResult] = useState<{
        records: DeviceRecords[K][];
        total: number;
        key: string;
    }>({ records: [], total: 0, key: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [retry, setRetry] = useState(0);
    const { t } = useSimulatorLocale();
    const translate = useRef(t);
    translate.current = t;
    const key = JSON.stringify([
        collection,
        query.folder,
        query.search,
        query.threadId,
        store.data?.revision,
    ]);
    const cache = useRef(
        new Map<number, { records: DeviceRecords[K][]; total: number; revision: number }>(),
    );
    const cacheKey = useRef('');
    const revision = store.data?.revision;
    const page = store.page;
    const { folder, search, threadId } = query;
    useEffect(() => {
        if (!enabled || revision === undefined) return;
        let cancelled = false;
        if (cacheKey.current !== key) {
            cache.current.clear();
            cacheKey.current = key;
        }
        async function load() {
            setLoading(true);
            setError('');
            try {
                const records: DeviceRecords[K][] = [];
                let total = 0;
                for (let offset = 0; offset < count; offset += PAGE_SIZE) {
                    const response =
                        cache.current.get(offset) ??
                        (await page(collection, {
                            folder,
                            search,
                            threadId,
                            offset,
                            limit: PAGE_SIZE,
                        }));
                    if (cancelled) return;
                    if (response.revision !== revision)
                        throw new Error(translate.current('app.records.changed'));
                    total = response.total;
                    cache.current.set(offset, response);
                    records.push(...response.records);
                    if (offset + PAGE_SIZE >= total) break;
                }
                setResult({ records, total, key });
            } catch (reason) {
                if (!cancelled)
                    setError(
                        reason instanceof Error
                            ? reason.message
                            : translate.current('app.records.loadFailed'),
                    );
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        void load();
        return () => {
            cancelled = true;
        };
    }, [page, collection, folder, search, threadId, count, enabled, revision, key, retry]);
    return {
        records: result.key === key ? result.records : [],
        total: result.key === key ? result.total : 0,
        loading: enabled && loading,
        error: enabled ? error : '',
        retry: () => setRetry((value) => value + 1),
    };
}
