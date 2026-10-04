import { emptySimulatorStore } from '@signalsafe/simulator-core/apps/contracts';
import { summarizeDevice } from '@signalsafe/simulator-core/apps/deviceData';
import type { DeviceStore } from '@signalsafe/simulator-core/apps/store';
import type {
    DeviceCollection,
    DeviceRecords,
    DeviceQuery,
} from '@signalsafe/simulator-core/apps/deviceData';
import type { SimulatorStore } from '@signalsafe/simulator-core/apps/contracts';

/** Runs synchronous work and reports thrown errors as rejections, like an async method. */
const settle = <T>(run: () => T): Promise<T> => new Promise((resolve) => resolve(run()));

/** In-memory DeviceStore for tests. */
export function createTestStore(
    changed: () => void = () => {},
    initial: SimulatorStore = emptySimulatorStore(),
): DeviceStore & { state: () => SimulatorStore } {
    let state = initial;
    const records = <K extends DeviceCollection>(collection: K): DeviceRecords[K][] => {
        const collections: { [P in DeviceCollection]: DeviceRecords[P][] } = state;
        return collections[collection];
    };
    const commit = () => {
        state.revision += 1;
        changed();
        return true;
    };
    const filtered = <K extends DeviceCollection>(
        collection: K,
        query: DeviceQuery,
    ): DeviceRecords[K][] =>
        records(collection).filter((record) => {
            if (query.folder !== undefined && 'folder' in record && record.folder !== query.folder)
                return false;
            if (
                query.threadId !== undefined &&
                (!('threadId' in record) || record.threadId !== query.threadId)
            )
                return false;
            return (
                !query.search ||
                JSON.stringify(record).toLowerCase().includes(query.search.toLowerCase())
            );
        });
    return {
        state: () => state,
        get data() {
            return summarizeDevice(state).metadata;
        },
        get counts() {
            return summarizeDevice(state).counts;
        },
        error: '',
        busy: false,
        reload: () => settle(() => changed()),
        get: (collection, id) =>
            settle(() => records(collection).find((record) => record.id === id) ?? null),
        page: (collection, query) =>
            settle(() => {
                const matches = filtered(collection, query);
                const offset = query.offset ?? 0;
                return {
                    records: matches.slice(offset, offset + (query.limit ?? 20)),
                    total: matches.length,
                    revision: state.revision,
                };
            }),
        put: (collection, record) =>
            settle(() => {
                const items = records(collection);
                const index = items.findIndex((item) => item.id === record.id);
                if (index < 0) items.push(record);
                else items.splice(index, 1, record);
                return commit();
            }),
        remove: (collection, id) =>
            settle(() => {
                const items = records(collection);
                const index = items.findIndex((item) => item.id === id);
                if (index >= 0) items.splice(index, 1);
                return commit();
            }),
        save: (metadata) =>
            settle(() => {
                state = { ...state, ...metadata };
                return commit();
            }),
        folder: (from, to, destination) =>
            settle(() => {
                state.vaultFolders = [
                    ...new Set([
                        ...state.vaultFolders.filter((folder) => folder !== from),
                        to ?? destination,
                    ]),
                ];
                for (const secret of state.secrets)
                    if (secret.folder === from) secret.folder = to ?? destination;
                return commit();
            }),
        exportBackup: () => settle(() => structuredClone(state)),
        restore: (next: SimulatorStore) =>
            settle(() => {
                state = structuredClone(next);
                return commit();
            }),
    };
}
