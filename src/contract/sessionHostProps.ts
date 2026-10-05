import type { ReactNode } from 'react';
import type { SimulatorSessionState } from '../types/session.js';
import type { SimulatorDispatchAction } from '../state/simulatorDispatchActions.js';
import type { HostSimulatorEventHandler } from './hostContractTypes.js';
import type { SimulatorScreenOverrides } from './screenOverrides.js';
import type { SimulatorNavigationOptions } from './navigation.js';
import type { TimelineEntry } from '../developer-tools/SimulatorSessionTimeline.js';
import type {
    SimulatorDeveloperTools,
    SimulatorRuntimeIssue,
} from '../developer-tools/configuration.js';
import type { SimulatorPhoneContactOpenProps } from '../ui/renderSlots.js';

/** Session state, dispatch and the host hooks that observe or replace it. */
export interface SimulatorSessionBindingProps {
    state: SimulatorSessionState;
    dispatch: (action: SimulatorDispatchAction) => void;
    onSimulatorEvent?: HostSimulatorEventHandler;
    onNavigation?: NonNullable<SimulatorNavigationOptions['onNavigation']>;
    onNavigationEvent?: NonNullable<SimulatorNavigationOptions['onNavigationEvent']>;
    /** Host content for explicit app/screen destinations, inside the existing shell. */
    screenOverrides?: SimulatorScreenOverrides;
}

/** Optional exit affordance rendered by the shell. */
export interface SimulatorExitProps {
    exitLink?: ReactNode;
    exitTo?: string;
    exitLabel?: string;
}

/** Optional developer tooling and the diagnostics it displays. */
export interface SimulatorDeveloperToolsProps {
    developerTools?: SimulatorDeveloperTools;
    developerToolsTimelineEntries?: TimelineEntry[];
    developerToolsRuntimeIssues?: SimulatorRuntimeIssue[];
}

/** Host ownership of the phone contact detail screen. */
export interface SimulatorPhoneContactHostProps {
    /** When true, phone contact row clicks invoke {@link onPhoneContactOpen} instead of package detail view. */
    hostOwnsPhoneContactDetail?: boolean;
    /** Host callback when a phone contact row is opened (requires {@link hostOwnsPhoneContactDetail}). */
    onPhoneContactOpen?: (props: SimulatorPhoneContactOpenProps) => void;
}
