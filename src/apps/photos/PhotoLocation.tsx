import { useSimulatorAppsHost } from '../shared/SimulatorAppsHost.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { formatCoordinate } from './formatCoordinate.js';

export default function PhotoLocation({
    latitude,
    longitude,
}: Readonly<{
    latitude: number | null;
    longitude: number | null;
}>) {
    const { renderPhotoMap } = useSimulatorAppsHost();
    const { t } = useSimulatorLocale();
    const hasLocation = latitude !== null && longitude !== null;
    return (
        <section
            className='prototype-photo-card prototype-location-card'
            aria-label={t('app.photos.location')}
        >
            {hasLocation ? (
                renderPhotoMap?.(latitude, longitude)
            ) : (
                <div className='prototype-location-empty'>{t('app.photos.noLocation')}</div>
            )}
            <div className='prototype-photo-card-body'>
                <dl className='prototype-photo-details'>
                    <dt>{t('app.photos.latitude')}</dt>
                    <dd>{formatCoordinate(latitude, t('app.unknown'))}</dd>
                    <dt>{t('app.photos.longitude')}</dt>
                    <dd>{formatCoordinate(longitude, t('app.unknown'))}</dd>
                </dl>
            </div>
        </section>
    );
}
