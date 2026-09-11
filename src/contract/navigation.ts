import type { SimulatorDispatchAction } from '../state/simulatorDispatchActions.js';
import { simulatorSessionReducer } from '../state/simulatorSessionReducer.js';
import type { SimulatorSessionState, SimulatorApp } from '../types/session.js';
import { getCurrentScreenForApp } from '../types/session.js';

export interface SimulatorNavigationLocation {
    app: SimulatorApp;
    screen: string;
    primaryMenu: boolean;
}
export interface SimulatorNavigationRequest {
    kind: 'app' | 'screen' | 'back' | 'primary' | 'cancel';
    from: SimulatorNavigationLocation;
    to: SimulatorNavigationLocation;
}
export type SimulatorNavigationHandler = (request: SimulatorNavigationRequest) => 'handled' | 'delegate' | void;
export interface SimulatorNavigationEvent extends SimulatorNavigationRequest {
    disposition: 'handled' | 'delegated';
}
export interface SimulatorNavigationOptions {
    getState: () => SimulatorSessionState;
    dispatch: (action: SimulatorDispatchAction) => void;
    onNavigation?: SimulatorNavigationHandler;
    onNavigationEvent?: (event: SimulatorNavigationEvent) => void;
}
function navigationKind(action: SimulatorDispatchAction): SimulatorNavigationRequest['kind'] | undefined {
    switch (action.type) {
        case 'SWITCH_APP': return 'app';
        case 'NAV_LOCAL':
        case 'BROWSER_SCREEN': return 'screen';
        case 'BACK': return 'back';
        case 'BACK_TO_PRIMARY': return 'primary';
        case 'CANCEL': return 'cancel';
        case 'SIMULATOR_ACTION':
            if (action.action.type === 'navigate_screen') return 'screen';
            if (action.action.type === 'open_app') return 'app';
            return undefined;
        default: return undefined;
    }
}
function location(state: SimulatorSessionState): SimulatorNavigationLocation {
    return { app: state.view.activeApp, screen: getCurrentScreenForApp(state.view), primaryMenu: state.view.showPrimaryMenu };
}
/** One synchronous boundary for shell, registry, keyboard and host navigation.
 * A handled request never dispatches or mutates the package back stack.
 * Exceptions propagate without fallback dispatch; observers cannot control navigation.
 */
export function createSimulatorNavigationDispatch(options: SimulatorNavigationOptions): SimulatorNavigationOptions['dispatch'] {
    return (action) => {
        const kind = navigationKind(action);
        if (kind === undefined) { options.dispatch(action); return; }
        const state = options.getState();
        const request = { kind, from: location(state), to: location(simulatorSessionReducer(state, action)) };
        const handled = options.onNavigation?.(request) === 'handled';
        if (!handled) options.dispatch(action);
        options.onNavigationEvent?.({ ...request, disposition: handled ? 'handled' : 'delegated' });
    };
}
