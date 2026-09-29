import { useSimulatorAppsHost } from './host.js';

export default function PhotoLocation({
    latitude,
    longitude,
}: {
    latitude: number | null;
    longitude: number | null;
}) {
    const { renderPhotoMap } = useSimulatorAppsHost();
    const hasLocation = latitude !== null && longitude !== null;
    return (
        <section
            className="prototype-photo-card prototype-location-card"
            aria-label="Photo location"
        >
            {hasLocation ? (
                renderPhotoMap?.(latitude, longitude)
            ) : (
                <div className="prototype-location-empty">No location recorded for this photo.</div>
            )}
            <div className="prototype-photo-card-body">
                <dl className="prototype-photo-details">
                    <dt>Latitude</dt>
                    <dd>{latitude ?? 'Unknown'}</dd>
                    <dt>Longitude</dt>
                    <dd>{longitude ?? 'Unknown'}</dd>
                </dl>
            </div>
        </section>
    );
}
