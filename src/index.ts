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

export type { SimulatorDispatchAction } from './state/simulatorSessionReducer.js';
export {
    switchChannelAction,
    getInitialSessionState,
    simulatorSessionReducer,
    simulatorSessionReducerWithLogging,
} from './state/simulatorSessionReducer.js';

export * from './types/session.js';
export * from './types/simulatorEvents.js';

export {
    SIMULATOR_ACTION_TYPES,
    SIMULATOR_ACTION_CATEGORY,
    SIMULATOR_ACTION_CATEGORIES,
    getSimulatorActionCategory,
    isSimulatorActionType,
    validateSimulatorAction,
} from './utils/simulatorActionTaxonomy.js';

export * from './adapters/templateToSession.js';

/** API template detail shape consumed by {@link templateDetailToPayload} (see `src/types/portableSimulator.ts`). */
export type {
    SimulatorTemplateDetail,
    SimulatorDevicePayload,
    SimulatorEntryPoint,
} from './types/portableSimulator.js';

/** Merge helpers for partial simulator payload slices (authoring overlays). */
export { type SimulatorWorldPartial, deepMergeSections, applyPartials } from './utils/simulatorWorldSections.js';

export {
    type SimulatorNavGraph,
    buildSimulatorNavGraph,
    simulatorNavGraphToJson,
} from './utils/simulatorNavGraph.js';

export { lintSimulatorPayload } from './utils/lintSimulatorPayload.js';
export { analyzeReachability } from './utils/simulatorReachability.js';
export {
    parseSimulatorSearchParams,
    applyDeepLinkToState,
    getDeepLinkContactsSearch,
} from './utils/simulatorDeepLink.js';
export type { SimulatorDeepLink } from './utils/simulatorDeepLink.js';
export { applyPreviewFallback } from './utils/previewFallbackWorld.js';

export { diffSimulatorPayloads, type SimulatorDiffItem } from './utils/simulatorPayloadDiff.js';

export { actionToInteractionEvent, appOpenedEvent, screenViewedEvent } from './utils/simulatorEventMapper.js';
export { getSimulatorCapabilities, type SimulatorCapabilities } from './utils/simulatorCapabilities.js';

export {
    normalizeNameForMatch,
    phoneDigitsOnly,
    normalizePhoneForMatch,
    normalizeEmailForMatch,
    phonesMatch,
    namesMatch,
} from './utils/contactNormalization.js';

export { resolveScreen, renderActiveScreen } from './screenRegistry/index.js';
export type { SimulatorRenderContext } from './screenRegistry/index.js';

export { default as PhoneIncomingScene } from './views/PhoneIncomingScene.js';
export {
    normalizeForSearch,
    contactMatchesSearch,
    contextMatchesContact,
} from './views/ContactsView.js';

export { default as SimulatorWithSession } from './SimulatorWithSession.js';
export type { SimulatorWithSessionProps } from './SimulatorWithSession.js';
export type {
    SimulatorChoiceRenderProps,
    SimulatorFeedbackRenderProps,
    SimulatorPhoneContactOpenProps,
    SimulatorPhoneIncomingCallExtraRenderProps,
} from './ui/renderSlots.js';
export type { SimulatorDeveloperTools } from './developerTools.js';
export { default as SimulatorDeveloperToolsPanel } from './SimulatorDeveloperToolsPanel.js';

export { default as PhoneSimulatorShell } from './shell/PhoneSimulatorShell.js';

export { default as SimulatorErrorBoundary } from './SimulatorErrorBoundary.js';

export { default as SimulatorLintBanner } from './components/SimulatorLintBanner.js';
export type { SessionStartedEntry, TimelineEntry } from './components/SimulatorSessionTimeline.js';

export type { HostSimulatorEventHandler } from './contract/hostContractTypes.js';
