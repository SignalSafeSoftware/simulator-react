import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import {
    SimulatorDispatchActionType,
    type SimulatorDispatchAction,
    switchChannelAction,
} from '../state/simulatorDispatchActions.js';
import {
    type SimulatorSessionState,
    getCurrentScreenForApp,
    viewStateToActiveChannel,
} from '../types/session.js';
import {
    focusSimulatorSearch,
    handleSimulatorKeyboard,
} from '../utils/navigation/simulatorKeyboardCommands.js';
import { listenForDocumentKeydown } from '../utils/browser/browserEnvironment.js';

/** Installs the document keyboard shortcuts while enabled and tracks the help overlay. */
export function useSimulatorKeyboardShortcuts({
    enabled,
    dispatch,
    stateRef,
}: Readonly<{
    enabled: boolean;
    dispatch: (action: SimulatorDispatchAction) => void;
    stateRef: MutableRefObject<SimulatorSessionState>;
}>) {
    const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
    const shortcutsHelpOpenRef = useRef(shortcutsHelpOpen);
    shortcutsHelpOpenRef.current = shortcutsHelpOpen;

    useEffect(() => {
        if (!enabled) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && shortcutsHelpOpenRef.current) {
                setShortcutsHelpOpen(false);
                e.preventDefault();
                return;
            }
            const s = stateRef.current;
            const activeScreen = getCurrentScreenForApp(s.view);
            const result = handleSimulatorKeyboard(
                e,
                {
                    onBack: () => dispatch({ type: SimulatorDispatchActionType.Back }),
                    onSwitchApp: (app) =>
                        dispatch(switchChannelAction(viewStateToActiveChannel(app))),
                    onFocusSearch: focusSimulatorSearch,
                },
                { activeApp: s.view.activeApp, activeScreen },
            );
            if (result.showHelp) setShortcutsHelpOpen(true);
            if (result.handled) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        return listenForDocumentKeydown(onKeyDown);
    }, [enabled, dispatch, stateRef]);

    return { shortcutsHelpOpen, setShortcutsHelpOpen };
}
