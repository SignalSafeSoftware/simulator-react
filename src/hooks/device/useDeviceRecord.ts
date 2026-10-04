import { useEffect, useState } from 'react';
import type { DeviceCollection, DeviceRecords } from '@signalsafe/simulator-core/apps/deviceData';
import type { DeviceStore } from '@signalsafe/simulator-core/apps/store';
export function useDeviceRecord<K extends DeviceCollection>(
    store: DeviceStore,
    collection: K,
    id: string | null,
) {
    const [attempt, setAttempt] = useState(0);
    const [result, setResult] = useState<{
        key: string;
        record: DeviceRecords[K] | null;
        error: string;
    } | null>(null);
    const get = store.get;
    const revision = store.data?.revision;
    const key = JSON.stringify([collection, id, revision, attempt]);
    useEffect(() => {
        if (!id || revision === undefined) return;
        let cancelled = false;
        void get(collection, id).then(
            (record) => {
                if (!cancelled)
                    setResult({
                        key,
                        record,
                        error: record ? '' : 'This saved record is no longer available.',
                    });
            },
            (reason: unknown) => {
                if (!cancelled)
                    setResult({
                        key,
                        record: null,
                        error:
                            reason instanceof Error
                                ? reason.message
                                : 'Saved record could not be loaded.',
                    });
            },
        );
        return () => {
            cancelled = true;
        };
    }, [get, collection, id, revision, key]);
    return {
        record: result?.key === key ? result.record : null,
        error: result?.key === key ? result.error : '',
        loading: Boolean(id) && result?.key !== key,
        retry: () => setAttempt((value) => value + 1),
    };
}
