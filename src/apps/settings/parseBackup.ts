import {
    MAX_BACKUP_BYTES,
    simulatorStoreSchema,
    type SimulatorStore,
} from '@signalsafe/simulator-core/apps/contracts';

/** Validate current-format backups before a host is allowed to replace device records. */
export function parseBackup(text: string): SimulatorStore {
    if (
        text.length > MAX_BACKUP_BYTES ||
        new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES
    )
        throw new Error('Backup exceeds the simulator size limit.');
    return simulatorStoreSchema.parse(JSON.parse(text));
}
