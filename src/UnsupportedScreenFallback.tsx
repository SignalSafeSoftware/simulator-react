/**
 * Shown when the screen registry cannot resolve (app, screen).
 * Default copy is learner-safe; pass `showDiagnostics` for author/admin detail.
 */
import { simSpacing, simStatus, simTypo } from './simulatorStyles.js';
import {
    LEARNER_UNSUPPORTED_SCREEN_MESSAGE,
    LEARNER_UNSUPPORTED_SCREEN_TITLE,
    UNSUPPORTED_SCREEN_EMPTY_PLACEHOLDER,
    UNSUPPORTED_SCREEN_HINT,
    UNSUPPORTED_SCREEN_TITLE,
} from './constants.js';
import type { SimulatorApp } from './types/portableSimulator.js';
import { joinClasses, SIM_TEXT_MEDIUM } from './ui/simulatorClasses.js';

export interface UnsupportedScreenFallbackProps {
    app: SimulatorApp;
    screen: string;
    /**
     * When true, show internal app/screen ids for authors (default false — learner-safe).
     */
    showDiagnostics?: boolean;
}

export default function UnsupportedScreenFallback({
    app,
    screen,
    showDiagnostics = false,
}: Readonly<UnsupportedScreenFallbackProps>) {
    return (
        <div
            className={`${simSpacing.blockPadding} ${simStatus.warningBox}`}
            role="alert"
            data-testid="simulator-unsupported-screen"
            data-show-diagnostics={showDiagnostics ? 'true' : 'false'}
        >
            <p className={joinClasses(SIM_TEXT_MEDIUM, 'simulator-text--warning', simSpacing.mb1)}>
                {showDiagnostics ? UNSUPPORTED_SCREEN_TITLE : LEARNER_UNSUPPORTED_SCREEN_TITLE}
            </p>
            {showDiagnostics ? (
                <>
                    <p className={joinClasses(simSpacing.mb0, simTypo.secondary)}>
                        App: <code>{app}</code> — Screen:{' '}
                        <code>{screen || UNSUPPORTED_SCREEN_EMPTY_PLACEHOLDER}</code>
                    </p>
                    <p className={joinClasses(simSpacing.mt1, simSpacing.mb0, simTypo.secondary)}>
                        {UNSUPPORTED_SCREEN_HINT}
                    </p>
                </>
            ) : (
                <p className={joinClasses(simSpacing.mb0, simTypo.secondary)}>
                    {LEARNER_UNSUPPORTED_SCREEN_MESSAGE}
                </p>
            )}
        </div>
    );
}
