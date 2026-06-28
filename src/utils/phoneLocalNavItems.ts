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
const SECONDARY_STRIP: PhoneLocalNavItem[] = [
    { id: 'history', label: 'History', icon: '🕐' },
    { id: 'contacts', label: 'Contacts', icon: '👤' },
    { id: 'dial', label: 'Dial', icon: '📞' },
    { id: 'back', label: 'Back', icon: '↩' },
];

export function getPhoneLocalNavItems(_phone: SimulatorCapabilities['phone']): PhoneLocalNavItem[] {
    return SECONDARY_STRIP;
}
