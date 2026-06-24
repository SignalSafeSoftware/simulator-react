/**
 * @packageDocumentation
 * Device simulator UI (`SimulatorWithSession`, `PhoneSimulatorShell`), session state, registry, adapters, and utilities.
 *
 * Prefer `import { … } from '@signalsafe/simulator-react'` for consumers. A small explicit subpath allowlist exists for tooling.
 *
 * **Export order:** state/types/utilities and screen registry come before shell components so ESM consumers do not hit
 * partially-initialized re-exports when pulling named symbols from the barrel.
 *
 * `validateSimulatorPayload`, `runSimulatorRealismChecks`, and `PREVIEW_PLACEHOLDER_ID_PREFIX` are not re-exported here;
 * import the matching `@signalsafe/simulator-react/utils/*` subpath when needed.
 */

export type { SimulatorDispatchAction } from './state/simulatorSessionReducer';
export {
    switchChannelAction,
    getInitialSessionState,
    simulatorSessionReducer,
    simulatorSessionReducerWithLogging,
} from './state/simulatorSessionReducer';

export * from './types/session';
export * from './types/simulatorEvents';

export {
    SIMULATOR_ACTION_TYPES,
    SIMULATOR_ACTION_CATEGORY,
    SIMULATOR_ACTION_CATEGORIES,
    getSimulatorActionCategory,
    isSimulatorActionType,
    validateSimulatorAction,
} from './utils/simulatorActionTaxonomy';

export * from './adapters/templateToSession';

/** API template detail shape consumed by {@link templateDetailToPayload} (see `src/types/portableSimulator.ts`). */
export type { SimulatorTemplateDetail } from './types/portableSimulator';

/** Merge helpers for partial simulator payload slices (authoring overlays). */
export { type SimulatorWorldPartial, deepMergeSections, applyPartials } from './utils/simulatorWorldSections';

export {
    type SimulatorNavGraph,
    buildSimulatorNavGraph,
    simulatorNavGraphToJson,
} from './utils/simulatorNavGraph';

export { lintSimulatorPayload } from './utils/lintSimulatorPayload';
export { analyzeReachability } from './utils/simulatorReachability';
export {
    parseSimulatorSearchParams,
    applyDeepLinkToState,
    getDeepLinkContactsSearch,
} from './utils/simulatorDeepLink';
export type { SimulatorDeepLink } from './utils/simulatorDeepLink';
export { applyPreviewFallback } from './utils/previewFallbackWorld';

export { diffSimulatorPayloads, type SimulatorDiffItem } from './utils/simulatorPayloadDiff';

export { actionToInteractionEvent, appOpenedEvent, screenViewedEvent } from './utils/simulatorEventMapper';
export { getSimulatorCapabilities, type SimulatorCapabilities } from './utils/simulatorCapabilities';

export {
    normalizeNameForMatch,
    phoneDigitsOnly,
    normalizePhoneForMatch,
    normalizeEmailForMatch,
    phonesMatch,
    namesMatch,
} from './utils/contactNormalization';

export { resolveScreen, renderActiveScreen } from './screenRegistry';
export type { SimulatorRenderContext } from './screenRegistry';

export { default as PhoneIncomingScene } from './views/PhoneIncomingScene';
export {
    normalizeForSearch,
    contactMatchesSearch,
    contextMatchesContact,
} from './views/ContactsView';

export { default as SimulatorWithSession } from './SimulatorWithSession';
export type { SimulatorWithSessionProps } from './SimulatorWithSession';
export type { SimulatorDeveloperTools } from './developerTools';
export { default as SimulatorDeveloperToolsPanel } from './SimulatorDeveloperToolsPanel';

export { default as PhoneSimulatorShell } from './shell/PhoneSimulatorShell';

export { default as SimulatorErrorBoundary } from './SimulatorErrorBoundary';

export { default as SimulatorLintBanner } from './components/SimulatorLintBanner';
export type { SessionStartedEntry, TimelineEntry } from './components/SimulatorSessionTimeline';

export type { HostSimulatorEventHandler } from './contract/hostContractTypes';
