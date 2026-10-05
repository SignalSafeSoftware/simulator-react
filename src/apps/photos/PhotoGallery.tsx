import type { Photo } from '@signalsafe/simulator-core/apps/contracts';
import { SIM_BTN_OUTLINE } from '../../ui/styles/simulatorClasses.js';
import type { useDevicePage } from '../../hooks/device/useDevicePage.js';
import type { useVisiblePage } from '../../hooks/device/useVisiblePage.js';
import { PagedListFooter } from '../shared/PagedListFooter.js';
import { useSimulatorAppsHost } from '../shared/SimulatorAppsHost.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';

export default function PhotoGallery({
    photos,
    visiblePage,
    onOpen,
}: Readonly<{
    photos: ReturnType<typeof useDevicePage<'photos'>>;
    visiblePage: ReturnType<typeof useVisiblePage>;
    onOpen: (photo: Photo) => void;
}>) {
    const { formatCaptureDate: captureDateLabel } = useSimulatorAppsHost();
    const { t } = useSimulatorLocale();
    return (
        <>
            <div className='prototype-gallery'>
                {photos.records.map((item) => (
                    <button className={SIM_BTN_OUTLINE} key={item.id} onClick={() => onOpen(item)}>
                        {/* oxlint-disable-next-line nextjs/no-img-element -- Vite app with bounded local image assets. */}
                        <img
                            loading='lazy'
                            src={item.asset.data}
                            alt={item.caption || item.title}
                        />
                        <span className='prototype-photo-date'>
                            {captureDateLabel(item.metadata, t)}
                        </span>
                    </button>
                ))}
            </div>
            <PagedListFooter page={photos} visible={visiblePage} label={t('app.photos.loadMore')} />
            {!photos.loading && !photos.error && !photos.total && <p>{t('app.photos.none')}</p>}
        </>
    );
}
