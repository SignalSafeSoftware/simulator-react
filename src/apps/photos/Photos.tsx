import { SIM_INPUT, SIM_BTN_OUTLINE } from '../../ui/styles/simulatorClasses.js';
import { useDevicePage } from '../../hooks/device/useDevicePage.js';
import { useVisiblePage } from '../../hooks/device/useVisiblePage.js';
import { PagedListFooter } from '../shared/PagedListFooter.js';
import PhotoLocation from './PhotoLocation.js';
import PhotoEditor from './PhotoEditor.js';
import { useSimulatorAppsHost } from '../shared/SimulatorAppsHost.js';
import { useDraftBaseline } from '../shared/useDraftBaseline.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { createSimulatorId } from '@signalsafe/simulator-core/apps/id';
import { useState } from 'react';
import { useLatestRequest } from '../../hooks/useLatestRequest.js';
import { DevicePage } from '../shared/DevicePage.js';
import { AppSecondaryNav, type AppNavAction } from '../shared/AppSecondaryNav.js';
import { photoSchema, type Photo } from '@signalsafe/simulator-core/apps/contracts';
import type { DeviceStore } from '@signalsafe/simulator-core/apps/store';
import { currentIsoTime } from '../../utils/browser/browserEnvironment.js';
export default function Photos({
    store,
    onBack,
}: Readonly<{ store: DeviceStore; onBack: () => void }>) {
    const {
        formatCaptureDate: captureDateLabel,
        readAsset,
        extractPhotoMetadata,
        confirm,
    } = useSimulatorAppsHost();
    const { t } = useSimulatorLocale();
    const visiblePage = useVisiblePage('photos');
    const photos = useDevicePage(store, 'photos', {}, visiblePage.count);
    const [existing, setExisting] = useState(false);
    const [draft, setDraft] = useState<Photo | null>(null);
    const [editing, setEditing] = useState(false);
    const { setBaseline, hasBaseline, confirmDiscard } = useDraftBaseline(draft);
    const [dimensions, setDimensions] = useState<{
        source: string;
        width: number;
        height: number;
    } | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const latest = useLatestRequest();
    const close = () => {
        latest.cancel();
        setLoading(false);
        setDraft(null);
        setEditing(false);
        setError('');
    };
    const back = () => {
        if (editing && !confirmDiscard(t('app.photos.discardConfirm'))) return;
        close();
    };
    const data = store.data;
    if (!data) return null;
    async function choose(file: File, replacing: Photo | null) {
        const isLatest = latest.begin();
        setLoading(true);
        setError('');
        try {
            const asset = await readAsset(file, true);
            const original = extractPhotoMetadata(await file.arrayBuffer());
            if (!isLatest()) return;
            const now = currentIsoTime();
            setExisting(replacing !== null && hasBaseline());
            setEditing(true);
            if (!replacing) setBaseline(null);
            setDraft({
                id: replacing?.id ?? createSimulatorId(),
                title: replacing?.title ?? file.name,
                caption: replacing?.caption ?? '',
                createdAt: replacing?.createdAt ?? now,
                updatedAt: now,
                asset,
                original,
                metadata: original,
            });
        } catch (reason) {
            if (!isLatest()) return;
            setError(reason instanceof Error ? reason.message : t('app.photos.importFailed'));
        } finally {
            if (isLatest()) setLoading(false);
        }
    }
    async function save() {
        setError('');
        const parsed = photoSchema.safeParse({
            ...draft,
            updatedAt: currentIsoTime(),
        });
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            setError(
                t('app.photos.saveFailed', {
                    path: issue?.path.join('.') ?? t('app.photos.saveFailedPath'),
                    message: issue?.message ?? t('app.photos.saveFailedMessage'),
                }),
            );
            return;
        }
        if (await store.put('photos', parsed.data)) close();
    }
    function navActions(current: Photo): AppNavAction[] {
        const unavailable = store.busy || loading;
        const actions: AppNavAction[] = [
            editing
                ? {
                      label: t('app.photos.save'),
                      icon: '✓',
                      disabled: unavailable,
                      onClick: () => void save(),
                  }
                : {
                      label: t('app.photos.edit'),
                      icon: '✎',
                      disabled: unavailable,
                      onClick: () => setEditing(true),
                  },
        ];
        if (existing)
            actions.push({
                label: t('app.photos.delete'),
                icon: '🗑',
                disabled: unavailable,
                onClick: async () => {
                    if (
                        confirm(t('app.photos.deleteConfirm', { title: current.title })) &&
                        (await store.remove('photos', current.id))
                    )
                        close();
                },
            });
        actions.push({ label: t('app.back'), icon: '↩', disabled: store.busy, onClick: back });
        return actions;
    }
    return (
        <DevicePage
            title={t('app.photos.title')}
            icon='🖼'
            listLayout={draft !== null}
            navigation={draft ? <AppSecondaryNav actions={navActions(draft)} /> : undefined}
            onBack={() => {
                close();
                onBack();
            }}
        >
            {error && <p role='alert'>{error}</p>}
            {loading && <output>{t('app.photos.reading')}</output>}
            {!draft && (
                <label>
                    {t('app.photos.add')}
                    <input
                        className={SIM_INPUT}
                        type='file'
                        accept='image/png,image/jpeg,image/webp'
                        disabled={loading || store.busy}
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void choose(file, null);
                            event.target.value = '';
                        }}
                    />
                </label>
            )}
            {draft ? (
                <>
                    <article className='prototype-photo-card' aria-label={t('app.photos.details')}>
                        {/* oxlint-disable-next-line nextjs/no-img-element -- Vite host displaying bounded local image data. */}
                        <img
                            className='prototype-photo'
                            src={draft.asset.data}
                            onLoad={(event) =>
                                setDimensions({
                                    source: event.currentTarget.src,
                                    width: event.currentTarget.naturalWidth,
                                    height: event.currentTarget.naturalHeight,
                                })
                            }
                            onError={() => setDimensions(null)}
                            alt={draft.caption || draft.title}
                        />
                        <div className='prototype-photo-card-body'>
                            <dl className='prototype-photo-details'>
                                <dt>{t('app.vault.title')}</dt>
                                <dd>{draft.title}</dd>
                                <dt>{t('app.photos.fileType')}</dt>
                                <dd>{draft.asset.mime}</dd>
                                <dt>{t('app.photos.width')}</dt>
                                <dd>
                                    {dimensions?.source === draft.asset.data
                                        ? t('app.photos.pixels', { value: dimensions.width })
                                        : t('app.unknown')}
                                </dd>
                                <dt>{t('app.photos.height')}</dt>
                                <dd>
                                    {dimensions?.source === draft.asset.data
                                        ? t('app.photos.pixels', { value: dimensions.height })
                                        : t('app.unknown')}
                                </dd>
                                <dt>{t('app.photos.captured')}</dt>
                                <dd>{captureDateLabel(draft.metadata)}</dd>
                            </dl>
                        </div>
                    </article>
                    {editing && (
                        <PhotoEditor
                            photo={draft}
                            disabled={store.busy || loading}
                            onChange={setDraft}
                            onReplace={(file) => void choose(file, draft)}
                        />
                    )}
                    <PhotoLocation
                        latitude={draft.metadata.latitude}
                        longitude={draft.metadata.longitude}
                    />
                </>
            ) : (
                <>
                    <div className='prototype-gallery'>
                        {photos.records.map((item) => (
                            <button
                                className={SIM_BTN_OUTLINE}
                                key={item.id}
                                onClick={() => {
                                    setError('');
                                    setExisting(true);
                                    setEditing(false);
                                    setBaseline(item);
                                    setDraft(item);
                                }}
                            >
                                {/* oxlint-disable-next-line nextjs/no-img-element -- Vite app with bounded local image assets. */}
                                <img
                                    loading='lazy'
                                    src={item.asset.data}
                                    alt={item.caption || item.title}
                                />
                                <span className='prototype-photo-date'>
                                    {captureDateLabel(item.metadata)}
                                </span>
                            </button>
                        ))}
                    </div>
                    <PagedListFooter
                        page={photos}
                        visible={visiblePage}
                        label={t('app.photos.loadMore')}
                    />
                    {!photos.loading && !photos.error && !photos.total && (
                        <p>{t('app.photos.none')}</p>
                    )}
                </>
            )}
        </DevicePage>
    );
}
