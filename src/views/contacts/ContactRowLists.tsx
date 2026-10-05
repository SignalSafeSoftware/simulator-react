import {
    SIM_FLEX_COL,
    SIM_FLEX_GROW_1,
    SIM_LIST_FLUSH_MOD,
    SIM_MIN_W_0,
    SIM_MUTED,
    SIM_SURFACE_WHITE,
    SIM_TEXT_MEDIUM,
    SIM_TEXT_SM,
    SIM_TEXT_TRUNCATE,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';
import { SimulatorAvatar } from '../../ui/media/SimulatorAvatar.js';
import { PhoneNumberText } from '../../ui/contacts/PhoneNumberText.js';
import { SimulatorList, SimulatorListItem } from '../../ui/lists/SimulatorList.js';
import { simRowSurface, simTypo } from '../../simulatorStyles.js';
import {
    SIM_PHONE_CONTACT_LIST,
    SIM_PHONE_CONTACT_ROW,
    SIM_PHONE_CONTACT_ROW_AVATAR,
    SIM_PHONE_CONTACT_ROW_MAIN,
    SIM_PHONE_CONTACT_ROW_NAME,
    SIM_PHONE_CONTACT_ROW_NUMBER,
} from '../../ui/styles/semanticSimulatorClasses.js';
import type { SimulatorSessionContact } from '../../types/session.js';

function primaryNumber(contact: SimulatorSessionContact): string {
    return contact.number || contact.phoneNumbers?.[0]?.value || '';
}

export function renderPhoneContactList(
    filtered: SimulatorSessionContact[],
    open: (contact: SimulatorSessionContact) => void,
): JSX.Element {
    return (
        <div className={joinClasses(SIM_LIST_FLUSH_MOD, SIM_PHONE_CONTACT_LIST)}>
            {filtered.map((c) => (
                <button
                    type='button'
                    key={c.id}
                    data-simulator-contact-id={c.id}
                    onClick={() => open(c)}
                    className={joinClasses(
                        simRowSurface.selectable,
                        'simulator-border--top-none',
                        SIM_SURFACE_WHITE,
                        SIM_PHONE_CONTACT_ROW,
                    )}
                >
                    <SimulatorAvatar className={SIM_PHONE_CONTACT_ROW_AVATAR} />
                    <div
                        className={joinClasses(
                            SIM_PHONE_CONTACT_ROW_MAIN,
                            SIM_FLEX_COL,
                            SIM_MIN_W_0,
                            SIM_FLEX_GROW_1,
                        )}
                    >
                        <span
                            className={joinClasses(
                                SIM_PHONE_CONTACT_ROW_NAME,
                                SIM_TEXT_MEDIUM,
                                SIM_TEXT_TRUNCATE,
                            )}
                        >
                            {c.displayName}
                        </span>
                        {primaryNumber(c) && (
                            <span
                                className={joinClasses(
                                    SIM_PHONE_CONTACT_ROW_NUMBER,
                                    SIM_TEXT_SM,
                                    SIM_MUTED,
                                    SIM_TEXT_TRUNCATE,
                                )}
                            >
                                <PhoneNumberText value={primaryNumber(c)} />
                            </span>
                        )}
                        {c.email && !c.number && (
                            <span
                                className={joinClasses(
                                    SIM_PHONE_CONTACT_ROW_NUMBER,
                                    SIM_TEXT_SM,
                                    SIM_MUTED,
                                    SIM_TEXT_TRUNCATE,
                                )}
                            >
                                {c.email}
                            </span>
                        )}
                    </div>
                </button>
            ))}
        </div>
    );
}

export function renderCompactContactList(
    filtered: SimulatorSessionContact[],
    open: (contact: SimulatorSessionContact) => void,
): JSX.Element {
    return (
        <SimulatorList>
            {filtered.map((c) => (
                <SimulatorListItem
                    key={c.id}
                    data-simulator-contact-id={c.id}
                    variant='compact'
                    onClick={() => open(c)}
                    className={joinClasses('simulator-flex--between', SIM_PHONE_CONTACT_ROW)}
                >
                    <div
                        className={joinClasses(
                            SIM_PHONE_CONTACT_ROW_MAIN,
                            SIM_FLEX_GROW_1,
                            SIM_MIN_W_0,
                            'simulator-flex--between',
                            'simulator-flex--align-center',
                        )}
                    >
                        <span className={joinClasses(SIM_PHONE_CONTACT_ROW_NAME, SIM_TEXT_MEDIUM)}>
                            {c.displayName}
                        </span>
                        {primaryNumber(c) && (
                            <span
                                className={joinClasses(
                                    SIM_PHONE_CONTACT_ROW_NUMBER,
                                    simTypo.secondary,
                                )}
                            >
                                <PhoneNumberText value={primaryNumber(c)} />
                            </span>
                        )}
                    </div>
                </SimulatorListItem>
            ))}
        </SimulatorList>
    );
}
