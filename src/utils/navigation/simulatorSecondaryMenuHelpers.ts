import {
    SimulatorEmailScreenId,
    SimulatorPhoneScreenId,
} from '@signalsafe/simulator-core/devicePayload';
import { createTranslator, simulatorEnglish } from '../../i18n/catalog.js';
/**
 * Secondary menu helpers for phone and email shell navigation.
 */

import { DEFAULT_BROWSER_SUBMIT_TARGET } from '../../constants.js';

const emailItems = [
    { id: SimulatorEmailScreenId.List, labelKey: 'nav.inbox', icon: '📥' },
    { id: SimulatorEmailScreenId.Outbox, labelKey: 'nav.outbox', icon: '📤' },
    { id: SimulatorEmailScreenId.Trash, labelKey: 'nav.trash', icon: '🗑️' },
    { id: 'back', labelKey: 'nav.back', icon: '↩' },
] as const;

export function getEmailSecondaryItems(locale = createTranslator(simulatorEnglish)) {
    return emailItems.map(({ labelKey, ...item }) => ({ ...item, label: locale.t(labelKey) }));
}

export function getBrowserSubmitTargetId(submitTargetPageId: string | null | undefined): string {
    return submitTargetPageId == null || submitTargetPageId === ''
        ? DEFAULT_BROWSER_SUBMIT_TARGET
        : submitTargetPageId;
}

export function getPhoneSecondaryActiveId(screen: string): string {
    if (
        screen === SimulatorPhoneScreenId.AddContact ||
        screen === SimulatorPhoneScreenId.Directory
    ) {
        return SimulatorPhoneScreenId.Contacts;
    }
    if (
        screen === SimulatorPhoneScreenId.IncomingCall ||
        screen === SimulatorPhoneScreenId.Voicemail
    ) {
        return SimulatorPhoneScreenId.History;
    }
    return screen;
}

export function getEmailSecondaryActiveId(screen: string, stack: string[]): string {
    if (
        screen === SimulatorEmailScreenId.List ||
        screen === SimulatorEmailScreenId.Outbox ||
        screen === SimulatorEmailScreenId.Trash
    ) {
        return screen;
    }
    return stack.at(-1) ?? SimulatorEmailScreenId.List;
}
