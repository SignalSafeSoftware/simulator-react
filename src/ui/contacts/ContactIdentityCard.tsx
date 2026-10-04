import type { ReactNode } from 'react';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';

/** Shared identity card: photo header followed by host-owned identity fields. */
export function ContactIdentityCard({
    image,
    children,
}: Readonly<{ image?: ReactNode; children: ReactNode }>) {
    const { t } = useSimulatorLocale();
    return (
        <section
            className="contact-identity-panel contact-identity-card"
            aria-label={t('contact.identity')}
        >
            {image != null && <header className="contact-identity-card__header">{image}</header>}
            <div className="contact-identity-card__body">{children}</div>
        </section>
    );
}
