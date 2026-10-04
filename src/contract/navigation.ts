import { SimulatorActionType } from '../utils/telemetry/simulatorActionTaxonomy.js';
import {
    SimulatorDispatchActionType,
    type SimulatorDispatchAction,
} from '../state/simulatorDispatchActions.js';
import { simulatorSessionReducer } from '../state/simulatorSessionReducer.js';
import { type SimulatorSessionState, getCurrentScreenForApp } from '../types/session.js';
import type { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';

export interface SimulatorNavigationLocation {
    app: SimulatorApp;
    screen: string;
    primaryMenu: boolean;
}
export const SimulatorNavigationKind = Object.freeze({
    App: 'app',
    Screen: 'screen',
    Back: 'back',
    Primary: 'primary',
    Cancel: 'cancel',
} as const);
export type SimulatorNavigationKind =
    (typeof SimulatorNavigationKind)[keyof typeof SimulatorNavigationKind];
export const SimulatorNavigationDisposition = Object.freeze({
    Handled: 'handled',
    Delegated: 'delegated',
} as const);
export type SimulatorNavigationDisposition =
    (typeof SimulatorNavigationDisposition)[keyof typeof SimulatorNavigationDisposition];
export interface SimulatorNavigationRequest {
    kind: SimulatorNavigationKind;
    from: SimulatorNavigationLocation;
    to: SimulatorNavigationLocation;
}
export type SimulatorNavigationHandler = (
    request: SimulatorNavigationRequest,
) => 'handled' | 'delegate' | void;
export interface SimulatorNavigationEvent extends SimulatorNavigationRequest {
    disposition: SimulatorNavigationDisposition;
}
export interface SimulatorNavigationOptions {
    getState: () => SimulatorSessionState;
    dispatch: (action: SimulatorDispatchAction) => void;
    onNavigation?: SimulatorNavigationHandler;
    onNavigationEvent?: (event: SimulatorNavigationEvent) => void;
}
function navigationKind(
    action: SimulatorDispatchAction,
): SimulatorNavigationRequest['kind'] | undefined {
    switch (action.type) {
        case SimulatorDispatchActionType.SwitchApp:
            return SimulatorNavigationKind.App;
        case SimulatorDispatchActionType.NavLocal:
        case SimulatorDispatchActionType.BrowserScreen:
            return SimulatorNavigationKind.Screen;
        case SimulatorDispatchActionType.Back:
            return SimulatorNavigationKind.Back;
        case SimulatorDispatchActionType.BackToPrimary:
            return SimulatorNavigationKind.Primary;
        case SimulatorDispatchActionType.Cancel:
            return SimulatorNavigationKind.Cancel;
        case SimulatorDispatchActionType.SimulatorAction:
            if (action.action.type === SimulatorActionType.NavigateScreen)
                return SimulatorNavigationKind.Screen;
            if (action.action.type === SimulatorActionType.OpenApp)
                return SimulatorNavigationKind.App;
            return undefined;
        default:
            return undefined;
    }
}
function location(state: SimulatorSessionState): SimulatorNavigationLocation {
    return {
        app: state.view.activeApp,
        screen: getCurrentScreenForApp(state.view),
        primaryMenu: state.view.showPrimaryMenu,
    };
}
/** One synchronous boundary for shell, registry, keyboard and host navigation.
 * A handled request never dispatches or mutates the package back stack.
 * Exceptions propagate without fallback dispatch; observers cannot control navigation.
 */
export function createSimulatorNavigationDispatch(
    options: SimulatorNavigationOptions,
): SimulatorNavigationOptions['dispatch'] {
    return (action) => {
        const kind = navigationKind(action);
        if (kind === undefined) {
            options.dispatch(action);
            return;
        }
        const state = options.getState();
        const request = {
            kind,
            from: location(state),
            to: location(simulatorSessionReducer(state, action)),
        };
        const handled = options.onNavigation?.(request) === 'handled';
        if (!handled) options.dispatch(action);
        options.onNavigationEvent?.({
            ...request,
            disposition: handled
                ? SimulatorNavigationDisposition.Handled
                : SimulatorNavigationDisposition.Delegated,
        });
    };
}
