import { SimulatorActionType } from '../utils/telemetry/simulatorActionTaxonomy.js';
import { SimulatorMessagesScreenId } from '@signalsafe/simulator-core/devicePayload';
import {
    SimulatorDispatchActionType,
    switchChannelAction,
    type SimulatorDispatchAction,
} from '../state/simulatorDispatchActions.js';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
/**
 * Session action handlers for SimulatorWithSession (navigation, events, render context).
 */

import { useCallback, useMemo, type MutableRefObject, type ReactNode } from 'react';
import { SimulatorActions } from '../actions/simulatorActions.js';
import type { HostSimulatorEventHandler } from '../contract/hostContractTypes.js';
import {
    type SimulatorSessionState,
    type SimulatorAction,
    channelToApp,
    isSimulatorChannel,
} from '../types/session.js';
import {
    actionToInteractionEvent,
    appOpenedEvent,
    screenViewedEvent,
} from '../utils/telemetry/simulatorEventMapper.js';
import { getSimulatorCapabilities } from '../utils/payload/simulatorCapabilities.js';
import { getBrowserSubmitTargetId } from '../utils/navigation/simulatorSecondaryMenuHelpers.js';
import { type SimulatorRenderContext } from '../screenRegistry/types.js';
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
    const onBack = useCallback(
        () => dispatch({ type: SimulatorDispatchActionType.Back }),
        [dispatch],
    );
    const onToggleContactsPanel = useCallback(
        () => dispatch({ type: SimulatorDispatchActionType.ToggleContactsPanel }),
        [dispatch],
    );

    const handleChannelChange = useCallback(
        (channel: string) => {
            if (!isSimulatorChannel(channel)) return;
            const newApp = channelToApp(channel);
            dispatch(switchChannelAction(channel));
            const s = stateRef.current;
            if (onSimulatorEvent && s) {
                onSimulatorEvent(appOpenedEvent(newApp, s.view, s.payload));
            }
        },
        [dispatch, onSimulatorEvent, stateRef],
    );

    const handleAction = useCallback(
        (action: SimulatorAction) => {
            dispatch({ type: SimulatorDispatchActionType.SimulatorAction, action });
            if (action.type === SimulatorActionType.SubmitForm) {
                const pages = state.payload.browser?.pages ?? [];
                const currentPageId = state.view.internet.screen;
                const currentPage = pages.find((p) => p?.id === currentPageId);
                const targetId = getBrowserSubmitTargetId(currentPage?.submitTargetPageId);
                const targetExists = pages.some((p) => p?.id === targetId);
                if (targetExists) {
                    dispatch({ type: SimulatorDispatchActionType.BrowserScreen, screen: targetId });
                    if (onSimulatorEvent) {
                        onSimulatorEvent(
                            screenViewedEvent(
                                SimulatorApp.Internet,
                                targetId,
                                state.view,
                                state.payload,
                            ),
                        );
                    }
                }
            }
            if (onSimulatorEvent) {
                const event = actionToInteractionEvent(action, state.view, state.payload);
                if (event) onSimulatorEvent(event);
                if (action.type === SimulatorActionType.NavigateScreen) {
                    onSimulatorEvent(
                        screenViewedEvent(action.app, action.screen, state.view, state.payload),
                    );
                }
            }
        },
        [dispatch, state.view, state.payload, onSimulatorEvent],
    );

    const recordAction = useCallback(
        (action: SimulatorAction) => {
            dispatch({ type: SimulatorDispatchActionType.SimulatorAction, action });
            const event = onSimulatorEvent
                ? actionToInteractionEvent(action, state.view, state.payload)
                : null;
            if (event) onSimulatorEvent?.(event);
        },
        [dispatch, state.view, state.payload, onSimulatorEvent],
    );

    const handleSelectEmail = useCallback(
        (messageId: string) => {
            const inbox = state.payload.email?.inbox ?? [];
            const exists = inbox.some((row) => row?.id === messageId);
            if (!exists) {
                return;
            }
            // Select after recording the open action so the event reflects the pre-selection view.
            recordAction(SimulatorActions.openEmail(messageId));
            dispatch({ type: SimulatorDispatchActionType.SelectEmail, messageId });
        },
        [dispatch, state.payload, recordAction],
    );

    const handleSmsRevealNext = useCallback(() => {
        dispatch({ type: SimulatorDispatchActionType.SmsRevealNext });
    }, [dispatch]);

    const handleSelectThread = useCallback(
        (threadId: string) => {
            recordAction(SimulatorActions.openThread(threadId));
            dispatch({
                type: SimulatorDispatchActionType.NavLocal,
                app: SimulatorApp.Messages,
                screen: SimulatorMessagesScreenId.ThreadDetail,
            });
        },
        [dispatch, recordAction],
    );

    const handleOpenContactFromPhone = useCallback(
        (contactId: string) => recordAction(SimulatorActions.openContact(contactId)),
        [recordAction],
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
        ],
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
