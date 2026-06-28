/**
 * Secondary menu helpers for phone and email shell navigation.
 */

import { DEFAULT_BROWSER_SUBMIT_TARGET } from '../constants.js';

export const EMAIL_SECONDARY_ITEMS = [
    { id: 'list', label: 'Inbox', icon: '📥' },
    { id: 'outbox', label: 'Outbox', icon: '📤' },
    { id: 'trash', label: 'Trash', icon: '🗑️' },
    { id: 'back', label: 'Back', icon: '↩' },
] as const;

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
