import { useState } from 'react';
import type { Photo } from '@signalsafe/simulator-core/apps/contracts';
import { useSimulatorAppsHost } from '../shared/SimulatorAppsHost.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';

interface LoadedDimensions {
    source: string;
    width: number;
    height: number;
}

export default function PhotoDetailsCard({ photo }: Readonly<{ photo: Photo }>) {
    const { formatCaptureDate: captureDateLabel } = useSimulatorAppsHost();
    const { t } = useSimulatorLocale();
    const [dimensions, setDimensions] = useState<LoadedDimensions | null>(null);
    return (
        <article className='prototype-photo-card' aria-label={t('app.photos.details')}>
            {/* oxlint-disable-next-line nextjs/no-img-element -- Vite host displaying bounded local image data. */}
            <img
                className='prototype-photo'
                src={photo.asset.data}
                onLoad={(event) =>
                    setDimensions({
                        source: event.currentTarget.src,
                        width: event.currentTarget.naturalWidth,
                        height: event.currentTarget.naturalHeight,
                    })
                }
                onError={() => setDimensions(null)}
                alt={photo.caption || photo.title}
            />
            <div className='prototype-photo-card-body'>
                <dl className='prototype-photo-details'>
                    <dt>{t('app.vault.title')}</dt>
                    <dd>{photo.title}</dd>
                    <dt>{t('app.photos.fileType')}</dt>
                    <dd>{photo.asset.mime}</dd>
                    <dt>{t('app.photos.width')}</dt>
                    <dd>
                        {dimensions?.source === photo.asset.data
                            ? t('app.photos.pixels', { value: dimensions.width })
                            : t('app.unknown')}
                    </dd>
                    <dt>{t('app.photos.height')}</dt>
                    <dd>
                        {dimensions?.source === photo.asset.data
                            ? t('app.photos.pixels', { value: dimensions.height })
                            : t('app.unknown')}
                    </dd>
                    <dt>{t('app.photos.captured')}</dt>
                    <dd>{captureDateLabel(photo.metadata, t)}</dd>
                </dl>
            </div>
        </article>
    );
}
