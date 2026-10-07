import { expect, it } from 'vitest';
import { emptySimulatorStore, MAX_BACKUP_BYTES } from '@signalsafe/simulator-core/apps/contracts';
import { parseBackup } from '../src/apps/settings/parseBackup.js';

it('validates current-format device records without losing binary assets or zero coordinates', () => {
    const data = emptySimulatorStore();
    data.photos.push({
        id: 'photo',
        title: 'Synthetic',
        caption: '',
        asset: { name: 'one.png', mime: 'image/png', data: 'data:image/png;base64,YQ==' },
        metadata: { capturedAt: '', timeZone: '', latitude: 0, longitude: 0 },
        original: { capturedAt: '', timeZone: '', latitude: null, longitude: null },
        createdAt: '2026-10-05T00:00:00Z',
        updatedAt: '2026-10-05T00:00:00Z',
    });
    expect(parseBackup(JSON.stringify(data))).toEqual(data);
    expect(() => parseBackup(JSON.stringify({ ...data, identity: 'invalid' }))).toThrow();
    expect(() => parseBackup('invalid JSON')).toThrow();
});

it('enforces the UTF-8 backup byte limit as well as the string length limit', () => {
    expect(() => parseBackup('a'.repeat(MAX_BACKUP_BYTES + 1))).toThrow('size limit');
    expect(() => parseBackup('é'.repeat(MAX_BACKUP_BYTES / 2 + 1))).toThrow('size limit');
});
