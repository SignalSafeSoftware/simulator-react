import { useDevicePage } from './useDevicePage.js';
import { SimulatorAppNavItem as SimulatorPhoneNavItem } from './SimulatorAppNavItem.js';
import { useVisiblePage } from './useVisiblePage.js';
import { LoadMore } from './LoadMore.js';
import PhotoLocation from './PhotoLocation.js';
import PhotoEditor from './PhotoEditor.js';
import { useSimulatorAppsHost } from './host.js';
import { createSimulatorId } from '@signalsafe/simulator-core';
import { useEffect, useRef, useState } from 'react';
import { DevicePage } from './DevicePage.js';
import { photoSchema, type Photo } from '@signalsafe/simulator-core';
import type { DeviceStore } from '@signalsafe/simulator-core';
export default function Photos({ store, onBack }: { store: DeviceStore; onBack: () => void }) {
    const {
        formatCaptureDate: captureDateLabel,
        readAsset,
        extractPhotoMetadata,
    } = useSimulatorAppsHost();
    const visiblePage = useVisiblePage('photos');
    const photos = useDevicePage(store, 'photos', {}, visiblePage.count);
    const [existing, setExisting] = useState(false);
    const [draft, setDraft] = useState<Photo | null>(null);
    const [editing, setEditing] = useState(false);
    const baseline = useRef<Photo | null>(null);
    const [dimensions, setDimensions] = useState<{
        source: string;
        width: number;
        height: number;
    } | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const generation = useRef(0);
    useEffect(
        () => () => {
            generation.current += 1;
        },
        [],
    );
    const close = () => {
        generation.current += 1;
        setLoading(false);
        setDraft(null);
        setEditing(false);
        setError('');
    };
    const back = () => {
        if (store.busy) return;
        if (
            editing &&
            JSON.stringify(draft) !== JSON.stringify(baseline.current) &&
            !window.confirm('Discard unsaved photo changes?')
        )
            return;
        close();
    };
    const data = store.data;
    if (!data) return null;
    async function choose(file: File, replacing: Photo | null) {
        const request = ++generation.current;
        setLoading(true);
        setError('');
        try {
            const asset = await readAsset(file, true);
            const original = extractPhotoMetadata(await file.arrayBuffer());
            if (request !== generation.current) return;
            const now = new Date().toISOString();
            setExisting(replacing !== null && baseline.current !== null);
            setEditing(true);
            if (!replacing) baseline.current = null;
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
            if (request !== generation.current) return;
            setError(reason instanceof Error ? reason.message : 'Photo import failed.');
        } finally {
            if (request === generation.current) setLoading(false);
        }
    }
    async function save() {
        if (!data) return;
        setError('');
        const parsed = photoSchema.safeParse({
            ...draft,
            updatedAt: new Date().toISOString(),
        });
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            setError(
                `Photo could not be saved: ${issue?.path.join('.') ?? 'details'} — ${issue?.message ?? 'Check the photo details.'}`,
            );
            return;
        }
        if (await store.put('photos', parsed.data)) close();
    }
    return (
        <DevicePage
            title="Photos"
            listLayout={draft !== null}
            navigation={
                draft ? (
                    <nav
                        className="simulator-device-nav"
                        aria-label="App secondary menu"
                        data-nav-mode="secondary"
                    >
                        <ul className="simulator-device-nav__list">
                            {editing ? (
                                <li className="simulator-device-nav__item">
                                    <SimulatorPhoneNavItem
                                        label="Save photo"
                                        icon="✓"
                                        disabled={store.busy || loading}
                                        onClick={() => void save()}
                                    />
                                </li>
                            ) : (
                                <li className="simulator-device-nav__item">
                                    <SimulatorPhoneNavItem
                                        label="Edit photo"
                                        icon="✎"
                                        disabled={store.busy || loading}
                                        onClick={() => setEditing(true)}
                                    />
                                </li>
                            )}
                            {existing && (
                                <li className="simulator-device-nav__item">
                                    <SimulatorPhoneNavItem
                                        label="Delete photo"
                                        icon="🗑"
                                        disabled={store.busy || loading}
                                        onClick={async () => {
                                            if (
                                                window.confirm(`Delete ${draft.title}?`) &&
                                                (await store.remove('photos', draft.id))
                                            )
                                                close();
                                        }}
                                    />
                                </li>
                            )}
                            <li className="simulator-device-nav__item">
                                <SimulatorPhoneNavItem
                                    label="Back"
                                    icon="↩"
                                    disabled={store.busy}
                                    onClick={back}
                                />
                            </li>
                        </ul>
                    </nav>
                ) : undefined
            }
            onBack={() => {
                if (draft) back();
                else {
                    close();
                    onBack();
                }
            }}
        >
            {error && <p role="alert">{error}</p>}
            {loading && <output>Reading image…</output>}
            {!draft && (
                <label>
                    Add photo
                    <input
                        className="simulator-input"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
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
                    <article className="prototype-photo-card" aria-label="Photo details">
                        {/* oxlint-disable-next-line nextjs/no-img-element -- Vite host displaying bounded local image data. */}
                        <img
                            className="prototype-photo"
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
                        <div className="prototype-photo-card-body">
                            <dl className="prototype-photo-details">
                                <dt>Title</dt>
                                <dd>{draft.title}</dd>
                                <dt>File type</dt>
                                <dd>{draft.asset.mime}</dd>
                                <dt>Width</dt>
                                <dd>
                                    {dimensions?.source === draft.asset.data
                                        ? `${dimensions.width} px`
                                        : 'Unknown'}
                                </dd>
                                <dt>Height</dt>
                                <dd>
                                    {dimensions?.source === draft.asset.data
                                        ? `${dimensions.height} px`
                                        : 'Unknown'}
                                </dd>
                                <dt>Capture date and time</dt>
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
                    <div className="prototype-gallery">
                        {photos.records.map((item) => (
                            <button
                                className="simulator-btn simulator-btn--neutral-outline"
                                key={item.id}
                                onClick={() => {
                                    setError('');
                                    setExisting(true);
                                    setEditing(false);
                                    baseline.current = item;
                                    setDraft(item);
                                }}
                            >
                                {/* oxlint-disable-next-line nextjs/no-img-element -- Vite app with bounded local image assets. */}
                                <img
                                    loading="lazy"
                                    src={item.asset.data}
                                    alt={item.caption || item.title}
                                />
                                <span className="prototype-photo-date">
                                    {captureDateLabel(item.metadata)}
                                </span>
                            </button>
                        ))}
                    </div>
                    {photos.error && (
                        <p className="simulator-list-error" role="alert">
                            {photos.error}
                        </p>
                    )}
                    <LoadMore
                        count={visiblePage.count}
                        hasMore={visiblePage.count < photos.total}
                        loading={photos.loading}
                        error={photos.error}
                        onLoadMore={photos.error ? photos.retry : visiblePage.loadMore}
                        label="Load more photos"
                    />
                    {!photos.loading && !photos.error && !photos.total && <p>No photos saved.</p>}
                </>
            )}
        </DevicePage>
    );
}
