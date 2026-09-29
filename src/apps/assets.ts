import {
    assetSchema,
    photoAssetSchema,
    MAX_ASSET_BYTES,
    MAX_PHOTO_BYTES,
    type Asset,
} from '@signalsafe/simulator-core';
export async function readAsset(file: File, imageOnly = false): Promise<Asset> {
    const limit = imageOnly ? MAX_PHOTO_BYTES : MAX_ASSET_BYTES;
    if (!file.size) throw new Error(`“${file.name}” is empty. Choose a file containing data.`);
    if (file.size > limit)
        throw new Error(
            `“${file.name}” is ${(file.size / (1024 * 1024)).toFixed(1)} MiB. Choose ${imageOnly ? 'a photo' : 'a file'} up to ${limit / (1024 * 1024)} MiB.`,
        );
    if (imageOnly && !['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
        throw new Error('Choose a PNG, JPEG or WebP image.');
    const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('The file could not be read.'));
        reader.onload = () =>
            typeof reader.result === 'string'
                ? resolve(reader.result)
                : reject(new Error('Invalid file.'));
        reader.readAsDataURL(file);
    });
    const parsed = (imageOnly ? photoAssetSchema : assetSchema).safeParse({
        name: file.name,
        mime: file.type,
        data,
    });
    if (!parsed.success) throw new Error('Supported files: PNG, JPEG, WebP, plain text and PDF.');
    if (imageOnly) {
        await new Promise<void>((resolve, reject) => {
            const image = new Image();
            image.onerror = () => reject(new Error('The image could not be decoded.'));
            image.onload = () =>
                image.naturalWidth * image.naturalHeight > 40000000
                    ? reject(new Error('Choose an image below 40 megapixels.'))
                    : resolve();
            image.src = data;
        });
    }
    return parsed.data;
}
