import { useDeviceRecord } from '../../hooks/device/useDeviceRecord.js';
import { useDevicePage } from '../../hooks/device/useDevicePage.js';
import { useVisiblePage } from '../../hooks/device/useVisiblePage.js';
import PhotoLocation from './PhotoLocation.js';
import PhotoEditor from './PhotoEditor.js';
import PhotoDetailsCard from './PhotoDetailsCard.js';
import PhotoGallery from './PhotoGallery.js';
import { useSimulatorAppsHost } from '../shared/SimulatorAppsHost.js';
import { useDraftBaseline } from '../shared/useDraftBaseline.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { createSimulatorId } from '@signalsafe/simulator-core/apps/id';
import { useEffect, useRef, useState } from 'react';
import { useLatestRequest } from '../../hooks/useLatestRequest.js';
import { DevicePage } from '../shared/DevicePage.js';
import { AppSecondaryNav, type AppNavAction } from '../shared/AppSecondaryNav.js';
import { photoSchema, type Photo } from '@signalsafe/simulator-core/apps/contracts';
import type { DeviceStore } from '@signalsafe/simulator-core/apps/store';
import { currentIsoTime } from '../../utils/browser/browserEnvironment.js';
export interface PhotoNavigation {
    revision: number;
    photo: Photo | null;
}
export default function Photos({
    store,
    onBack,
    navigation,
    onSelectedPhotoChange,
}: Readonly<{
    store: DeviceStore;
    onBack: () => void;
    navigation?: PhotoNavigation;
    onSelectedPhotoChange?: (id: string | undefined) => void;
}>) {
    const { readAsset, extractPhotoMetadata, confirm } = useSimulatorAppsHost();
    const { t } = useSimulatorLocale();
    const visiblePage = useVisiblePage('photos');
    const photos = useDevicePage(store, 'photos', {}, visiblePage.count);
    const [mode, setMode] = useState({ existing: false, editing: false });
    const { existing, editing } = mode;
    const setExisting = (value: boolean) => setMode((current) => ({ ...current, existing: value }));
    const setEditing = (value: boolean) => setMode((current) => ({ ...current, editing: value }));
    const [draft, setDraft] = useState<Photo | null>(null);
    const { setBaseline, hasBaseline, confirmDiscard } = useDraftBaseline(draft);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const latest = useLatestRequest();
    const fileInput = useRef<HTMLInputElement>(null);
    const close = () => {
        latest.cancel();
        setLoading(false);
        setDraft(null);
        setEditing(false);
        setError('');
        onSelectedPhotoChange?.(undefined);
    };
    const back = () => {
        if (editing && !confirmDiscard(t('app.photos.discardConfirm'))) return;
        close();
    };
    const consumedNavigation = useRef<number | undefined>(undefined);
    useEffect(() => {
        if (!navigation || consumedNavigation.current === navigation.revision) return;
        consumedNavigation.current = navigation.revision;
        if (editing && !confirmDiscard(t('app.photos.discardConfirm'))) {
            onSelectedPhotoChange?.(draft?.id);
            return;
        }
        latest.cancel();
        setLoading(false);
        setDraft(null);
        setMode({ existing: false, editing: false });
        setError('');
        onSelectedPhotoChange?.(undefined);
        if (navigation.photo) {
            setMode({ existing: true, editing: false });
            setBaseline(navigation.photo);
            setDraft(navigation.photo);
            onSelectedPhotoChange?.(navigation.photo.id);
        }
    }, [navigation, editing, confirmDiscard, t, draft, onSelectedPhotoChange, latest, setBaseline]);
    const selectedPhoto = useDeviceRecord(store, 'photos', existing ? (draft?.id ?? null) : null);
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
    const current = !editing && draft ? (selectedPhoto.record ?? draft) : draft;
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
                      onClick: () => {
                          setDraft(current);
                          setBaseline(current);
                          setEditing(true);
                      },
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
    function leave() {
        close();
        onBack();
    }
    function listActions(): AppNavAction[] {
        return [
            {
                label: t('app.photos.add'),
                icon: '🖼',
                disabled: loading || store.busy,
                onClick: () => fileInput.current?.click(),
            },
            { label: t('app.back'), icon: '↩', onClick: leave },
        ];
    }
    return (
        <DevicePage
            title={t('app.photos.title')}
            icon='🖼'
            listLayout={draft !== null}
            plain
            navigation={<AppSecondaryNav actions={current ? navActions(current) : listActions()} />}
            onBack={leave}
        >
            {error && <p role='alert'>{error}</p>}
            {loading && <output>{t('app.photos.reading')}</output>}
            {!draft && (
                <input
                    ref={fileInput}
                    hidden
                    type='file'
                    aria-label={t('app.photos.add')}
                    accept='image/png,image/jpeg,image/webp'
                    disabled={loading || store.busy}
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void choose(file, null);
                        event.target.value = '';
                    }}
                />
            )}
            {draft ? (
                <>
                    <PhotoDetailsCard photo={current ?? draft} />
                    {editing && (
                        <PhotoEditor
                            photo={draft}
                            disabled={store.busy || loading}
                            onChange={setDraft}
                            onReplace={(file) => void choose(file, draft)}
                        />
                    )}
                    <PhotoLocation
                        latitude={(current ?? draft).metadata.latitude}
                        longitude={(current ?? draft).metadata.longitude}
                    />
                </>
            ) : (
                <PhotoGallery
                    photos={photos}
                    visiblePage={visiblePage}
                    onOpen={(item) => {
                        setError('');
                        setExisting(true);
                        setEditing(false);
                        setBaseline(item);
                        setDraft(item);
                        onSelectedPhotoChange?.(item.id);
                    }}
                />
            )}
        </DevicePage>
    );
}
