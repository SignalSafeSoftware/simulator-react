/**
 * Shown when the screen registry cannot resolve (app, screen).
 * Default copy is learner-safe; pass `showDiagnostics` for author/admin detail.
 */
import { useSimulatorLocale } from './i18n/SimulatorLocale.js';
import { simSpacing, simStatus, simTypo } from './simulatorStyles.js';
import type { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import { SIM_TEXT_MEDIUM, SIM_TEXT_WARNING, joinClasses } from './ui/styles/simulatorClasses.js';
import { SIM_UNSUPPORTED } from './ui/styles/semanticSimulatorClasses.js';

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
    const screenLocale = useSimulatorLocale();

    return (
        <div
            className={joinClasses(SIM_UNSUPPORTED, simSpacing.blockPadding, simStatus.warningBox)}
            role='alert'
            data-testid='simulator-unsupported-screen'
            data-show-diagnostics={showDiagnostics ? 'true' : 'false'}
        >
            <p className={joinClasses(SIM_TEXT_MEDIUM, SIM_TEXT_WARNING, simSpacing.mb1)}>
                {showDiagnostics
                    ? screenLocale.t('fallback.unsupported_screen_title')
                    : screenLocale.t('fallback.learner_unsupported_screen_title')}
            </p>
            {showDiagnostics ? (
                <>
                    <p className={joinClasses(simSpacing.mb0, simTypo.secondary)}>
                        {screenLocale.t('screen.unsupportedScreenFallback.app')}
                        <code>{app}</code>
                        {screenLocale.t('screen.unsupportedScreenFallback.screen')}{' '}
                        <code>
                            {screen ||
                                screenLocale.t('fallback.unsupported_screen_empty_placeholder')}
                        </code>
                    </p>
                    <p className={joinClasses(simSpacing.mt1, simSpacing.mb0, simTypo.secondary)}>
                        {screenLocale.t('fallback.unsupported_screen_hint')}
                    </p>
                </>
            ) : (
                <p className={joinClasses(simSpacing.mb0, simTypo.secondary)}>
                    {screenLocale.t('fallback.learner_unsupported_screen_message')}
                </p>
            )}
        </div>
    );
}
