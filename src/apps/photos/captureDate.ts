import type { PhotoMetadata } from '@signalsafe/simulator-core/apps/contracts';
import type { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { parseRegionalDateInput } from '../settings/regionalDateInput.js';

/** Interpret capture provenance before applying the host's regional presentation. */
export function formatPhotoCaptureDate(
    metadata: PhotoMetadata,
    formatDate: (date: Date) => string,
    translate: ReturnType<typeof useSimulatorLocale>['t'],
): string {
    if (!metadata.capturedAt) return translate('app.photos.captureUnknown');
    const when = metadata.capturedAt.replace('T', ' ');
    if (!metadata.timeZone) {
        return translate('app.photos.captureDate', {
            when,
            zone: translate('app.photos.captureZoneUnknown'),
        });
    }
    const instant = parseRegionalDateInput(metadata.capturedAt, metadata.timeZone);
    return Number.isFinite(instant)
        ? formatDate(new Date(instant))
        : translate('app.photos.captureInvalid', { when, zone: metadata.timeZone });
}
