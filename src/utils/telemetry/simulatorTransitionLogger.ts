import { SimulatorActionType } from './simulatorActionTaxonomy.js';
import { SimulatorDispatchActionType } from '../../state/simulatorDispatchActions.js';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
/**
 * Optional dev-only state transition logging for the simulator reducer.
 * Off by default. Simulator-scoped; no Redux or global framework.
 *
 * How to enable (in browser console, then refresh or interact with simulator):
 *   window.__SIMULATOR_LOG_TRANSITIONS__ = true
 * or
 *   localStorage.setItem('simulator_log_transitions', '1')
 * To disable: set to false or remove the key.
 */

import {
    getCurrentScreenForApp,
    type SimulatorSessionState,
    type SimulatorViewState,
} from '../../types/session.js';
import { getScreenMetadata, getScreenContextLabel } from '../navigation/screenMetadata.js';

/** Action shape used for logging (avoids circular import from reducer). */
interface DispatchActionForLog {
    type: string;
    app?: string;
    screen?: string;
    messageId?: string | null;
    threadId?: string;
    pageId?: string;
    index?: number;
    action?: {
        type: string;
        app?: string;
        screen?: string;
        messageId?: string;
        threadId?: string;
        pageId?: string;
    };
}

const STORAGE_KEY = 'simulator_log_transitions';
const PREFIX = '[Simulator]';

function getNodeEnv(): string | undefined {
    const processValue = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process;
    return processValue?.env?.NODE_ENV;
}

function getEnabled(): boolean {
    if (getNodeEnv() !== undefined && getNodeEnv() !== 'development') {
        return false;
    }
    const globalWindow = globalThis.window as
        | (Window & {
              __SIMULATOR_LOG_TRANSITIONS__?: boolean;
          })
        | undefined;
    if (globalWindow == null) return false;
    try {
        if (globalWindow.__SIMULATOR_LOG_TRANSITIONS__ === true) {
            return true;
        }
        if (globalThis.localStorage?.getItem(STORAGE_KEY) === '1') {
            return true;
        }
    } catch {
        return false;
    }
    return false;
}

function formatAppScreen(view: SimulatorViewState): string {
    const app = view.activeApp;
    const screen = getScreenForActiveApp(view, app);
    return `${app}/${screen}`;
}

function getScreenForActiveApp(
    view: SimulatorViewState,
    app: SimulatorViewState['activeApp'],
): string {
    return getCurrentScreenForApp(view, app) || '?';
}

function formatAction(action: DispatchActionForLog): string {
    if (action.type === SimulatorDispatchActionType.SimulatorAction && action.action) {
        const a = action.action;
        if (a.type === SimulatorActionType.NavigateScreen)
            return `${action.type}(navigate_screen ${a.app}/${a.screen})`;
        if (a.type === SimulatorActionType.OpenEmail)
            return `${action.type}(open_email ${a.messageId})`;
        if (a.type === SimulatorActionType.OpenThread)
            return `${action.type}(open_thread ${a.threadId})`;
        if (a.type === SimulatorActionType.OpenPage) return `${action.type}(open_page ${a.pageId})`;
        return `${action.type}(${a.type})`;
    }
    if (action.type === SimulatorDispatchActionType.NavLocal)
        return `${action.type}(${action.app}/${action.screen})`;
    if (action.type === SimulatorDispatchActionType.BrowserScreen)
        return `${action.type}(${action.screen})`;
    if (action.type === SimulatorDispatchActionType.SelectEmail)
        return `${action.type}(${action.messageId ?? 'null'})`;
    if (action.type === SimulatorDispatchActionType.SwitchApp)
        return `${action.type}(${action.app})`;
    if (action.type === SimulatorDispatchActionType.PhoneChoose)
        return `${action.type}(${action.index})`;
    return action.type;
}

function appendEmailChange(
    parts: string[],
    prev: SimulatorViewState,
    next: SimulatorViewState,
): void {
    if (next.activeApp !== SimulatorApp.Email || prev.email.screen === next.email.screen) {
        return;
    }
    parts.push(`email ${prev.email.screen}→${next.email.screen}`);
    if (next.email.selectedMessageId != null) {
        parts.push(`msg=${next.email.selectedMessageId}`);
    }
}

function appendMessagesChange(
    parts: string[],
    prev: SimulatorViewState,
    next: SimulatorViewState,
): void {
    if (next.activeApp === SimulatorApp.Messages && prev.messages.screen !== next.messages.screen) {
        parts.push(`messages ${prev.messages.screen}→${next.messages.screen}`);
    }
}

function appendInternetChange(
    parts: string[],
    prev: SimulatorViewState,
    next: SimulatorViewState,
): void {
    if (next.activeApp !== SimulatorApp.Internet || prev.internet.screen === next.internet.screen) {
        return;
    }
    parts.push(`internet ${prev.internet.screen}→${next.internet.screen}`);
    if (next.internet.stack.length !== prev.internet.stack.length) {
        parts.push(`stack=${next.internet.stack.length}`);
    }
}

function appendPhoneChange(
    parts: string[],
    prev: SimulatorViewState,
    next: SimulatorViewState,
): void {
    if (next.activeApp === SimulatorApp.Phone && prev.phone.screen !== next.phone.screen) {
        parts.push(`phone ${prev.phone.screen}→${next.phone.screen}`);
    }
    if (prev.phone.chosenIndex !== next.phone.chosenIndex && next.phone.chosenIndex != null) {
        parts.push(`chosenIndex=${next.phone.chosenIndex}`);
    }
}

function appendHomeChange(
    parts: string[],
    prev: SimulatorViewState,
    next: SimulatorViewState,
): void {
    if (next.activeApp === SimulatorApp.Home && prev.home.screen !== next.home.screen) {
        parts.push(`home ${prev.home.screen}→${next.home.screen}`);
    }
}

function appendGlobalViewChanges(
    parts: string[],
    prev: SimulatorViewState,
    next: SimulatorViewState,
): void {
    if (prev.contactsPanelOpen !== next.contactsPanelOpen) {
        parts.push(`contactsPanel=${next.contactsPanelOpen}`);
    }
    if (prev.messages.visibleCount !== next.messages.visibleCount) {
        parts.push(`visibleCount=${next.messages.visibleCount}`);
    }
}

function formatLocalChange(prev: SimulatorViewState, next: SimulatorViewState): string | null {
    const parts: string[] = [];
    if (prev.activeApp !== next.activeApp) {
        parts.push(`app ${prev.activeApp}→${next.activeApp}`);
    }
    appendEmailChange(parts, prev, next);
    appendMessagesChange(parts, prev, next);
    appendInternetChange(parts, prev, next);
    appendPhoneChange(parts, prev, next);
    appendHomeChange(parts, prev, next);
    appendGlobalViewChanges(parts, prev, next);
    if (parts.length === 0) return null;
    return parts.join(' ');
}

/**
 * Returns true when transition logging is enabled (dev only + window or localStorage flag).
 */
export function isSimulatorTransitionLoggingEnabled(): boolean {
    return getEnabled();
}

/**
 * Log one transition to console. No-op when logging is disabled or not in development.
 * Call after reducer run with prev, action, and next state.
 * Includes screen metadata label when view changes for clearer debug context.
 */
export function logSimulatorTransition(
    prev: SimulatorSessionState,
    action: DispatchActionForLog,
    next: SimulatorSessionState,
): void {
    if (!getEnabled() || typeof console === 'undefined' || !console.log) return;
    const prevLoc = formatAppScreen(prev.view);
    const nextLoc = formatAppScreen(next.view);
    const actionStr = formatAction(action);
    const local = formatLocalChange(prev.view, next.view);
    const nextMeta = getScreenMetadata(next.view, next.payload);
    const label = getScreenContextLabel(nextMeta);
    const line = local
        ? `${PREFIX} ${actionStr}  ${prevLoc} → ${nextLoc}  [${label}]  (${local})`
        : `${PREFIX} ${actionStr}  ${prevLoc} → ${nextLoc}  [${label}]`;
    console.log(line);
}
