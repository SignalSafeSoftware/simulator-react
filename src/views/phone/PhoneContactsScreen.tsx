import { UserRound } from 'lucide-react';
import {
    SIM_AVATAR,
    SIM_BTN_SM,
    SIM_FLEX_CENTER,
    SIM_FLEX_COL,
    SIM_FLEX_GROW_1,
    SIM_FLEX_SHRINK_0,
    SIM_LIST_FLUSH_MOD,
    SIM_MIN_W_0,
    SIM_MUTED,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_AVATAR,
    SIM_TEXT_CENTER,
    SIM_TEXT_MEDIUM,
    SIM_TEXT_SM,
    SimulatorButtonTone,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';
import {
    SIM_PHONE_CONTACT_LIST,
    SIM_PHONE_CONTACT_ROW,
    SIM_PHONE_CONTACT_ROW_AVATAR,
    SIM_PHONE_CONTACT_ROW_MAIN,
    SIM_PHONE_CONTACT_ROW_NAME,
    SIM_PHONE_CONTACT_ROW_NUMBER,
    SIM_SCREEN_HEADER_ROW,
} from '../../ui/styles/semanticSimulatorClasses.js';
import { SimulatorPhoneScreenId } from '@signalsafe/simulator-core/devicePayload';
import { SimulatorActions } from '../../actions/simulatorActions.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { simLayout, simSpacing, simTypo } from '../../simulatorStyles.js';
import type {
    PhoneScreenId,
    SimulatorAction,
    SimulatorSessionContact,
} from '../../types/session.js';
import { SimulatorButton, SimulatorList, SimulatorListItem } from '../../ui/primitives.js';

/** Contacts tab of the phone app: header with Add, contact rows with Call. */
export function PhoneContactsScreen({
    contactList,
    onNavigate,
    onAction,
}: Readonly<{
    contactList: SimulatorSessionContact[];
    onNavigate: (screen: PhoneScreenId) => void;
    onAction: (action: SimulatorAction) => void;
}>) {
    const screenLocale = useSimulatorLocale();
    return (
        <>
            <div className={joinClasses(simLayout.headerRowBetween, SIM_SCREEN_HEADER_ROW)}>
                <span className={joinClasses(SIM_FLEX_GROW_1, SIM_TEXT_CENTER)}>
                    {screenLocale.t('screen.phoneSimulatorView.contacts')}
                </span>
                <SimulatorButton
                    tone={SimulatorButtonTone.PrimaryOutline}
                    className={joinClasses(
                        SIM_ROUNDED_NONE,
                        simSpacing.py1,
                        simSpacing.px2,
                        simSpacing.me2,
                        SIM_BTN_SM,
                    )}
                    onClick={() => onNavigate(SimulatorPhoneScreenId.AddContact)}
                    aria-label={screenLocale.t('screen.phoneSimulatorView.add.contact.a02ce0')}
                >
                    {screenLocale.t('screen.phoneSimulatorView.add')}
                </SimulatorButton>
            </div>
            <SimulatorList className={joinClasses(SIM_LIST_FLUSH_MOD, SIM_PHONE_CONTACT_LIST)}>
                {contactList.map((c) => (
                    <SimulatorListItem
                        key={c.id}
                        action
                        className={joinClasses(
                            simLayout.rowBetween,
                            simSpacing.py2,
                            SIM_TEXT_SM,
                            SIM_PHONE_CONTACT_ROW,
                        )}
                    >
                        <div
                            className={joinClasses(
                                SIM_PHONE_CONTACT_ROW_AVATAR,
                                SIM_AVATAR,
                                SIM_SURFACE_AVATAR,
                                SIM_FLEX_CENTER,
                                SIM_FLEX_SHRINK_0,
                            )}
                            style={{ width: 40, height: 40 }}
                            aria-hidden
                        >
                            <span
                                className="simulator-text--primary"
                                style={{ fontSize: '1.25rem' }}
                            >
                                <UserRound size={24} strokeWidth={1.5} aria-hidden="true" />
                            </span>
                        </div>
                        <div
                            className={joinClasses(
                                SIM_PHONE_CONTACT_ROW_MAIN,
                                SIM_FLEX_GROW_1,
                                SIM_MIN_W_0,
                                SIM_FLEX_COL,
                            )}
                        >
                            <span
                                className={joinClasses(SIM_PHONE_CONTACT_ROW_NAME, SIM_TEXT_MEDIUM)}
                            >
                                {c.displayName}
                            </span>
                            {c.number != null && c.number !== '' && (
                                <span
                                    className={joinClasses(
                                        SIM_PHONE_CONTACT_ROW_NUMBER,
                                        SIM_MUTED,
                                        SIM_TEXT_SM,
                                    )}
                                >
                                    {c.number}
                                </span>
                            )}
                        </div>
                        {c.number != null && (
                            <SimulatorButton
                                tone={SimulatorButtonTone.PrimaryOutline}
                                className={SIM_BTN_SM}
                                onClick={() => onAction(SimulatorActions.dialPhone(c.number))}
                            >
                                {screenLocale.t('screen.phoneSimulatorView.call')}
                            </SimulatorButton>
                        )}
                    </SimulatorListItem>
                ))}
            </SimulatorList>
            {contactList.length === 0 && (
                <p className={joinClasses(simTypo.emptyState, SIM_TEXT_CENTER, simSpacing.py3)}>
                    {screenLocale.t('screen.phoneSimulatorView.no.contacts')}
                </p>
            )}
        </>
    );
}
