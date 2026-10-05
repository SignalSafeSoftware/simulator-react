/**
 * Phone app secondary nav items per wireframe: History, Contacts, Dial, Back.
 * Back returns to primary menu; Directory is not in the strip (can be reached from Contacts if needed).
 */
import { SimulatorPhoneScreenId } from '@signalsafe/simulator-core/devicePayload';
import { NAV_BACK_ID } from '../../constants.js';
import { createTranslator, simulatorEnglish } from '../../i18n/catalog.js';
import type { PhoneScreenId } from '../../types/session.js';
import type { SimulatorCapabilities } from '../payload/simulatorCapabilities.js';

export interface PhoneLocalNavItem {
    id: PhoneScreenId | typeof NAV_BACK_ID;
    label: string;
    icon: string;
}

/** Secondary strip order per wireframe: History, Contacts, Dial, Back. */
const SECONDARY_STRIP = [
    { id: SimulatorPhoneScreenId.History, labelKey: 'nav.history', icon: '🕐' },
    { id: SimulatorPhoneScreenId.Contacts, labelKey: 'nav.contacts', icon: '👤' },
    { id: SimulatorPhoneScreenId.Dial, labelKey: 'nav.dial', icon: '📞' },
    { id: NAV_BACK_ID, labelKey: 'nav.back', icon: '↩' },
] as const;

export function getPhoneLocalNavItems(
    _phone: SimulatorCapabilities['phone'],
    locale = createTranslator(simulatorEnglish),
): PhoneLocalNavItem[] {
    return getPhoneSecondaryItems(locale);
}

export function getPhoneSecondaryItems(
    locale = createTranslator(simulatorEnglish),
): PhoneLocalNavItem[] {
    return SECONDARY_STRIP.map(({ labelKey, ...item }) => ({ ...item, label: locale.t(labelKey) }));
}
