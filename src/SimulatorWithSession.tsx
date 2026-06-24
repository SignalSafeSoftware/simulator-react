/**
 * Shared simulator core: given session state, renders shell + active app + contacts modal.
 * Used by SimulatorPage (workspace) and SimulatorPreviewByTemplate (@shared embed for workspace/admin)
 * so that rendering, navigation, and event behavior are identical.
 */
import type { ReactNode } from 'react';
import { useCallback, useMemo, useRef } from 'react';
import PhoneSimulatorShell from './shell/PhoneSimulatorShell';
import SimulatorDeveloperToolsPanel from './SimulatorDeveloperToolsPanel';
import type { SimulatorDispatchAction } from './state/simulatorSessionReducer';
import type { SimulatorSessionState } from './types/session';
import { viewStateToActiveChannel, getCurrentScreenForApp } from './types/session';
import { SHELL_EXIT_LABEL } from './constants';
import type { HostSimulatorEventHandler } from './contract/hostContractTypes';
import ContactsView from './views/ContactsView';
import { renderActiveScreen } from './screenRegistry';
import SimulatorErrorBoundary from './SimulatorErrorBoundary';
import UnsupportedScreenFallback from './UnsupportedScreenFallback';
import { getScreenMetadata } from './utils/screenMetadata';
import { getVerificationContextForApp } from './utils/simulatorVerificationContext';
import { Modal } from 'react-bootstrap';
import type { TimelineEntry } from './components/SimulatorSessionTimeline';
import type { SimulatorDeveloperTools, SimulatorRuntimeIssue } from './developerTools';
import { useSimulatorSessionHandlers } from './hooks/useSimulatorSessionHandlers';
import { useSimulatorSecondaryMenu } from './hooks/useSimulatorSecondaryMenu';
import { useSimulatorDeveloperControls } from './hooks/useSimulatorDeveloperControls';
import SimulatorDeveloperToolbar from './components/SimulatorDeveloperToolbar';
import SimulatorDeveloperControlsBar from './components/SimulatorDeveloperControlsBar';

export interface SimulatorWithSessionProps {
    state: SimulatorSessionState;
    dispatch: (action: SimulatorDispatchAction) => void;
    /**
     * Host hook for **normalized** {@link SimulatorInteractionEvent}s (analytics, orchestration, or forwarding to your API).
     * The package does not perform HTTP — map to your backend in the app or shared layer (e.g. `interactionEventToApiPayload` in `@signalsafe/shared`).
     */
    onSimulatorEvent?: HostSimulatorEventHandler;
    /** Optional custom exit control (e.g. react-router Link). When set, overrides exitTo/exitLabel. */
    exitLink?: ReactNode;
    exitTo?: string;
    exitLabel?: string;
    compact?: boolean;
    /** Optional initial contacts search (e.g. from deep-link ?app=phone&screen=contacts&search=...). */
    initialContactsSearch?: string;
    /** Structured developer-tool config that standardizes preview/debug affordances. */
    developerTools?: SimulatorDeveloperTools;
    /** Optional timeline entries owned by the host surface. */
    developerToolsTimelineEntries?: TimelineEntry[];
    /** Optional runtime issues owned by the host surface (for TreeSpec-backed flows). */
    developerToolsRuntimeIssues?: SimulatorRuntimeIssue[];
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

    return (
        <SimulatorErrorBoundary fallbackTitle="Simulator error">
            <div
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
                    className="mb-3"
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
                    {activeContent}
                </PhoneSimulatorShell>
            </div>
            {view.contactsPanelOpen && (
                <Modal show onHide={onToggleContactsPanel} centered size="sm" contentClassName="rounded-3">
                    <Modal.Body className="p-3">
                        <ContactsView
                            contacts={payload.contacts}
                            title="Verify contact"
                            verificationContext={getVerificationContext()}
                            onBack={onToggleContactsPanel}
                        />
                    </Modal.Body>
                </Modal>
            )}
        </SimulatorErrorBoundary>
    );
}
