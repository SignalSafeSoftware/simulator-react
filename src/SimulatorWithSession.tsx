/**
 * Shared simulator core: given session state, renders shell + active app + contacts modal.
 */
import type { ReactNode } from 'react';
import { useCallback, useMemo, useRef } from 'react';
import PhoneSimulatorShell from './shell/PhoneSimulatorShell.js';
import SimulatorDeveloperToolsPanel from './SimulatorDeveloperToolsPanel.js';
import type { SimulatorDispatchAction } from './state/simulatorSessionReducer.js';
import type { SimulatorSessionState } from './types/session.js';
import { viewStateToActiveChannel, getCurrentScreenForApp } from './types/session.js';
import { SHELL_EXIT_LABEL } from './constants.js';
import type { HostSimulatorEventHandler } from './contract/hostContractTypes.js';
import ContactsView from './views/ContactsView.js';
import { renderActiveScreen } from './screenRegistry/index.js';
import SimulatorErrorBoundary from './SimulatorErrorBoundary.js';
import UnsupportedScreenFallback from './UnsupportedScreenFallback.js';
import { getScreenMetadata } from './utils/screenMetadata.js';
import { getVerificationContextForApp } from './utils/simulatorVerificationContext.js';
import type { TimelineEntry } from './components/SimulatorSessionTimeline.js';
import type { SimulatorDeveloperTools, SimulatorRuntimeIssue } from './developerTools.js';
import { useSimulatorSessionHandlers } from './hooks/useSimulatorSessionHandlers.js';
import { useSimulatorSecondaryMenu } from './hooks/useSimulatorSecondaryMenu.js';
import { useSimulatorDeveloperControls } from './hooks/useSimulatorDeveloperControls.js';
import SimulatorDeveloperToolbar from './components/SimulatorDeveloperToolbar.js';
import SimulatorDeveloperControlsBar from './components/SimulatorDeveloperControlsBar.js';
import { simSpacing } from './simulatorStyles.js';
import { SimulatorDialog } from './ui/primitives.js';
import { joinClasses } from './ui/simulatorClasses.js';
import {
    SIM_CHANNEL,
    SIM_RUNTIME,
    SIM_RUNTIME_SCREEN,
    simChannelModifierForShellChannel,
} from './ui/semanticSimulatorClasses.js';
import type {
    SimulatorChoiceRenderProps,
    SimulatorFeedbackRenderProps,
} from './ui/renderSlots.js';

export interface SimulatorContactsOverlayRenderProps {
    contacts: SimulatorSessionState['payload']['contacts'];
    verificationContext: ReturnType<typeof getVerificationContextForApp>;
    onClose: () => void;
}

export interface SimulatorWithSessionProps {
    state: SimulatorSessionState;
    dispatch: (action: SimulatorDispatchAction) => void;
    onSimulatorEvent?: HostSimulatorEventHandler;
    exitLink?: ReactNode;
    exitTo?: string;
    exitLabel?: string;
    compact?: boolean;
    initialContactsSearch?: string;
    developerTools?: SimulatorDeveloperTools;
    developerToolsTimelineEntries?: TimelineEntry[];
    developerToolsRuntimeIssues?: SimulatorRuntimeIssue[];
    /** Host-owned overlay for the contacts verification panel. */
    renderContactsOverlay?: (props: SimulatorContactsOverlayRenderProps) => ReactNode;
    /** Host-owned choice button rendering (Answer, Send, page actions, etc.). */
    renderChoice?: (choice: SimulatorChoiceRenderProps) => ReactNode;
    /** Host-owned inline feedback/warning rendering. */
    renderFeedback?: (feedback: SimulatorFeedbackRenderProps) => ReactNode;
}

export default function SimulatorWithSession({
    state,
    dispatch,
    onSimulatorEvent,
    exitLink,
    exitTo,
    exitLabel = SHELL_EXIT_LABEL,
    compact = false,
    initialContactsSearch,
    developerTools,
    developerToolsTimelineEntries,
    developerToolsRuntimeIssues,
    renderContactsOverlay,
    renderChoice,
    renderFeedback,
}: Readonly<SimulatorWithSessionProps>) {
    const stateRef = useRef(state);
    stateRef.current = state;

    const payload = state.payload;
    const view = state.view;
    const activeApp = view.activeApp;
    const activeChannel = viewStateToActiveChannel(activeApp);

    const {
        onToggleContactsPanel,
        handleChannelChange,
        renderContext,
        capabilities,
    } = useSimulatorSessionHandlers({
        state,
        dispatch,
        onSimulatorEvent,
        initialContactsSearch,
        stateRef,
        renderChoice,
        renderFeedback,
    });

    const secondaryMenu = useSimulatorSecondaryMenu(view, dispatch, capabilities.phone);

    const developerControls = useSimulatorDeveloperControls({
        state,
        dispatch,
        stateRef,
        developerTools,
    });

    const getVerificationContext = useCallback(
        () => getVerificationContextForApp(activeApp, payload),
        [activeApp, payload]
    );

    const currentScreenForApp = getCurrentScreenForApp(view);

    const activeContent =
        renderActiveScreen(activeApp, renderContext) ?? (
            <UnsupportedScreenFallback app={activeApp} screen={currentScreenForApp} />
        );

    const screenMeta = useMemo(() => getScreenMetadata(view, payload), [view, payload]);

    const contactsOverlayContent =
        renderContactsOverlay?.({
            contacts: payload.contacts,
            verificationContext: getVerificationContext(),
            onClose: onToggleContactsPanel,
        }) ?? (
            <ContactsView
                contacts={payload.contacts}
                title="Verify contact"
                verificationContext={getVerificationContext()}
                onBack={onToggleContactsPanel}
            />
        );

    return (
        <SimulatorErrorBoundary>
            <div
                className={SIM_RUNTIME}
                data-simulator-app={screenMeta.app}
                data-simulator-screen={screenMeta.screen}
                data-simulator-label={screenMeta.label}
            >
                {developerControls.showDeveloperToolsToolbar && (
                    <SimulatorDeveloperToolbar
                        sections={developerControls.developerToolbarSections}
                        visibleSections={developerControls.visibleDeveloperSections}
                        onToggleSection={developerControls.toggleDeveloperSection}
                    />
                )}
                {developerControls.showParentDeveloperControls && (
                    <SimulatorDeveloperControlsBar
                        showSnapshotExport={developerControls.showResolvedSnapshotExport}
                        showNavGraph={developerControls.showResolvedNavGraph}
                        enableKeyboardShortcuts={developerControls.enableResolvedKeyboardShortcuts}
                        snapshotCopied={developerControls.snapshotCopied}
                        graphCopied={developerControls.graphCopied}
                        shortcutsHelpOpen={developerControls.shortcutsHelpOpen}
                        navGraph={developerControls.navGraph}
                        onCopySnapshot={developerControls.handleCopySnapshot}
                        onCopyNavGraph={developerControls.handleCopyNavGraph}
                        onToggleShortcutsHelp={() =>
                            developerControls.setShortcutsHelpOpen((prev) => !prev)
                        }
                    />
                )}
                <SimulatorDeveloperToolsPanel
                    developerTools={developerControls.renderedDeveloperTools}
                    payload={payload}
                    timelineEntries={developerToolsTimelineEntries}
                    runtimeIssues={developerToolsRuntimeIssues}
                    className={simSpacing.mb3}
                />
                <PhoneSimulatorShell
                    activeChannel={activeChannel}
                    onChannelChange={handleChannelChange}
                    exitSlot={exitLink}
                    exitTo={exitLink ? undefined : exitTo}
                    exitLabel={exitLabel}
                    compact={compact}
                    hideBottomNav={
                        (activeApp === 'messages' &&
                            (currentScreenForApp === 'thread_detail' || currentScreenForApp === 'new_thread')) ||
                        (activeApp === 'email' && currentScreenForApp === 'detail')
                    }
                    secondaryMenu={
                        secondaryMenu
                            ? {
                                  items: secondaryMenu.items,
                                  activeId: secondaryMenu.activeId,
                                  onSelect: secondaryMenu.onSelect,
                                  onSecondaryBack: secondaryMenu.onSecondaryBack,
                              }
                            : undefined
                    }
                >
                    <div
                        className={joinClasses(
                            SIM_RUNTIME_SCREEN,
                            SIM_CHANNEL,
                            simChannelModifierForShellChannel(activeChannel),
                        )}
                    >
                        {activeContent}
                    </div>
                </PhoneSimulatorShell>
            </div>
            <SimulatorDialog
                open={view.contactsPanelOpen}
                onClose={onToggleContactsPanel}
                aria-label="Verify contact"
            >
                {contactsOverlayContent}
            </SimulatorDialog>
        </SimulatorErrorBoundary>
    );
}
