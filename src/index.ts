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
export {
    type SimulatorWorldPartial,
    deepMergeSections,
    applyPartials,
} from './utils/simulatorWorldSections.js';

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

export {
    actionToInteractionEvent,
    appOpenedEvent,
    screenViewedEvent,
} from './utils/simulatorEventMapper.js';
export {
    getSimulatorCapabilities,
    type SimulatorCapabilities,
} from './utils/simulatorCapabilities.js';

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

export { createSimulatorNavigationDispatch } from './contract/navigation.js';
export type {
    SimulatorNavigationRequest,
    SimulatorNavigationEvent,
    SimulatorNavigationHandler,
    SimulatorNavigationOptions,
} from './contract/navigation.js';
export { default as PhoneHistoryList } from './views/PhoneHistoryList.js';
export type { PhoneHistoryListProps } from './views/PhoneHistoryList.js';

export type {
    SimulatorScreenOverrides,
    SimulatorScreenOverrideProps,
} from './contract/screenOverrides.js';

export type { EmailComposeViewProps } from './views/EmailComposeView.js';
export type { MessagesNewThreadViewProps } from './views/MessagesNewThreadView.js';

export {
    createSimulatorDatasource,
    createSimulatorDatasourceFromPayload,
    simulatorDatasourceToPayload,
    updateSimulatorDatasource,
    updateSimulatorPayload,
    deviceJsonToPayload,
} from './datasource/datasource.js';
export type { SimulatorDatasource, SimulatorReadonly } from './datasource/datasource.js';

export { default as PhoneKeypad } from './views/PhoneKeypad.js';
export type { PhoneKeypadProps, PhoneKeypadDigit } from './views/PhoneKeypad.js';
export { default as PhoneCallView, formatPhoneCallDuration } from './views/PhoneCallView.js';
export type { PhoneCallViewProps } from './views/PhoneCallView.js';
export { default as PhoneContactEditor } from './views/PhoneContactEditor.js';
export type { PhoneContactEditorProps } from './views/PhoneContactEditor.js';
export {
    default as PhoneHistoryDetail,
    PhoneHistoryPagination,
} from './views/PhoneHistoryDetail.js';
export type { PhoneHistoryDetailProps } from './views/PhoneHistoryDetail.js';
export { default as SimulatorScreenTile } from './views/SimulatorScreenTile.js';

export {
    SimulatorListGroup,
    SimulatorListLoadingContext,
} from './components/SimulatorListGroup.js';
export type { SimulatorListGroupProps } from './components/SimulatorListGroup.js';

export * from './i18n/catalog.js';
export * from './i18n/SimulatorLocale.js';
export * from './components/ContactValuesEditor.js';
export * from './components/SimulatorPage.js';

export { EmailComposeContext, useEmailComposeOptions } from './views/emailComposeContract.js';
export type { EmailComposeDraft, EmailComposeOptions } from './views/emailComposeContract.js';

export { PhoneNumberFormatContext, usePhoneNumberFormatter } from './contract/phonePresentation.js';
export type { PhoneNumberFormatter } from './contract/phonePresentation.js';

export { MessageComposeContext, useMessageComposeOptions } from './views/messageComposeContract.js';
export type { MessageComposeDraft, MessageComposeOptions } from './views/messageComposeContract.js';

export * from './contract/capabilities.js';
export * from './components/ContactPhotoControls.js';

export * from './views/phoneDialContract.js';

export {
    ComposerStateContext,
    useComposerState,
    type ComposerState,
} from './views/composerState.js';

export {
    SimulatorListFooterContext,
    SimulatorTimelineContext,
} from './components/HostListSlots.js';

export { getPhoneSecondaryItems } from './utils/phoneLocalNavItems.js';
export {
    getEmailSecondaryItems,
    getPhoneSecondaryActiveId,
    getEmailSecondaryActiveId,
} from './utils/simulatorSecondaryMenuHelpers.js';
export { shouldHideSimulatorNavigation } from './utils/simulatorNavigationPolicy.js';

export { default as SimulatorVault } from './apps/Vault.js';

export { default as SimulatorPhotos } from './apps/Photos.js';

export { default as SimulatorPhotoEditor } from './apps/PhotoEditor.js';

export { default as SimulatorPhotoLocation } from './apps/PhotoLocation.js';

export { default as SimulatorMailbox } from './apps/Mailbox.js';

export { default as SimulatorBrowserWorkbench } from './apps/MockBrowser.js';
export { HtmlMockPage, ReactMockPage, type MockPage } from './apps/MockBrowser.js';
export type { MailboxSource } from './apps/Mailbox.js';
export {
    LockScreen as SimulatorLockScreen,
    LockSettings as SimulatorLockSettings,
} from './apps/LockScreen.js';
export { DevicePage as SimulatorAppPage } from './apps/DevicePage.js';
export * from './apps/host.js';
export * from './apps/SimulatorAppNavItem.js';
export * from './apps/LoadMore.js';
export * from './apps/useDevicePage.js';
export * from './apps/useDeviceRecord.js';
export * from './apps/useVisiblePage.js';
export * from './apps/assets.js';
export * from './apps/photoMetadata.js';
export * from './apps/browserBridge.js';
export * from './apps/browserDocument.js';
export * from './apps/lock.js';
