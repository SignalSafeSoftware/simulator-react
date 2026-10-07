import type { ReactNode } from 'react';
import type { SimulatorContactValue } from '@signalsafe/simulator-core/devicePayload';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { usePhoneNumberFormatter } from '../../contract/phonePresentation.js';
import { SimulatorPage } from '../../ui/layout/SimulatorPage.js';
import { SimulatorAvatar } from '../../ui/media/SimulatorAvatar.js';
import { SimulatorButton } from '../../ui/primitives.js';
import {
    SIM_PHONE_CONTACT_DETAIL,
    SIM_PHONE_CONTACT_DETAIL_HEADER,
    SIM_PHONE_CONTACT_DETAIL_TITLE,
} from '../../ui/styles/semanticSimulatorClasses.js';
import {
    SIM_BTN_SCREEN_BACK,
    SimulatorButtonTone,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';
import type { SimulatorSessionContact } from '../../types/session.js';

export interface ContactDetailPanelProps {
    contact: SimulatorSessionContact;
    onBack: () => void;
    /** Omit the header Back button when the surrounding device supplies navigation. */
    titleOnly?: boolean;
    footer?: ReactNode;
    /** Availability or validation messages supplied by the owning host. */
    notice?: ReactNode;
    /** Host-owned image retrieval; the shared avatar is used when no image is supplied. */
    identityImage?: ReactNode;
    /** Host capabilities and callbacks, such as edit, call, delete or blocking. */
    actions?: ReactNode;
    renderPhoneAction?: (
        phone: SimulatorContactValue,
        contact: SimulatorSessionContact,
    ) => ReactNode;
    /** Additive host metadata, such as company or imported-record information. */
    additionalDetails?: ReactNode;
    /** Disable only when the host metadata slot renders these same postal addresses. */
    showPostalAddresses?: boolean;
}

function ContactDetailValues({
    title,
    values,
    formatValue,
    renderAction,
    preserveLines = false,
}: Readonly<{
    title: string;
    values: readonly SimulatorContactValue[];
    formatValue?: (value: string) => string;
    renderAction?: (value: SimulatorContactValue) => ReactNode;
    preserveLines?: boolean;
}>) {
    const { t } = useSimulatorLocale();
    if (!values.length) return null;
    return (
        <section className='contact-detail-list' aria-label={title}>
            <h3>{title}</h3>
            <ul>
                {values.map((value, index) => (
                    <li key={index}>
                        <strong>{value.label || t('contact.unlabeled')}</strong>
                        <div className='contact-detail-list__value'>
                            <span
                                className={
                                    preserveLines ? 'contact-detail-list__postal-value' : undefined
                                }
                            >
                                {formatValue ? formatValue(value.value) : value.value}
                            </span>
                            {renderAction?.(value)}
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}

/** Shared read-only contact screen; hosts provide data and capabilities through slots. */
export function ContactDetailPanel({
    contact,
    onBack,
    titleOnly = false,
    footer,
    notice,
    identityImage,
    actions,
    renderPhoneAction,
    additionalDetails,
    showPostalAddresses = true,
}: Readonly<ContactDetailPanelProps>) {
    const { t } = useSimulatorLocale();
    const formatNumber = usePhoneNumberFormatter();
    const hasFooter = footer != null && footer !== false;
    const phones = contact.phoneNumbers?.length
        ? contact.phoneNumbers
        : contact.number
          ? [{ label: '', value: contact.number, number: contact.number }]
          : [];
    const emails = contact.emailAddresses?.length
        ? contact.emailAddresses
        : contact.email
          ? [{ label: '', value: contact.email }]
          : [];
    return (
        <SimulatorPage
            className={joinClasses(
                'simulator-app-page',
                SIM_PHONE_CONTACT_DETAIL,
                'simulator-contact-detail',
                hasFooter && 'simulator-contact-detail--local-nav',
            )}
            data-testid='simulator-phone-contact-detail'
            header={
                <div
                    className={joinClasses(
                        SIM_PHONE_CONTACT_DETAIL_HEADER,
                        'simulator-contact-detail__header',
                    )}
                >
                    {!titleOnly && (
                        <SimulatorButton
                            tone={SimulatorButtonTone.Link}
                            className={joinClasses('simulator-btn--plain', SIM_BTN_SCREEN_BACK)}
                            onClick={onBack}
                            aria-label={t('a11y.back.to.list')}
                        >
                            {t('screen.simulatorDetail.back')}
                        </SimulatorButton>
                    )}
                    <span tabIndex={-1} className={SIM_PHONE_CONTACT_DETAIL_TITLE}>
                        {t('screen.contactsView.contact')}
                    </span>
                </div>
            }
            footer={
                hasFooter ? (
                    <div className='simulator-contact-detail__footer'>{footer}</div>
                ) : undefined
            }
        >
            <div className='simulator-contact-detail__content'>
                {notice}
                <article className='contact-detail-card' aria-label={contact.displayName}>
                    <header className='contact-detail-card__photo'>
                        {identityImage ?? <SimulatorAvatar />}
                    </header>
                    <div className='contact-detail-card__body'>
                        <h2>{contact.displayName}</h2>
                        {actions != null && (
                            <div className='contact-detail-card__actions'>{actions}</div>
                        )}
                    </div>
                </article>
                <div className='contact-detail-groups'>
                    <ContactDetailValues
                        title={t('contact.phones')}
                        values={phones}
                        formatValue={formatNumber}
                        renderAction={
                            renderPhoneAction
                                ? (phone) => renderPhoneAction(phone, contact)
                                : undefined
                        }
                    />
                    <ContactDetailValues title={t('contact.emails')} values={emails} />
                    {showPostalAddresses && (
                        <ContactDetailValues
                            title={t('contact.addresses')}
                            values={contact.postalAddresses ?? []}
                            preserveLines
                        />
                    )}
                    {additionalDetails}
                </div>
            </div>
        </SimulatorPage>
    );
}
