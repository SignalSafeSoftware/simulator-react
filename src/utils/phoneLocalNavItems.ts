import { createTranslator, simulatorEnglish } from '../i18n/catalog.js';
/**
 * Phone app secondary nav items per wireframe: History, Contacts, Dial, Back.
 * Back returns to primary menu; Directory is not in the strip (can be reached from Contacts if needed).
 */
import type { PhoneScreenId } from '../types/session.js';
import type { SimulatorCapabilities } from './simulatorCapabilities.js';

export interface PhoneLocalNavItem {
    id: PhoneScreenId | 'back';
    label: string;
    icon: string;
}

/** Secondary strip order per wireframe: History, Contacts, Dial, Back. */
const SECONDARY_STRIP = [
    { id: 'history', labelKey: 'nav.history', icon: '🕐' },
    { id: 'contacts', labelKey: 'nav.contacts', icon: '👤' },
    { id: 'dial', labelKey: 'nav.dial', icon: '📞' },
    { id: 'back', labelKey: 'nav.back', icon: '↩' },
] as const;

export function getPhoneLocalNavItems(_phone: SimulatorCapabilities['phone'], locale = createTranslator(simulatorEnglish)): PhoneLocalNavItem[] {
    return SECONDARY_STRIP.map(({ labelKey, ...item }) => ({ ...item, label: locale.t(labelKey) }));
}
