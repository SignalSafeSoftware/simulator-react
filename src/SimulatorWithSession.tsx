/**
 * Shared simulator core: given session state, renders shell + active app + contacts modal.
 */
import { shouldHideSimulatorNavigation } from './utils/navigation/simulatorNavigationPolicy.js';
import { useSimulatorLocale } from './i18n/SimulatorLocale.js';
import { resolveScreenOverride } from './contract/screenOverrides.js';
import { createSimulatorNavigationDispatch } from './contract/navigation.js';
import { type ReactNode, useCallback, useMemo, useRef } from 'react';
import PhoneSimulatorShell from './shell/PhoneSimulatorShell.js';
import SimulatorDiagnosticsBand from './developer-tools/SimulatorDiagnosticsBand.js';
import {
    type SimulatorSessionState,
    viewStateToActiveChannel,
    getCurrentScreenForApp,
} from './types/session.js';
import type {
    SimulatorDeveloperToolsProps,
    SimulatorExitProps,
    SimulatorPhoneContactHostProps,
    SimulatorSessionBindingProps,
} from './contract/sessionHostProps.js';
import ContactsView from './views/contacts/ContactsView.js';
import { renderActiveScreen } from './screenRegistry/registry.js';
import SimulatorErrorBoundary from './SimulatorErrorBoundary.js';
import UnsupportedScreenFallback from './UnsupportedScreenFallback.js';
import { getScreenMetadata } from './utils/navigation/screenMetadata.js';
import { getVerificationContextForApp } from './utils/telemetry/simulatorVerificationContext.js';
import { useSimulatorSessionHandlers } from './hooks/useSimulatorSessionHandlers.js';
import { useSimulatorSecondaryMenu } from './hooks/useSimulatorSecondaryMenu.js';
import { useSimulatorDeveloperControls } from './developer-tools/useSimulatorDeveloperControls.js';
import {} from './simulatorStyles.js';
import { SimulatorDialog } from './ui/primitives.js';
import { joinClasses } from './ui/styles/simulatorClasses.js';
import {
    SIM_CHANNEL,
    SIM_RUNTIME,
    SIM_RUNTIME_APP_ROOT,
    SIM_RUNTIME_SCREEN,
    simChannelModifierForShellChannel,
} from './ui/styles/semanticSimulatorClasses.js';
import type {
    SimulatorChoiceRenderProps,
    SimulatorFeedbackRenderProps,
    SimulatorPhoneIncomingCallExtraRenderProps,
} from './ui/renderSlots.js';

export interface SimulatorContactsOverlayRenderProps {
    contacts: SimulatorSessionState['payload']['contacts'];
    verificationContext: ReturnType<typeof getVerificationContextForApp>;
    onClose: () => void;
}

export interface SimulatorWithSessionProps
    extends
        SimulatorSessionBindingProps,
        SimulatorExitProps,
        SimulatorDeveloperToolsProps,
        SimulatorPhoneContactHostProps {
    /** The surrounding device renders the detail and compose actions. */
    hostOwnsScreenActions?: boolean;
    compact?: boolean;
    initialContactsSearch?: string;
    /** Host-owned overlay for the contacts verification panel. */
    renderContactsOverlay?: (props: SimulatorContactsOverlayRenderProps) => ReactNode;
    /** Host-owned choice button rendering (Answer, Send, page actions, etc.). */
    renderChoice?: (choice: SimulatorChoiceRenderProps) => ReactNode;
    /** Host-owned inline feedback/warning rendering. */
    renderFeedback?: (feedback: SimulatorFeedbackRenderProps) => ReactNode;
    /** Host-owned content below incoming-call Answer/Ignore actions. */
    renderIncomingCallExtra?: (props: SimulatorPhoneIncomingCallExtraRenderProps) => ReactNode;
}

export default function SimulatorWithSession({
    state,
    dispatch: rawDispatch,
    onNavigation,
    onNavigationEvent,
    onSimulatorEvent,
    screenOverrides,
    hostOwnsScreenActions = false,
    exitLink,
    exitTo,
    exitLabel,
    compact = false,
    initialContactsSearch,
    developerTools,
    developerToolsTimelineEntries,
    developerToolsRuntimeIssues,
    renderContactsOverlay,
    renderChoice,
    renderFeedback,
    renderIncomingCallExtra,
    hostOwnsPhoneContactDetail,
    onPhoneContactOpen,
}: Readonly<SimulatorWithSessionProps>) {
    const screenLocale = useSimulatorLocale();

    const stateRef = useRef(state);
    stateRef.current = state;
    const dispatch = useMemo(
        () =>
            onNavigation === undefined && onNavigationEvent === undefined
                ? rawDispatch
                : createSimulatorNavigationDispatch({
                      getState: () => stateRef.current,
                      dispatch: rawDispatch,
                      onNavigation,
                      onNavigationEvent,
                  }),
        [rawDispatch, onNavigation, onNavigationEvent],
    );

    const payload = state.payload;
    const view = state.view;
    const activeApp = view.activeApp;
    const activeChannel = viewStateToActiveChannel(activeApp);

    const { onToggleContactsPanel, handleChannelChange, renderContext, capabilities } =
        useSimulatorSessionHandlers({
            state,
            dispatch,
            onSimulatorEvent,
            initialContactsSearch,
            stateRef,
            renderChoice,
            renderFeedback,
            renderIncomingCallExtra,
            hostOwnsPhoneContactDetail,
            onPhoneContactOpen,
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
        [activeApp, payload],
    );

    const currentScreenForApp = getCurrentScreenForApp(view);

    const renderDefault = () =>
        renderActiveScreen(activeApp, {
            ...renderContext,
            locale: screenLocale,
            hostOwnsScreenActions,
        }) ?? <UnsupportedScreenFallback app={activeApp} screen={currentScreenForApp} />;

    const ScreenOverride = resolveScreenOverride(screenOverrides, state);
    const activeContent =
        ScreenOverride === undefined ? (
            renderDefault()
        ) : (
            <ScreenOverride
                key={`${activeApp}:${currentScreenForApp}`}
                state={state}
                location={{
                    app: activeApp,
                    screen: currentScreenForApp,
                    primaryMenu: view.showPrimaryMenu,
                }}
                dispatch={dispatch}
                onBack={renderContext.onBack}
                renderDefault={renderDefault}
            />
        );

    const screenMeta = useMemo(() => getScreenMetadata(view, payload), [view, payload]);

    const contactsOverlayContent = renderContactsOverlay?.({
        contacts: payload.contacts,
        verificationContext: getVerificationContext(),
        onClose: onToggleContactsPanel,
    }) ?? (
        <ContactsView
            contacts={payload.contacts}
            title={screenLocale.t('screen.simulatorWithSession.verify.contact')}
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
                <SimulatorDiagnosticsBand
                    controls={developerControls}
                    payload={payload}
                    timelineEntries={developerToolsTimelineEntries}
                    runtimeIssues={developerToolsRuntimeIssues}
                />
                <div className={SIM_RUNTIME_APP_ROOT}>
                    <PhoneSimulatorShell
                        activeChannel={activeChannel}
                        onChannelChange={handleChannelChange}
                        exitSlot={exitLink}
                        exitTo={exitLink ? undefined : exitTo}
                        exitLabel={exitLabel}
                        compact={compact}
                        hideBottomNav={shouldHideSimulatorNavigation(view, 'scenario')}
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
            </div>
            <SimulatorDialog
                open={view.contactsPanelOpen}
                onClose={onToggleContactsPanel}
                aria-label={screenLocale.t('screen.simulatorWithSession.verify.contact')}
            >
                {contactsOverlayContent}
            </SimulatorDialog>
        </SimulatorErrorBoundary>
    );
}
