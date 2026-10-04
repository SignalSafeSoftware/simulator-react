import { emptyMetadata, photoMetadataSchema } from '@signalsafe/simulator-core/apps/contracts';
import type { PhotoMetadata } from '@signalsafe/simulator-core/apps/contracts';

/** Bounded JPEG EXIF reader. Unsupported formats/tags remain unknown. */
export function extractPhotoMetadata(buffer: ArrayBuffer): PhotoMetadata {
    const bytes = new DataView(buffer);
    try {
        if (bytes.getUint16(0) !== 0xffd8) return { ...emptyMetadata };
        let offset = 2;
        while (offset + 4 < bytes.byteLength) {
            const marker = bytes.getUint16(offset);
            if (marker === 0xffda || marker === 0xffd9) break;
            const length = bytes.getUint16(offset + 2);
            if (length < 2 || offset + 2 + length > bytes.byteLength) break;
            if (
                marker === 0xffe1 &&
                bytes.getUint32(offset + 4) === 0x45786966 &&
                bytes.getUint16(offset + 8) === 0
            ) {
                return readTiff(new DataView(buffer, offset + 10, length - 8));
            }
            offset += length + 2;
        }
    } catch {
        /* Malformed metadata does not prevent decoding an otherwise valid image. */
    }
    return { ...emptyMetadata };
}
function readTiff(view: DataView): PhotoMetadata {
    const little = view.getUint16(0) === 0x4949;
    if ((!little && view.getUint16(0) !== 0x4d4d) || view.getUint16(2, little) !== 42)
        return { ...emptyMetadata };
    const u16 = (offset: number) => view.getUint16(offset, little);
    const u32 = (offset: number) => view.getUint32(offset, little);
    function entries(offset: number) {
        const result = new Map<number, number>();
        const count = u16(offset);
        if (count > 256) throw new Error('EXIF directory limit');
        for (let index = 0; index < count; index++) {
            const entry = offset + 2 + index * 12;
            result.set(u16(entry), entry);
        }
        return result;
    }
    function ascii(entry: number | undefined): string {
        if (entry === undefined || u16(entry + 2) !== 2) return '';
        const count = u32(entry + 4);
        if (count > 100 || count < 1) return '';
        const offset = count <= 4 ? entry + 8 : u32(entry + 8);
        if (offset + count > view.byteLength) return '';
        return (
            new TextDecoder()
                .decode(new Uint8Array(view.buffer, view.byteOffset + offset, count))
                .split(String.fromCharCode(0))[0] ?? ''
        );
    }
    function coordinate(entry: number | undefined): number | null {
        if (entry === undefined || u16(entry + 2) !== 5 || u32(entry + 4) !== 3) return null;
        const offset = u32(entry + 8);
        const values = [0, 8, 16].map((shift) => u32(offset + shift) / u32(offset + shift + 4));
        const [degrees = NaN, minutes = NaN, seconds = NaN] = values;
        if (degrees < 0 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60)
            return null;
        const value = degrees + minutes / 60 + seconds / 3600;
        return Number.isFinite(value) ? value : null;
    }
    const root = entries(u32(4));
    const exifPointer = root.get(0x8769);
    const exif =
        exifPointer === undefined ? new Map<number, number>() : entries(u32(exifPointer + 8));
    const rawDate = ascii(exif.get(0x9003)) || ascii(root.get(0x132));
    const capturedAt = /^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/.test(rawDate)
        ? rawDate.replace(/^(\d{4}):(\d{2}):(\d{2}) /, '$1-$2-$3T')
        : '';
    const gpsPointer = root.get(0x8825);
    const gps = gpsPointer === undefined ? new Map<number, number>() : entries(u32(gpsPointer + 8));
    const latitude = coordinate(gps.get(2));
    const longitude = coordinate(gps.get(4));
    const fields = photoMetadataSchema.shape;
    return {
        capturedAt: fields.capturedAt.catch('').parse(capturedAt),
        timeZone: fields.timeZone.catch('').parse(ascii(exif.get(0x9011))),
        latitude: fields.latitude
            .catch(null)
            .parse(
                latitude === null || !['N', 'S'].includes(ascii(gps.get(1)))
                    ? null
                    : latitude * (ascii(gps.get(1)) === 'S' ? -1 : 1),
            ),
        longitude: fields.longitude
            .catch(null)
            .parse(
                longitude === null || !['E', 'W'].includes(ascii(gps.get(3)))
                    ? null
                    : longitude * (ascii(gps.get(3)) === 'W' ? -1 : 1),
            ),
    };
}
