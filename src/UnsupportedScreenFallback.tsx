/**
 * Shown when the screen registry cannot resolve (app, screen).
 * Keeps the simulator shell intact and surfaces a clear dev/admin message.
 */
import { simSpacing, simStatus, simTypo } from './simulatorStyles';
import {
    UNSUPPORTED_SCREEN_TITLE,
    UNSUPPORTED_SCREEN_EMPTY_PLACEHOLDER,
    UNSUPPORTED_SCREEN_HINT,
} from './constants';
import type { SimulatorApp } from './types/portableSimulator';
import { joinClasses, SIM_TEXT_MEDIUM } from './ui/simulatorClasses';

export interface UnsupportedScreenFallbackProps {
    app: SimulatorApp;
    screen: string;
}

export default function UnsupportedScreenFallback({ app, screen }: Readonly<UnsupportedScreenFallbackProps>) {
    return (
        <div
            className={`${simSpacing.blockPadding} ${simStatus.warningBox}`}
            role="alert"
            data-testid="simulator-unsupported-screen"
        >
            <p className={joinClasses(SIM_TEXT_MEDIUM, 'simulator-text--warning', simSpacing.mb1)}>{UNSUPPORTED_SCREEN_TITLE}</p>
            <p className={joinClasses(simSpacing.mb0, simTypo.secondary)}>
                App: <code>{app}</code> — Screen: <code>{screen || UNSUPPORTED_SCREEN_EMPTY_PLACEHOLDER}</code>
            </p>
            <p className={joinClasses(simSpacing.mt1, simSpacing.mb0, simTypo.secondary)}>{UNSUPPORTED_SCREEN_HINT}</p>
        </div>
    );
}
