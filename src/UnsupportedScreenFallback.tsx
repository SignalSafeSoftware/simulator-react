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
            <p className="fw-medium text-warning mb-1">{UNSUPPORTED_SCREEN_TITLE}</p>
            <p className={`mb-0 ${simTypo.secondary}`}>
                App: <code>{app}</code> — Screen: <code>{screen || UNSUPPORTED_SCREEN_EMPTY_PLACEHOLDER}</code>
            </p>
            <p className={`mt-1 mb-0 ${simTypo.secondary}`}>{UNSUPPORTED_SCREEN_HINT}</p>
        </div>
    );
}
