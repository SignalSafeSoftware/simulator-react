/**
 * Optional keyboard command map for simulator development, preview, and accessibility.
 * Only active when explicitly enabled (e.g. admin/preview). Does not run in normal run mode.
 * Preserves normal typing: ignores events when target is input, textarea, or contenteditable.
 */

import type { SimulatorApp } from '../types/portableSimulator';
import type { SimulatorChannel } from '../types/session';
import { channelToApp } from '../types/session';

/** Channel order in shell nav (index 0 = first tab). Alt+1..5 switches to these. */
const CHANNEL_ORDER: SimulatorChannel[] = ['contacts', 'email', 'browser', 'sms', 'home'];

export interface SimulatorKeyboardCommandHandlers {
    onBack: () => void;
    onSwitchApp: (app: SimulatorApp) => void;
    /** Focus the contacts search input when on phone/contacts. No-op if not applicable. */
    onFocusSearch: () => void;
    /** Optional: move focus to next/previous item in list views. Dispatches custom event if not provided. */
    onListNav?: (direction: 'next' | 'prev') => void;
}

/** Human-readable command list for help (debug/admin). */
export const SIMULATOR_KEYBOARD_COMMANDS = [
    { keys: 'Escape', description: 'Back' },
    { keys: 'Alt + 1', description: 'Switch to Phone' },
    { keys: 'Alt + 2', description: 'Switch to Email' },
    { keys: 'Alt + 3', description: 'Switch to Internet' },
    { keys: 'Alt + 4', description: 'Switch to Messages' },
    { keys: 'Alt + 5', description: 'Switch to Home' },
    { keys: '/', description: 'Focus search (Contacts only)' },
    { keys: 'Alt + ↓', description: 'Next item (list views)' },
    { keys: 'Alt + ↑', description: 'Previous item (list views)' },
    { keys: '?', description: 'Show this shortcut help' },
] as const;

const LIST_NAV_EVENT = 'simulator-keyboard-list-nav';

/** Dispatch a custom event for list nav so list views can optionally handle next/prev focus. */
function dispatchListNav(direction: 'next' | 'prev'): void {
    if (typeof document === 'undefined') return;
    document.dispatchEvent(new CustomEvent(LIST_NAV_EVENT, { detail: { direction } }));
}

function hasBlockedModifier(e: KeyboardEvent): boolean {
    return e.ctrlKey === true || e.metaKey === true;
}

function isAppSwitchKey(key: string, alt: boolean): boolean {
    return alt && key >= '1' && key <= '5';
}

function getChannelIndex(key: string): number {
    return (key.codePointAt(0) ?? 49) - ('1'.codePointAt(0) ?? 49);
}

function handleAppSwitch(
    e: KeyboardEvent,
    key: string,
    handlers: SimulatorKeyboardCommandHandlers
): { handled: boolean } | null {
    if (!isAppSwitchKey(key, e.altKey === true)) {
        return null;
    }
    const channelIndex = getChannelIndex(key);
    const channel = CHANNEL_ORDER[channelIndex];
    if (channel == null) {
        return null;
    }
    e.preventDefault();
    handlers.onSwitchApp(channelToApp(channel));
    return { handled: true };
}

function handleSearchShortcut(
    e: KeyboardEvent,
    key: string,
    handlers: SimulatorKeyboardCommandHandlers,
    context: { activeApp: SimulatorApp; activeScreen: string }
): { handled: boolean } | null {
    if (key !== '/' || context.activeApp !== 'phone' || context.activeScreen !== 'contacts') {
        return null;
    }
    e.preventDefault();
    handlers.onFocusSearch();
    return { handled: true };
}

function handleListNavShortcut(
    e: KeyboardEvent,
    handlers: SimulatorKeyboardCommandHandlers
): { handled: boolean } | null {
    let direction: 'next' | 'prev' | null = null;
    if (e.altKey === true && e.key === 'ArrowDown') {
        direction = 'next';
    } else if (e.altKey === true && e.key === 'ArrowUp') {
        direction = 'prev';
    }
    if (direction == null) {
        return null;
    }
    e.preventDefault();
    if (handlers.onListNav) {
        handlers.onListNav(direction);
    } else {
        dispatchListNav(direction);
    }
    return { handled: true };
}

/**
 * Return true if the event target is an editable text field; we should not handle shortcuts.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
    if (target == null || !(target instanceof HTMLElement)) return false;
    const tagName = target.tagName?.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea') return true;
    const role = target.getAttribute?.('role');
    if (role === 'textbox' || role === 'searchbox') return true;
    if (target.isContentEditable) return true;
    return false;
}

/**
 * Handle a keydown event. Returns true if the event was handled and should be stopped.
 * Call only when keyboard shortcuts are enabled (e.g. admin/preview).
 */
export function handleSimulatorKeyboard(
    e: KeyboardEvent,
    handlers: SimulatorKeyboardCommandHandlers,
    context: {
        activeApp: SimulatorApp;
        /** Current screen id for active app (e.g. 'contacts', 'list', 'thread_detail'). */
        activeScreen: string;
    }
): { handled: boolean; showHelp?: boolean } {
    if (isTypingTarget(e.target)) return { handled: false };

    const key = e.key;
    if (hasBlockedModifier(e)) return { handled: false };

    if (key === 'Escape') {
        e.preventDefault();
        handlers.onBack();
        return { handled: true };
    }

    const appSwitchResult = handleAppSwitch(e, key, handlers);
    if (appSwitchResult != null) {
        return appSwitchResult;
    }

    const searchResult = handleSearchShortcut(e, key, handlers, context);
    if (searchResult != null) {
        return searchResult;
    }

    const listNavResult = handleListNavShortcut(e, handlers);
    if (listNavResult != null) {
        return listNavResult;
    }

    if (key === '?') {
        e.preventDefault();
        return { handled: true, showHelp: true };
    }

    return { handled: false };
}

/** Event name list views can listen to for Alt+ArrowDown/Alt+ArrowUp (detail.direction: 'next' | 'prev'). */
export const SIMULATOR_LIST_NAV_EVENT = LIST_NAV_EVENT;

/**
 * Focus the first element with data-simulator-search (e.g. contacts search input).
 * Safe to call when element may not exist.
 */
export function focusSimulatorSearch(): void {
    const el = document.querySelector<HTMLElement>('[data-simulator-search]');
    el?.focus();
}
