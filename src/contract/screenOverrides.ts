import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import type { ComponentType, ReactNode } from 'react';
import type { SimulatorDispatchAction } from '../state/simulatorDispatchActions.js';
import type {
    EmailScreenId,
    HomeScreenId,
    MessagesScreenId,
    PhoneScreenId,
    SimulatorSessionState,
    SimulatorViewState,
} from '../types/session.js';
import { ownValue } from '../utils/lookup.js';
import type { SimulatorNavigationLocation } from './navigation.js';

/** Screen content only: the package retains its shell, menus and scrolling region. */
export interface SimulatorScreenOverrideProps {
    state: SimulatorSessionState;
    location: SimulatorNavigationLocation;
    /** Uses the same intercepted navigation boundary as package menus. */
    dispatch: (action: SimulatorDispatchAction) => void;
    onBack: () => void;
    /** Lazily renders the package default; returning null intentionally renders no content. */
    renderDefault: () => ReactNode;
}

type Screens<Screen extends string> = Partial<
    Record<Screen, ComponentType<SimulatorScreenOverrideProps>>
>;
/** Stable React component types, not render callbacks. Omitted screens retain defaults. */
export interface SimulatorScreenOverrides {
    phone?: Screens<PhoneScreenId>;
    email?: Screens<EmailScreenId>;
    messages?: Screens<MessagesScreenId>;
    internet?: Screens<string>;
    home?: Screens<HomeScreenId>;
}

type OverrideComponent = ComponentType<SimulatorScreenOverrideProps> | undefined;

const OVERRIDE_RESOLVERS: Readonly<
    Record<
        SimulatorApp,
        (
            overrides: SimulatorScreenOverrides | undefined,
            view: SimulatorViewState,
        ) => OverrideComponent
    >
> = Object.freeze({
    [SimulatorApp.Phone]: (overrides, view) => overrides?.phone?.[view.phone.screen],
    [SimulatorApp.Email]: (overrides, view) => overrides?.email?.[view.email.screen],
    [SimulatorApp.Messages]: (overrides, view) => overrides?.messages?.[view.messages.screen],
    [SimulatorApp.Internet]: (overrides, view) => overrides?.internet?.[view.internet.screen],
    [SimulatorApp.Home]: (overrides, view) => overrides?.home?.[view.home.screen],
});

export function resolveScreenOverride(
    overrides: SimulatorScreenOverrides | undefined,
    state: SimulatorSessionState,
): OverrideComponent {
    return ownValue(OVERRIDE_RESOLVERS, state.view.activeApp)?.(overrides, state.view);
}
