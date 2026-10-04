import {
    SimulatorEmailScreenId,
    SimulatorMessagesScreenId,
} from '@signalsafe/simulator-core/devicePayload';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import type { SimulatorViewState } from '../../types/session.js';

/** Host composition supplies its own detail/composer controls; scenarios use inline controls. */
export function shouldHideSimulatorNavigation(
    view: SimulatorViewState | null | undefined,
    policy: 'host' | 'scenario',
): boolean {
    if (!view?.activeApp) return true;
    const screen = view[view.activeApp]?.screen;
    if (screen == null) return true;
    if (policy === 'host') return false;
    return (
        (view.activeApp === SimulatorApp.Messages &&
            (screen === SimulatorMessagesScreenId.ThreadDetail ||
                screen === SimulatorMessagesScreenId.NewThread)) ||
        (view.activeApp === SimulatorApp.Email && screen === SimulatorEmailScreenId.Detail)
    );
}
