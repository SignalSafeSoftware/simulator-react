/**
 * Session action handlers for SimulatorWithSession (navigation, events, render context).
 */

import { useCallback, useMemo, type MutableRefObject, type ReactNode } from 'react';
import { SimulatorActions } from '../actions/index.js';
import type { HostSimulatorEventHandler } from '../contract/hostContractTypes.js';
import { switchChannelAction, type SimulatorDispatchAction } from '../state/simulatorSessionReducer.js';
import type { SimulatorSessionState, SimulatorChannel, SimulatorAction } from '../types/session.js';
import { channelToApp } from '../types/session.js';
import { actionToInteractionEvent, appOpenedEvent, screenViewedEvent } from '../utils/simulatorEventMapper.js';
import { getSimulatorCapabilities } from '../utils/simulatorCapabilities.js';
import { getBrowserSubmitTargetId } from '../utils/simulatorSecondaryMenuHelpers.js';
import type { SimulatorRenderContext } from '../screenRegistry/index.js';
import type {
    SimulatorChoiceRenderProps,
    SimulatorFeedbackRenderProps,
    SimulatorPhoneContactOpenProps,
    SimulatorPhoneIncomingCallExtraRenderProps,
} from '../ui/renderSlots.js';

export interface UseSimulatorSessionHandlersOptions {
    state: SimulatorSessionState;
    dispatch: (action: SimulatorDispatchAction) => void;
    onSimulatorEvent?: HostSimulatorEventHandler;
    initialContactsSearch?: string;
    stateRef: MutableRefObject<SimulatorSessionState>;
    renderChoice?: (choice: SimulatorChoiceRenderProps) => ReactNode;
    renderFeedback?: (feedback: SimulatorFeedbackRenderProps) => ReactNode;
    renderIncomingCallExtra?: (props: SimulatorPhoneIncomingCallExtraRenderProps) => ReactNode;
    hostOwnsPhoneContactDetail?: boolean;
    onPhoneContactOpen?: (props: SimulatorPhoneContactOpenProps) => void;
}

export interface UseSimulatorSessionHandlersResult {
    onBack: () => void;
    onToggleContactsPanel: () => void;
    handleChannelChange: (channel: string) => void;
    handleAction: (action: SimulatorAction) => void;
    handleSelectEmail: (messageId: string) => void;
    handleSmsRevealNext: () => void;
    handleSelectThread: (threadId: string) => void;
    handleOpenContactFromPhone: (contactId: string) => void;
    renderContext: SimulatorRenderContext;
    capabilities: ReturnType<typeof getSimulatorCapabilities>;
}

export function useSimulatorSessionHandlers({
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
}: UseSimulatorSessionHandlersOptions): UseSimulatorSessionHandlersResult {
    const payload = state.payload;
    const onBack = useCallback(() => dispatch({ type: 'BACK' }), [dispatch]);
    const onToggleContactsPanel = useCallback(() => dispatch({ type: 'TOGGLE_CONTACTS_PANEL' }), [dispatch]);

    const handleChannelChange = useCallback(
        (channel: string) => {
            const newApp = channelToApp(channel as SimulatorChannel);
            dispatch(switchChannelAction(channel as SimulatorChannel));
            const s = stateRef.current;
            if (onSimulatorEvent && s) {
                onSimulatorEvent(appOpenedEvent(newApp, s.view, s.payload));
            }
        },
        [dispatch, onSimulatorEvent, stateRef]
    );

    const handleAction = useCallback(
        (action: SimulatorAction) => {
            dispatch({ type: 'SIMULATOR_ACTION', action });
            if (action.type === 'submit_form') {
                const pages = state.payload.browser?.pages ?? [];
                const currentPageId = state.view.internet.screen;
                const currentPage = pages.find((p) => p?.id === currentPageId);
                const targetId = getBrowserSubmitTargetId(currentPage?.submitTargetPageId);
                const targetExists = pages.some((p) => p?.id === targetId);
                if (targetExists) {
                    dispatch({ type: 'BROWSER_SCREEN', screen: targetId });
                    if (onSimulatorEvent) {
                        onSimulatorEvent(screenViewedEvent('internet', targetId, state.view, state.payload));
                    }
                }
            }
            if (onSimulatorEvent) {
                const event = actionToInteractionEvent(action, state.view, state.payload);
                if (event) onSimulatorEvent(event);
                if (action.type === 'navigate_screen') {
                    onSimulatorEvent(screenViewedEvent(action.app, action.screen, state.view, state.payload));
                }
            }
        },
        [dispatch, state.view, state.payload, onSimulatorEvent]
    );

    const handleSelectEmail = useCallback(
        (messageId: string) => {
            const inbox = state.payload.email?.inbox ?? [];
            const exists = inbox.some((row) => row?.id === messageId);
            if (!exists) {
                return;
            }
            const action = SimulatorActions.openEmail(messageId);
            dispatch({ type: 'SIMULATOR_ACTION', action });
            dispatch({ type: 'SELECT_EMAIL', messageId });
            if (onSimulatorEvent) {
                const event = actionToInteractionEvent(action, state.view, state.payload);
                if (event) onSimulatorEvent(event);
            }
        },
        [dispatch, state.view, state.payload, onSimulatorEvent]
    );

    const handleSmsRevealNext = useCallback(() => {
        dispatch({ type: 'SMS_REVEAL_NEXT' });
    }, [dispatch]);

    const handleSelectThread = useCallback(
        (threadId: string) => {
            const action = SimulatorActions.openThread(threadId);
            dispatch({ type: 'SIMULATOR_ACTION', action });
            dispatch({ type: 'NAV_LOCAL', app: 'messages', screen: 'thread_detail' });
            if (onSimulatorEvent) {
                const event = actionToInteractionEvent(action, state.view, state.payload);
                if (event) onSimulatorEvent(event);
            }
        },
        [dispatch, state.view, state.payload, onSimulatorEvent]
    );

    const handleOpenContactFromPhone = useCallback(
        (contactId: string) => {
            const action = SimulatorActions.openContact(contactId);
            dispatch({ type: 'SIMULATOR_ACTION', action });
            if (onSimulatorEvent) {
                const event = actionToInteractionEvent(action, state.view, state.payload);
                if (event) onSimulatorEvent(event);
            }
        },
        [dispatch, state.view, state.payload, onSimulatorEvent]
    );

    const capabilities = useMemo(() => getSimulatorCapabilities(payload), [payload]);

    const renderContext: SimulatorRenderContext = useMemo(
        () => ({
            state,
            dispatch,
            capabilities,
            onAction: handleAction,
            onSelectEmail: handleSelectEmail,
            onBack,
            onSmsRevealNext: handleSmsRevealNext,
            onSelectThread: handleSelectThread,
            onOpenContactFromPhone: handleOpenContactFromPhone,
            initialContactsSearch,
            renderChoice,
            renderFeedback,
            renderIncomingCallExtra,
            hostOwnsPhoneContactDetail,
            onPhoneContactOpen,
        }),
        [
            state,
            dispatch,
            capabilities,
            handleAction,
            handleSelectEmail,
            onBack,
            handleSmsRevealNext,
            handleSelectThread,
            handleOpenContactFromPhone,
            initialContactsSearch,
            renderChoice,
            renderFeedback,
            renderIncomingCallExtra,
            hostOwnsPhoneContactDetail,
            onPhoneContactOpen,
        ]
    );

    return {
        onBack,
        onToggleContactsPanel,
        handleChannelChange,
        handleAction,
        handleSelectEmail,
        handleSmsRevealNext,
        handleSelectThread,
        handleOpenContactFromPhone,
        renderContext,
        capabilities,
    };
}
