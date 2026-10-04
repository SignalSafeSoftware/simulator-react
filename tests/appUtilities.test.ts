// @vitest-environment jsdom
import { MAX_ASSET_BYTES, MAX_PHOTO_BYTES } from '@signalsafe/simulator-core/apps/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkLock, createLock } from '../src/apps/lock/lock';
import { extractPhotoMetadata } from '../src/apps/photos/photoMetadata';
import { readAsset } from '../src/apps/shared/assets';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('lock', () => {
    it('creates a salted digest and verifies passwords against it', async () => {
        const lock = await createLock('secret-1');
        expect(lock.salt).toHaveLength(32);
        expect(await checkLock('secret-1', lock)).toBe(true);
        expect(await checkLock('other', lock)).toBe(false);
        expect(await checkLock('anything', null)).toBe(true);
    });

    it('rejects passwords outside the supported length', async () => {
        await expect(createLock('abc')).rejects.toThrow('between 4 and 128');
        await expect(createLock('x'.repeat(129))).rejects.toThrow('between 4 and 128');
    });
});

describe('readAsset', () => {
    const textFile = (name = 'note.txt', body = 'hello', type = 'text/plain') =>
        new File([body], name, { type });

    it('reads supported files as data URLs', async () => {
        const asset = await readAsset(textFile());
        expect(asset).toEqual({
            name: 'note.txt',
            mime: 'text/plain',
            data: `data:text/plain;base64,${btoa('hello')}`,
        });
    });

    it('rejects empty, oversized and unsupported files', async () => {
        await expect(readAsset(textFile('empty.txt', ''))).rejects.toThrow('is empty');
        const big = textFile('big.txt');
        Object.defineProperty(big, 'size', { value: MAX_ASSET_BYTES + 1 });
        await expect(readAsset(big)).rejects.toThrow('Choose a file up to 5 MiB');
        const bigPhoto = textFile('big.png', 'x', 'image/png');
        Object.defineProperty(bigPhoto, 'size', { value: MAX_PHOTO_BYTES + 1 });
        await expect(readAsset(bigPhoto, true)).rejects.toThrow('Choose a photo up to 25 MiB');
        await expect(readAsset(textFile('a.txt'), true)).rejects.toThrow('PNG, JPEG or WebP');
        await expect(readAsset(textFile('a.zip', 'x', 'application/zip'))).rejects.toThrow(
            'Supported files',
        );
    });

    it('reports reader failures', async () => {
        class FailingReader {
            onerror: (() => void) | null = null;
            onload: (() => void) | null = null;
            result: unknown = null;
            readAsDataURL() {
                this.onerror?.();
            }
        }
        vi.stubGlobal('FileReader', FailingReader);
        await expect(readAsset(textFile())).rejects.toThrow('could not be read');
    });

    it('rejects non-string reader results', async () => {
        class OddReader {
            onerror: (() => void) | null = null;
            onload: (() => void) | null = null;
            result: unknown = new ArrayBuffer(1);
            readAsDataURL() {
                this.onload?.();
            }
        }
        vi.stubGlobal('FileReader', OddReader);
        await expect(readAsset(textFile())).rejects.toThrow('Invalid file');
    });

    describe('images', () => {
        const stubImage = (behaviour: 'load' | 'error' | 'huge') => {
            class FakeImage {
                naturalWidth = behaviour === 'huge' ? 10000 : 1;
                naturalHeight = behaviour === 'huge' ? 10000 : 1;
                onload: (() => void) | null = null;
                onerror: (() => void) | null = null;
                set src(_value: string) {
                    queueMicrotask(() => (behaviour === 'error' ? this.onerror : this.onload)?.());
                }
            }
            vi.stubGlobal('Image', FakeImage);
        };
        const png = () => textFile('pic.png', 'png-bytes', 'image/png');

        it('accepts decodable images', async () => {
            stubImage('load');
            expect((await readAsset(png(), true)).mime).toBe('image/png');
        });

        it('rejects undecodable and oversized images', async () => {
            stubImage('error');
            await expect(readAsset(png(), true)).rejects.toThrow('could not be decoded');
            stubImage('huge');
            await expect(readAsset(png(), true)).rejects.toThrow('40 megapixels');
        });
    });
});

describe('extractPhotoMetadata', () => {
    const empty = { capturedAt: '', timeZone: '', latitude: null, longitude: null };
    const ascii = (value: string) => [...value].map((char) => char.charCodeAt(0)).concat(0);

    interface Entry {
        tag: number;
        type: number;
        count: number;
        value: number;
    }

    /** Builds a little/big-endian TIFF block with IFD0, EXIF and GPS directories. */
    function tiff({
        little = true,
        magic = 42,
        root = [] as Entry[],
        exif,
        gps,
        blobs = [] as Array<{ at: number; bytes: number[] }>,
        size = 512,
    }: {
        little?: boolean;
        magic?: number;
        root?: Entry[];
        exif?: Entry[];
        gps?: Entry[];
        blobs?: Array<{ at: number; bytes: number[] }>;
        size?: number;
    }) {
        const buffer = new ArrayBuffer(size);
        const view = new DataView(buffer);
        view.setUint16(0, little ? 0x4949 : 0x4d4d);
        view.setUint16(2, magic, little);
        view.setUint32(4, 8, little);
        const writeDirectory = (at: number, entries: Entry[]) => {
            view.setUint16(at, entries.length, little);
            entries.forEach((entry, index) => {
                const base = at + 2 + index * 12;
                view.setUint16(base, entry.tag, little);
                view.setUint16(base + 2, entry.type, little);
                view.setUint32(base + 4, entry.count, little);
                view.setUint32(base + 8, entry.value, little);
            });
        };
        writeDirectory(8, root);
        if (exif) writeDirectory(100, exif);
        if (gps) writeDirectory(200, gps);
        for (const blob of blobs) blob.bytes.forEach((byte, i) => view.setUint8(blob.at + i, byte));
        return buffer;
    }

    /** Wraps a TIFF block in a JPEG with an APP1 Exif segment. */
    function jpeg(tiffBytes: ArrayBuffer, { exifHeader = 0x45786966, padding = 0 } = {}) {
        const payload = new Uint8Array(tiffBytes);
        const length = payload.length + 8;
        const out = new Uint8Array(2 + 2 + 2 + 4 + 2 + payload.length);
        const view = new DataView(out.buffer);
        view.setUint16(0, 0xffd8);
        view.setUint16(2, 0xffe1);
        view.setUint16(4, length);
        view.setUint32(6, exifHeader);
        view.setUint16(10, padding);
        out.set(payload, 12);
        return out.buffer;
    }

    const rational = (at: number, parts: Array<[number, number]>) =>
        parts.flatMap(([n, d], i) => {
            const bytes = new Uint8Array(8);
            const view = new DataView(bytes.buffer);
            view.setUint32(0, n, true);
            view.setUint32(4, d, true);
            return Array.from(bytes).map((byte, j) => ({ at: at + i * 8 + j, byte }));
        });
    const blobsFrom = (items: Array<{ at: number; byte: number }>) =>
        items.map(({ at, byte }) => ({ at, bytes: [byte] }));

    it('returns empty metadata for non-JPEG or truncated data', () => {
        expect(extractPhotoMetadata(new ArrayBuffer(0))).toEqual(empty);
        expect(extractPhotoMetadata(new Uint8Array([0, 1, 2, 3]).buffer)).toEqual(empty);
    });

    it('stops at scan data, end of image, invalid lengths and non-Exif segments', () => {
        const sos = new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0, 4, 0, 0, 0, 0]);
        expect(extractPhotoMetadata(sos.buffer)).toEqual(empty);
        const eoi = new Uint8Array([0xff, 0xd8, 0xff, 0xd9, 0, 4, 0, 0, 0, 0]);
        expect(extractPhotoMetadata(eoi.buffer)).toEqual(empty);
        const short = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 1, 0, 0, 0, 0]);
        expect(extractPhotoMetadata(short.buffer)).toEqual(empty);
        const overrun = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0xff, 0xff, 0, 0, 0, 0]);
        expect(extractPhotoMetadata(overrun.buffer)).toEqual(empty);
        const app0 = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xd9, 0, 0]);
        expect(extractPhotoMetadata(app0.buffer)).toEqual(empty);
    });

    it('ignores APP1 segments that are not Exif', () => {
        expect(extractPhotoMetadata(jpeg(tiff({}), { exifHeader: 0x41424344 }))).toEqual(empty);
        expect(extractPhotoMetadata(jpeg(tiff({}), { padding: 1 }))).toEqual(empty);
    });

    it('rejects TIFF blocks with unknown byte order or magic number', () => {
        const bad = tiff({});
        new DataView(bad).setUint16(0, 0x1234);
        expect(extractPhotoMetadata(jpeg(bad))).toEqual(empty);
        expect(extractPhotoMetadata(jpeg(tiff({ magic: 41 })))).toEqual(empty);
    });

    it('treats oversized directories as malformed', () => {
        const buffer = tiff({});
        new DataView(buffer).setUint16(8, 300, true);
        expect(extractPhotoMetadata(jpeg(buffer))).toEqual(empty);
    });

    it('reads capture time, time zone and GPS coordinates', () => {
        const blobs = [
            { at: 300, bytes: ascii('2024:05:06 07:08:09') },
            { at: 330, bytes: [...'+02:00'].map((char) => char.charCodeAt(0)) },
            ...blobsFrom(
                rational(360, [
                    [51, 1],
                    [30, 1],
                    [0, 1],
                ]),
            ),
            ...blobsFrom(
                rational(400, [
                    [0, 1],
                    [7, 1],
                    [30, 1],
                ]),
            ),
        ];
        const buffer = tiff({
            root: [
                { tag: 0x8769, type: 4, count: 1, value: 100 },
                { tag: 0x8825, type: 4, count: 1, value: 200 },
            ],
            exif: [
                { tag: 0x9003, type: 2, count: 20, value: 300 },
                { tag: 0x9011, type: 2, count: 6, value: 330 },
            ],
            gps: [
                { tag: 1, type: 2, count: 2, value: 0x4e },
                { tag: 2, type: 5, count: 3, value: 360 },
                { tag: 3, type: 2, count: 2, value: 0x57 },
                { tag: 4, type: 5, count: 3, value: 400 },
            ],
            blobs,
        });
        const metadata = extractPhotoMetadata(jpeg(buffer));
        expect(metadata.capturedAt).toBe('2024-05-06T07:08:09');
        expect(metadata.timeZone).toBe('+02:00');
        expect(metadata.latitude).toBeCloseTo(51.5);
        expect(metadata.longitude).toBeCloseTo(-0.125);
    });

    it('reads EXIF dates without a GPS directory', () => {
        const buffer = tiff({
            root: [{ tag: 0x8769, type: 4, count: 1, value: 100 }],
            exif: [{ tag: 0x9003, type: 2, count: 20, value: 300 }],
            blobs: [{ at: 300, bytes: ascii('2024:05:06 07:08:09') }],
        });
        expect(extractPhotoMetadata(jpeg(buffer))).toEqual({
            ...empty,
            capturedAt: '2024-05-06T07:08:09',
        });
    });

    it('reads big-endian blocks and falls back to the IFD0 date with southern/eastern refs', () => {
        const date = ascii('2020:01:02 03:04:05');
        const little = false;
        const buffer = tiff({ little });
        const view = new DataView(buffer);
        const writeEntry = (
            at: number,
            tag: number,
            type: number,
            count: number,
            value: number,
        ) => {
            view.setUint16(at, tag, little);
            view.setUint16(at + 2, type, little);
            view.setUint32(at + 4, count, little);
            view.setUint32(at + 8, value, little);
        };
        view.setUint16(8, 2, little);
        writeEntry(10, 0x132, 2, date.length, 300);
        writeEntry(22, 0x8825, 4, 1, 200);
        date.forEach((byte, i) => view.setUint8(300 + i, byte));
        view.setUint16(200, 4, little);
        writeEntry(202, 1, 2, 2, 0x53000000);
        writeEntry(214, 2, 5, 3, 360);
        writeEntry(226, 3, 2, 2, 0x45000000);
        writeEntry(238, 4, 5, 3, 400);
        const put = (at: number, n: number, d: number) => {
            view.setUint32(at, n, little);
            view.setUint32(at + 4, d, little);
        };
        [
            [10, 1],
            [0, 1],
            [0, 1],
        ].forEach(([n, d], i) => put(360 + i * 8, n!, d!));
        [
            [20, 1],
            [30, 1],
            [36, 1],
        ].forEach(([n, d], i) => put(400 + i * 8, n!, d!));
        const metadata = extractPhotoMetadata(jpeg(buffer));
        expect(metadata.capturedAt).toBe('2020-01-02T03:04:05');
        expect(metadata.latitude).toBeCloseTo(-10);
        expect(metadata.longitude).toBeCloseTo(20.51);
    });

    it('ignores valid coordinates whose hemisphere reference is not recognised', () => {
        const buffer = tiff({
            root: [{ tag: 0x8825, type: 4, count: 1, value: 200 }],
            gps: [
                { tag: 1, type: 2, count: 2, value: 0x58 },
                { tag: 2, type: 5, count: 3, value: 360 },
                { tag: 3, type: 2, count: 2, value: 0x58 },
                { tag: 4, type: 5, count: 3, value: 400 },
            ],
            blobs: [
                ...blobsFrom(
                    rational(360, [
                        [1, 1],
                        [0, 1],
                        [0, 1],
                    ]),
                ),
                ...blobsFrom(
                    rational(400, [
                        [2, 1],
                        [0, 1],
                        [0, 1],
                    ]),
                ),
            ],
        });
        expect(extractPhotoMetadata(jpeg(buffer))).toEqual(empty);
    });

    it('ignores malformed ASCII, coordinate and reference values', () => {
        const blobs = [
            { at: 300, bytes: ascii('not a date at all!!') },
            ...blobsFrom(
                rational(360, [
                    [1, 0],
                    [0, 1],
                    [0, 1],
                ]),
            ),
            ...blobsFrom(
                rational(400, [
                    [0, 1],
                    [60, 1],
                    [0, 1],
                ]),
            ),
        ];
        const buffer = tiff({
            root: [
                { tag: 0x8769, type: 4, count: 1, value: 100 },
                { tag: 0x8825, type: 4, count: 1, value: 200 },
            ],
            exif: [
                { tag: 0x9003, type: 3, count: 20, value: 300 },
                { tag: 0x9011, type: 2, count: 500, value: 330 },
            ],
            gps: [
                { tag: 1, type: 2, count: 2, value: 0x4e },
                { tag: 2, type: 5, count: 3, value: 360 },
                { tag: 3, type: 2, count: 2, value: 0x58 },
                { tag: 4, type: 5, count: 3, value: 400 },
            ],
            blobs,
        });
        expect(extractPhotoMetadata(jpeg(buffer))).toEqual(empty);
    });

    it('ignores ASCII values that are empty, out of bounds or the wrong coordinate type', () => {
        const buffer = tiff({
            root: [
                { tag: 0x8769, type: 4, count: 1, value: 100 },
                { tag: 0x8825, type: 4, count: 1, value: 200 },
                { tag: 0x132, type: 2, count: 0, value: 0 },
            ],
            exif: [
                { tag: 0x9003, type: 2, count: 50, value: 100000 },
                { tag: 0x9011, type: 2, count: 3, value: 0 },
            ],
            gps: [
                { tag: 2, type: 3, count: 3, value: 0 },
                { tag: 4, type: 5, count: 2, value: 0 },
            ],
        });
        expect(extractPhotoMetadata(jpeg(buffer))).toEqual(empty);
    });

    it('rejects negative and out-of-range sexagesimal parts', () => {
        const buffer = (parts: Array<[number, number]>) =>
            tiff({
                root: [{ tag: 0x8825, type: 4, count: 1, value: 200 }],
                gps: [
                    { tag: 1, type: 2, count: 2, value: 0x4e },
                    { tag: 2, type: 5, count: 3, value: 360 },
                ],
                blobs: blobsFrom(rational(360, parts)),
            });
        for (const parts of [
            [
                [1, 1],
                [60, 1],
                [0, 1],
            ],
            [
                [1, 1],
                [0, 1],
                [60, 1],
            ],
        ] as Array<Array<[number, number]>>) {
            expect(extractPhotoMetadata(jpeg(buffer(parts))).latitude).toBeNull();
        }
    });
});
