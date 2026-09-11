import type { ComponentType, ReactNode } from 'react';
import type { SimulatorDispatchAction } from '../state/simulatorDispatchActions.js';
import type { EmailScreenId, HomeScreenId, MessagesScreenId, PhoneScreenId, SimulatorSessionState } from '../types/session.js';
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

type Screens<Screen extends string> = Partial<Record<Screen, ComponentType<SimulatorScreenOverrideProps>>>;
/** Stable React component types, not render callbacks. Omitted screens retain defaults. */
export interface SimulatorScreenOverrides {
    phone?: Screens<PhoneScreenId>;
    email?: Screens<EmailScreenId>;
    messages?: Screens<MessagesScreenId>;
    internet?: Screens<string>;
    home?: Screens<HomeScreenId>;
}

export function resolveScreenOverride(overrides: SimulatorScreenOverrides | undefined, state: SimulatorSessionState): ComponentType<SimulatorScreenOverrideProps> | undefined {
    switch (state.view.activeApp) {
        case 'phone': return overrides?.phone?.[state.view.phone.screen];
        case 'email': return overrides?.email?.[state.view.email.screen];
        case 'messages': return overrides?.messages?.[state.view.messages.screen];
        case 'internet': return overrides?.internet?.[state.view.internet.screen];
        case 'home': return overrides?.home?.[state.view.home.screen];
    }
}
