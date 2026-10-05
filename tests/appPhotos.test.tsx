// @vitest-environment jsdom
import {
    emptySimulatorStore,
    photoSchema,
    type Photo,
} from '@signalsafe/simulator-core/apps/contracts';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PhotoEditor from '../src/apps/photos/PhotoEditor';
import PhotoLocation from '../src/apps/photos/PhotoLocation';
import Photos from '../src/apps/photos/Photos';
import { SimulatorAppsProvider } from '../src/apps/shared/SimulatorAppsHost';
import { StoreHarness, flush, type HarnessStore } from './support/appHarness';

const PNG = 'data:image/png;base64,AAAA';
const stamp = '2024-01-02T03:04:05.000Z';
const noMetadata = { capturedAt: '', timeZone: '', latitude: null, longitude: null };

const photo = (id: string, overrides: Partial<Photo> = {}): Photo => ({
    id,
    title: `Photo ${id}`,
    caption: '',
    asset: { name: `${id}.png`, mime: 'image/png', data: PNG },
    original: noMetadata,
    metadata: noMetadata,
    createdAt: stamp,
    updatedAt: stamp,
    ...overrides,
});

const storeWith = (photos: Photo[]) => ({ ...emptySimulatorStore(), photos });

const imageFile = (name = 'new.png') => {
    const file = new File(['bytes'], name, { type: 'image/png' });
    Object.defineProperty(file, 'arrayBuffer', { value: async () => new ArrayBuffer(0) });
    return file;
};

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe('Photos', () => {
    const asset = (name: string) => ({ name, mime: 'image/png' as const, data: PNG });
    const setup = ({
        photos = [] as Photo[],
        readAsset = vi.fn(async (file: File) => asset(file.name)),
        extractPhotoMetadata = vi.fn(() => ({ ...noMetadata })),
        onBack = vi.fn(),
        prepare,
        host = {},
    }: {
        photos?: Photo[];
        readAsset?: (file: File, imageOnly?: boolean) => Promise<ReturnType<typeof asset>>;
        extractPhotoMetadata?: (buffer: ArrayBuffer) => typeof noMetadata;
        onBack?: () => void;
        prepare?: (store: HarnessStore) => void;
        host?: Record<string, unknown>;
    } = {}) => {
        let current!: HarnessStore;
        const view = render(
            <SimulatorAppsProvider value={{ readAsset, extractPhotoMetadata, ...host } as never}>
                <StoreHarness initial={storeWith(photos)} prepare={prepare}>
                    {(store) => {
                        current = store;
                        return <Photos store={store} onBack={onBack} />;
                    }}
                </StoreHarness>
            </SimulatorAppsProvider>,
        );
        return { ...view, store: () => current, readAsset, onBack };
    };
    const open = async (title: string) => {
        await act(flush);
        fireEvent.click(screen.getByAltText(title).closest('button')!);
    };
    const choose = async (file = imageFile(), label = 'Add photo') => {
        fireEvent.change(screen.getByLabelText(label), { target: { files: [file] } });
        await act(flush);
    };
    const nav = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
    const field = (label: string, value: string) =>
        fireEvent.change(screen.getByLabelText(label), { target: { value } });

    it('shows an empty state and returns to the previous app', async () => {
        const { onBack } = setup();
        await act(flush);
        expect(screen.getByText('No photos saved.')).toBeInstanceOf(HTMLElement);
        nav('Back');
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('renders nothing until the store has data', () => {
        const { container } = setup({
            prepare: (store) => Object.defineProperty(store, 'data', { value: null }),
        });
        expect(container.firstChild).toBeNull();
    });

    it('lists saved photos, pages through them and opens details', async () => {
        const photos = Array.from({ length: 25 }, (_, index) =>
            photo(String(index), { caption: index === 0 ? 'Sunset' : '' }),
        );
        setup({ photos, host: { formatCaptureDate: () => 'when' } });
        await act(flush);
        expect(screen.getAllByRole('img')).toHaveLength(20);
        fireEvent.click(screen.getByText('Load more photos'));
        await act(flush);
        expect(screen.getAllByRole('img')).toHaveLength(25);
        fireEvent.click(screen.getByAltText('Sunset').closest('button')!);
        expect(screen.getByLabelText('Photo details')).toBeInstanceOf(HTMLElement);
        expect(screen.getByText('image/png')).toBeInstanceOf(HTMLElement);
        expect(screen.getAllByText('Unknown').length).toBeGreaterThan(0);
    });

    it('retries after a failed page load', async () => {
        const { store } = setup({
            photos: [photo('1')],
            prepare: (created) => {
                const page = created.page;
                let calls = 0;
                created.page = (collection, query) => {
                    calls += 1;
                    return calls === 1
                        ? Promise.reject(new Error('offline'))
                        : page(collection, query);
                };
            },
        });
        await act(flush);
        expect(screen.getAllByText('offline').length).toBeGreaterThan(0);
        fireEvent.click(screen.getByText('Retry'));
        await act(flush);
        expect(screen.getByAltText('Photo 1')).toBeInstanceOf(HTMLElement);
        expect(store().error).toBe('');
    });

    it('reports image dimensions once loaded and unknown after errors', async () => {
        setup({ photos: [photo('1')] });
        await open('Photo 1');
        const image = screen.getAllByRole('img')[0] as HTMLImageElement;
        Object.defineProperty(image, 'naturalWidth', { value: 640 });
        Object.defineProperty(image, 'naturalHeight', { value: 480 });
        fireEvent.load(image);
        expect(screen.getByText('640 px')).toBeInstanceOf(HTMLElement);
        expect(screen.getByText('480 px')).toBeInstanceOf(HTMLElement);
        fireEvent.error(image);
        expect(screen.queryByText('640 px')).toBeNull();
    });

    it('edits and saves an existing photo', async () => {
        const { store } = setup({ photos: [photo('1')] });
        await open('Photo 1');
        nav('Edit photo');
        field('Title', 'Renamed');
        field('Caption', 'A caption');
        field('Capture date and time', '2024-05-06T07:08:09');
        field('Capture time zone or UTC offset (blank if unknown)', '+02:00');
        field('Latitude', '51.5');
        field('Longitude', '-0.1');
        nav('Save photo');
        await act(flush);
        expect(store().state().photos[0]).toMatchObject({
            title: 'Renamed',
            caption: 'A caption',
            metadata: {
                capturedAt: '2024-05-06T07:08:09',
                timeZone: '+02:00',
                latitude: 51.5,
                longitude: -0.1,
            },
        });
        expect(screen.getByText('Add photo')).toBeInstanceOf(HTMLElement);
    });

    it('keeps the draft open when the store refuses the save', async () => {
        setup({
            photos: [photo('1')],
            prepare: (store) => {
                store.put = async () => false;
            },
        });
        await open('Photo 1');
        nav('Edit photo');
        nav('Save photo');
        await act(flush);
        expect(screen.getByLabelText('Photo details')).toBeInstanceOf(HTMLElement);
    });

    it('explains validation failures, including without a specific issue', async () => {
        setup({ photos: [photo('1')] });
        await open('Photo 1');
        nav('Edit photo');
        field('Title', '   ');
        nav('Save photo');
        expect(screen.getByRole('alert').textContent).toContain('Photo could not be saved: title');

        vi.spyOn(photoSchema, 'safeParse').mockReturnValue({
            success: false,
            error: { issues: [] },
        } as never);
        nav('Save photo');
        expect(screen.getByRole('alert').textContent).toBe(
            'Photo could not be saved: details — Check the photo details.',
        );
    });

    it('asks before discarding edits and closes unchanged drafts directly', async () => {
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
        setup({ photos: [photo('1')] });
        await open('Photo 1');
        nav('Edit photo');
        nav('Back');
        expect(screen.getByText('Add photo')).toBeInstanceOf(HTMLElement);
        expect(confirm).not.toHaveBeenCalled();

        await open('Photo 1');
        nav('Edit photo');
        field('Title', 'Changed');
        nav('Back');
        expect(confirm).toHaveBeenCalledWith('Discard unsaved photo changes?');
        expect(screen.getByLabelText('Photo details')).toBeInstanceOf(HTMLElement);
        confirm.mockReturnValue(true);
        nav('Back');
        expect(screen.getByText('Add photo')).toBeInstanceOf(HTMLElement);
    });

    it('closes details without confirmation when not editing', async () => {
        setup({ photos: [photo('1')] });
        await open('Photo 1');
        nav('Back');
        expect(screen.getByText('Add photo')).toBeInstanceOf(HTMLElement);
    });

    it('deletes after confirmation only', async () => {
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
        const { store } = setup({ photos: [photo('1')] });
        await open('Photo 1');
        nav('Delete photo');
        await act(flush);
        expect(store().state().photos).toHaveLength(1);

        confirm.mockReturnValue(true);
        const remove = store().remove;
        store().remove = async () => false;
        nav('Delete photo');
        await act(flush);
        expect(screen.getByLabelText('Photo details')).toBeInstanceOf(HTMLElement);

        store().remove = remove;
        nav('Delete photo');
        await act(flush);
        expect(store().state().photos).toHaveLength(0);
        expect(screen.getByText('No photos saved.')).toBeInstanceOf(HTMLElement);
    });

    it('imports a new photo, extracting metadata, and saves it', async () => {
        const original = { ...noMetadata, capturedAt: '2020-01-01T00:00:00', timeZone: '+01:00' };
        const { store, readAsset } = setup({ extractPhotoMetadata: () => original });
        await act(flush);
        await choose(imageFile('holiday.png'));
        expect(readAsset).toHaveBeenCalledWith(expect.any(File), true);
        expect(screen.queryByRole('button', { name: 'Delete photo' })).toBeNull();
        expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('holiday.png');
        nav('Save photo');
        await act(flush);
        expect(store().state().photos[0]).toMatchObject({
            title: 'holiday.png',
            metadata: original,
            original,
        });
    });

    it('ignores empty file selections', async () => {
        const { readAsset } = setup();
        await act(flush);
        fireEvent.change(screen.getByLabelText('Add photo'), { target: { files: [] } });
        expect(readAsset).not.toHaveBeenCalled();
    });

    it('replaces the image of an existing photo and keeps its details', async () => {
        const { readAsset, store } = setup({
            photos: [photo('1', { caption: 'Keep me' })],
            readAsset: vi.fn(async () => ({
                ...asset('new.png'),
                data: 'data:image/png;base64,BBBB',
            })),
        });
        await open('Keep me');
        nav('Edit photo');
        fireEvent.change(screen.getByLabelText('Replace image'), {
            target: { files: [imageFile()] },
        });
        await act(flush);
        expect(readAsset).toHaveBeenCalled();
        expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('Photo 1');
        nav('Save photo');
        await act(flush);
        expect(store().state().photos[0]).toMatchObject({
            caption: 'Keep me',
            asset: { data: 'data:image/png;base64,BBBB' },
        });
    });

    it('shows import errors with a fallback for non-errors', async () => {
        const readAsset = vi.fn(async () => {
            throw new Error('Choose a PNG, JPEG or WebP image.');
        });
        setup({ readAsset });
        await act(flush);
        await choose();
        expect(screen.getByRole('alert').textContent).toBe('Choose a PNG, JPEG or WebP image.');
        readAsset.mockImplementationOnce(() => Promise.reject('bad'));
        await choose();
        expect(screen.getByRole('alert').textContent).toBe('Photo import failed.');
    });

    it('shows progress while reading and discards results after leaving', async () => {
        const gate = deferred<ReturnType<typeof asset>>();
        const { onBack } = setup({ readAsset: () => gate.promise });
        await act(flush);
        await choose();
        expect(screen.getByText('Reading image…')).toBeInstanceOf(HTMLElement);
        nav('Back');
        expect(onBack).toHaveBeenCalled();
        await act(async () => gate.resolve(asset('late.png')));
        expect(screen.queryByLabelText('Photo details')).toBeNull();
        expect(screen.queryByText('Reading image…')).toBeNull();
    });

    it('discards failures after leaving and after unmounting', async () => {
        const gate = deferred<ReturnType<typeof asset>>();
        const { unmount } = setup({ readAsset: () => gate.promise });
        await act(flush);
        await choose();
        nav('Back');
        await act(async () => gate.reject(new Error('late failure')));
        expect(screen.queryByText('late failure')).toBeNull();

        const second = deferred<ReturnType<typeof asset>>();
        unmount();
        const view = setup({ readAsset: () => second.promise });
        await act(flush);
        await choose();
        view.unmount();
        await act(async () => second.resolve(asset('late.png')));
    });
});

describe('PhotoEditor', () => {
    const base = photo('1', {
        metadata: { ...noMetadata, latitude: 10, longitude: 20 },
        original: { ...noMetadata, latitude: 1, longitude: 2, capturedAt: '2020-01-01T00:00:00' },
    });

    it('edits fields and clears coordinates', () => {
        const onChange = vi.fn();
        render(
            <PhotoEditor photo={base} disabled={false} onChange={onChange} onReplace={vi.fn()} />,
        );
        fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '' } });
        expect(onChange.mock.calls[0]![0].metadata.latitude).toBeNull();
        fireEvent.change(screen.getByLabelText('Longitude'), { target: { value: '45.5' } });
        expect(onChange.mock.calls[1]![0].metadata.longitude).toBe(45.5);
        expect(screen.getByText('Latitude: 1; Longitude: 2')).toBeInstanceOf(HTMLElement);
    });

    it('reports unknown original coordinates and ignores empty replacement selections', () => {
        const onReplace = vi.fn();
        render(
            <PhotoEditor
                photo={{ ...base, original: noMetadata }}
                disabled
                onChange={vi.fn()}
                onReplace={onReplace}
            />,
        );
        expect(screen.getByText('Latitude: Unknown; Longitude: Unknown')).toBeInstanceOf(
            HTMLElement,
        );
        fireEvent.change(screen.getByLabelText('Replace image'), { target: { files: [] } });
        expect(onReplace).not.toHaveBeenCalled();
        expect(within(screen.getByRole('group')).getByLabelText('Title')).toBeInstanceOf(
            HTMLElement,
        );
    });
});

describe('PhotoLocation', () => {
    it('renders the host map when coordinates exist', () => {
        render(
            <SimulatorAppsProvider
                value={{ renderPhotoMap: (lat, lng) => <i>{`map ${lat},${lng}`}</i> }}
            >
                <PhotoLocation latitude={1.5} longitude={2.5} />
            </SimulatorAppsProvider>,
        );
        expect(screen.getByText('map 1.5,2.5')).toBeInstanceOf(HTMLElement);
    });

    it('renders no map without a host renderer or coordinates', () => {
        const { rerender } = render(<PhotoLocation latitude={1} longitude={2} />);
        expect(screen.queryByText('No location recorded for this photo.')).toBeNull();
        rerender(<PhotoLocation latitude={null} longitude={2} />);
        expect(screen.getByText('No location recorded for this photo.')).toBeInstanceOf(
            HTMLElement,
        );
        rerender(<PhotoLocation latitude={1} longitude={null} />);
        expect(screen.getAllByText('Unknown')).toHaveLength(1);
    });
});
