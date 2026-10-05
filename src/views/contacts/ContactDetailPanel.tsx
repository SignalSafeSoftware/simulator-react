import type { ReactNode } from 'react';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { usePhoneNumberFormatter } from '../../contract/phonePresentation.js';
import { simLayout, simSpacing, simTypo } from '../../simulatorStyles.js';
import { SimulatorDetailBackBar, SimulatorDetailBlock } from '../../ui/layout/SimulatorDetail.js';
import { SIM_TEXT_SM, joinClasses } from '../../ui/styles/simulatorClasses.js';
import { SIM_PHONE_CONTACT_DETAIL } from '../../ui/styles/semanticSimulatorClasses.js';
import type { SimulatorSessionContact } from '../../types/session.js';

export interface ContactDetailPanelProps {
    contact: SimulatorSessionContact;
    onBack: () => void;
    titleOnly: boolean;
    footer: ReactNode;
}

/** Read-only detail screen for one contact, with the host-provided footer below it. */
export function ContactDetailPanel({
    contact,
    onBack,
    titleOnly,
    footer,
}: Readonly<ContactDetailPanelProps>) {
    const screenLocale = useSimulatorLocale();
    const formatNumber = usePhoneNumberFormatter();
    return (
        <div className={simLayout.screenColumn}>
            <div className={simLayout.scrollBody}>
                <SimulatorDetailBackBar
                    onBack={onBack}
                    title={screenLocale.t('screen.contactsView.contact')}
                    ariaLabel={screenLocale.t('a11y.back.to.list')}
                    titleOnly={titleOnly}
                />
                <SimulatorDetailBlock className={SIM_PHONE_CONTACT_DETAIL}>
                    <h3 className={simTypo.subheading}>{contact.displayName}</h3>
                    {contact.number != null && contact.number !== '' && (
                        <p className={joinClasses(simSpacing.mb1, SIM_TEXT_SM)}>
                            <span className={simTypo.secondary}>
                                {screenLocale.t('screen.contactsView.number')}
                            </span>{' '}
                            {formatNumber(contact.number)}
                        </p>
                    )}
                    {contact.email != null && contact.email !== '' && (
                        <p className={joinClasses(simSpacing.mb0, SIM_TEXT_SM)}>
                            <span className={simTypo.secondary}>
                                {screenLocale.t('screen.contactsView.email')}
                            </span>{' '}
                            {contact.email}
                        </p>
                    )}
                </SimulatorDetailBlock>
            </div>
            {footer}
        </div>
    );
}
