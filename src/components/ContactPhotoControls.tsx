import { useId, useRef, type ReactNode } from 'react';
import { CapabilityButton, type SimulatorCapability } from '../contract/capabilities.js';
import { useSimulatorLocale } from '../i18n/SimulatorLocale.js';

export interface ContactPhotoControlsProps {
    /** Optional visual icons; localized accessible names remain on each action. */
    actionIcons?: Partial<Record<'change' | 'remove' | 'restore', ReactNode>>;
    currentImage?: ReactNode;
    selectedImageUrl?: string;
    fallback?: ReactNode;
    accept?: string;
    onSelect: (file: File) => void;
    onRemove: () => void;
    onRestore: () => void;
    capability: SimulatorCapability;
    restoreCapability?: SimulatorCapability;
    error?: string;
    status?: string;
}
/** Preview and actions only. The host owns validation, object URLs and persistence. */
export function ContactPhotoControls({
    actionIcons,
    currentImage,
    selectedImageUrl,
    fallback,
    accept = 'image/*',
    onSelect,
    onRemove,
    onRestore,
    capability,
    restoreCapability = capability,
    error,
    status,
}: Readonly<ContactPhotoControlsProps>) {
    const { t } = useSimulatorLocale();
    const input = useRef<HTMLInputElement>(null);
    const titleId = useId();
    return (
        <section className="simulator-contact-photo" aria-labelledby={titleId}>
            <span id={titleId}>{t('contact.photo')}</span>
            <div className="contact-identity-fields">
                <div className="contact-current-image">
                    {selectedImageUrl ? (
                        <img src={selectedImageUrl} alt={t('contact.selectedPhoto')} />
                    ) : (
                        (currentImage ??
                        fallback ?? (
                            <span role="img" aria-label={t('contact.noPhoto')}>
                                ◯
                            </span>
                        ))
                    )}
                </div>
                <div className="simulator-contact-photo-actions">
                    <input
                        ref={input}
                        type="file"
                        hidden
                        disabled={capability.state !== 'enabled'}
                        accept={accept}
                        aria-label={t('contact.changePhoto')}
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = '';
                            if (file && capability.state === 'enabled') onSelect(file);
                        }}
                    />
                    <CapabilityButton
                        type="button"
                        capability={capability}
                        aria-label={t('contact.changePhoto')}
                        title={t('contact.changePhoto')}
                        onClick={() => input.current?.click()}
                    >
                        {actionIcons?.change ?? <PhotoActionIcon action="change" />}
                    </CapabilityButton>
                    <CapabilityButton type="button" capability={capability} aria-label={t('contact.removePhoto')} title={t('contact.removePhoto')} onClick={onRemove}>
                        {actionIcons?.remove ?? <PhotoActionIcon action="remove" />}
                    </CapabilityButton>
                    <CapabilityButton
                        type="button"
                        capability={restoreCapability}
                        aria-label={t('contact.restorePhoto')}
                        title={t('contact.restorePhoto')}
                        onClick={onRestore}
                    >
                        {actionIcons?.restore ?? <PhotoActionIcon action="restore" />}
                    </CapabilityButton>
                </div>
            </div>
            {error && <p role="alert">{error}</p>}
            {status && <p><output>{status}</output></p>}
        </section>
    );
}


function PhotoActionIcon({ action }: Readonly<{ action: 'change' | 'remove' | 'restore' }>) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {action === 'restore' ? (
                <><path d="M3 11a9 9 0 1 1 2.7 7" /><path d="M3 3v8h8" /></>
            ) : (
                <><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21M17 5h6" />{action === 'change' && <path d="M20 2v6" />}</>
            )}
        </svg>
    );
}
