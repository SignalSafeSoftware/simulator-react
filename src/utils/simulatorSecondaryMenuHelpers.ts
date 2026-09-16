import { createTranslator, simulatorEnglish } from '../i18n/catalog.js';
/**
 * Secondary menu helpers for phone and email shell navigation.
 */

import { DEFAULT_BROWSER_SUBMIT_TARGET } from '../constants.js';

const emailItems = [
    { id: 'list', labelKey: 'nav.inbox', icon: '📥' },
    { id: 'outbox', labelKey: 'nav.outbox', icon: '📤' },
    { id: 'trash', labelKey: 'nav.trash', icon: '🗑️' },
    { id: 'back', labelKey: 'nav.back', icon: '↩' },
] as const;

export function getEmailSecondaryItems(locale = createTranslator(simulatorEnglish)) {
    return emailItems.map(({ labelKey, ...item }) => ({ ...item, label: locale.t(labelKey) }));
}
export const EMAIL_SECONDARY_ITEMS = getEmailSecondaryItems();

export function getBrowserSubmitTargetId(submitTargetPageId: string | null | undefined): string {
    return submitTargetPageId == null || submitTargetPageId === '' ? DEFAULT_BROWSER_SUBMIT_TARGET : submitTargetPageId;
}

export function getPhoneSecondaryActiveId(screen: string): string {
    if (screen === 'add_contact' || screen === 'directory') {
        return 'contacts';
    }
    if (screen === 'incoming_call' || screen === 'voicemail') {
        return 'history';
    }
    return screen;
}

export function getEmailSecondaryActiveId(screen: string, stack: string[]): string {
    if (screen === 'list' || screen === 'outbox' || screen === 'trash') {
        return screen;
    }
    return stack.at(-1) ?? 'list';
}
