import { SIM_INPUT } from '../../ui/styles/simulatorClasses.js';
import { SIM_APP_PAGE_CONTENT } from '../../ui/styles/semanticSimulatorClasses.js';
import type { Photo } from '@signalsafe/simulator-core/apps/contracts';
import { useSimulatorAppsHost } from '../shared/SimulatorAppsHost.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';

export default function PhotoEditor({
    photo,
    disabled,
    onChange,
    onReplace,
}: Readonly<{
    photo: Photo;
    disabled: boolean;
    onChange: (photo: Photo) => void;
    onReplace: (file: File) => void;
}>) {
    const { formatCaptureDate: captureDateLabel } = useSimulatorAppsHost();
    const { t } = useSimulatorLocale();
    return (
        <fieldset disabled={disabled} className={SIM_APP_PAGE_CONTENT}>
            <legend>{t('app.photos.edit')}</legend>
            <label>
                {t('app.vault.title')}
                <input
                    className={SIM_INPUT}
                    value={photo.title}
                    maxLength={200}
                    onChange={(event) => onChange({ ...photo, title: event.target.value })}
                />
            </label>
            <label>
                {t('app.photos.caption')}
                <textarea
                    className={SIM_INPUT}
                    value={photo.caption}
                    maxLength={10000}
                    onChange={(event) => onChange({ ...photo, caption: event.target.value })}
                />
            </label>
            <label>
                {t('app.photos.captured')}
                <input
                    className={SIM_INPUT}
                    type='datetime-local'
                    step='1'
                    value={photo.metadata.capturedAt}
                    onChange={(event) =>
                        onChange({
                            ...photo,
                            metadata: { ...photo.metadata, capturedAt: event.target.value },
                        })
                    }
                />
            </label>
            <label>
                {t('app.photos.timeZone')}
                <input
                    className={SIM_INPUT}
                    value={photo.metadata.timeZone}
                    maxLength={100}
                    placeholder={t('app.photos.timeZonePlaceholder')}
                    onChange={(event) =>
                        onChange({
                            ...photo,
                            metadata: { ...photo.metadata, timeZone: event.target.value },
                        })
                    }
                />
            </label>
            {(['latitude', 'longitude'] as const).map((coordinate) => (
                <label key={coordinate}>
                    {coordinate === 'latitude'
                        ? t('app.photos.latitude')
                        : t('app.photos.longitude')}
                    <input
                        className={SIM_INPUT}
                        type='number'
                        step='any'
                        min={coordinate === 'latitude' ? -90 : -180}
                        max={coordinate === 'latitude' ? 90 : 180}
                        value={photo.metadata[coordinate] ?? ''}
                        onChange={(event) =>
                            onChange({
                                ...photo,
                                metadata: {
                                    ...photo.metadata,
                                    [coordinate]:
                                        event.target.value === ''
                                            ? null
                                            : Number(event.target.value),
                                },
                            })
                        }
                    />
                </label>
            ))}
            <label>
                {t('app.photos.replace')}
                <input
                    className={SIM_INPUT}
                    type='file'
                    accept='image/png,image/jpeg,image/webp'
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) onReplace(file);
                        event.target.value = '';
                    }}
                />
            </label>
            <section aria-label={t('app.photos.originalMetadata')}>
                <h3>{t('app.photos.originalMetadata')}</h3>
                <p>{captureDateLabel(photo.original, t)}</p>
                <p>
                    {t('app.photos.originalCoordinates', {
                        latitude: photo.original.latitude ?? t('app.unknown'),
                        longitude: photo.original.longitude ?? t('app.unknown'),
                    })}
                </p>
                <p>{t('app.photos.editsNotice')}</p>
            </section>
        </fieldset>
    );
}
