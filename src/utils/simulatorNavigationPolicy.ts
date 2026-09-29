import type { SimulatorViewState } from '../types/session.js';

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
        (view.activeApp === 'messages' &&
            (screen === 'thread_detail' || screen === 'new_thread')) ||
        (view.activeApp === 'email' && screen === 'detail')
    );
}
