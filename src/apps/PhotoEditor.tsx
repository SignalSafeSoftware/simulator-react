import type { Photo } from '@signalsafe/simulator-core';
import { useSimulatorAppsHost } from './host.js';

export default function PhotoEditor({
    photo,
    disabled,
    onChange,
    onReplace,
}: {
    photo: Photo;
    disabled: boolean;
    onChange: (photo: Photo) => void;
    onReplace: (file: File) => void;
}) {
    const { formatCaptureDate: captureDateLabel } = useSimulatorAppsHost();
    return (
        <fieldset disabled={disabled} className="prototype-page">
            <legend>Edit photo</legend>
            <label>
                Title
                <input
                    className="simulator-input"
                    value={photo.title}
                    maxLength={200}
                    onChange={(event) => onChange({ ...photo, title: event.target.value })}
                />
            </label>
            <label>
                Caption
                <textarea
                    className="simulator-input"
                    value={photo.caption}
                    maxLength={10000}
                    onChange={(event) => onChange({ ...photo, caption: event.target.value })}
                />
            </label>
            <label>
                Capture date and time
                <input
                    className="simulator-input"
                    type="datetime-local"
                    step="1"
                    value={photo.metadata.capturedAt}
                    onChange={(event) =>
                        onChange({
                            ...photo,
                            metadata: { ...photo.metadata, capturedAt: event.target.value },
                        })
                    }
                />
            </label>
            <label>
                Capture time zone or UTC offset (blank if unknown)
                <input
                    className="simulator-input"
                    value={photo.metadata.timeZone}
                    maxLength={100}
                    placeholder="America/Denver or -06:00"
                    onChange={(event) =>
                        onChange({
                            ...photo,
                            metadata: { ...photo.metadata, timeZone: event.target.value },
                        })
                    }
                />
            </label>
            {(['latitude', 'longitude'] as const).map((coordinate) => (
                <label key={coordinate}>
                    {coordinate === 'latitude' ? 'Latitude' : 'Longitude'}
                    <input
                        className="simulator-input"
                        type="number"
                        step="any"
                        min={coordinate === 'latitude' ? -90 : -180}
                        max={coordinate === 'latitude' ? 90 : 180}
                        value={photo.metadata[coordinate] ?? ''}
                        onChange={(event) =>
                            onChange({
                                ...photo,
                                metadata: {
                                    ...photo.metadata,
                                    [coordinate]:
                                        event.target.value === ''
                                            ? null
                                            : Number(event.target.value),
                                },
                            })
                        }
                    />
                </label>
            ))}
            <label>
                Replace image
                <input
                    className="simulator-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) onReplace(file);
                        event.target.value = '';
                    }}
                />
            </label>
            <section aria-label="Original image metadata">
                <h3>Original image metadata</h3>
                <p>{captureDateLabel(photo.original)}</p>
                <p>
                    Latitude: {photo.original.latitude ?? 'Unknown'}; Longitude:{' '}
                    {photo.original.longitude ?? 'Unknown'}
                </p>
                <p>Edits do not change metadata embedded in the image file.</p>
            </section>
        </fieldset>
    );
}
