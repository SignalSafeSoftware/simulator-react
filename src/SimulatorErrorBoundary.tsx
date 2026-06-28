/**
 * Error boundary scoped to simulator content. Catches render/lifecycle errors
 * in the simulator shell content so the rest of the page (chrome, nav) does not crash.
 *
 * Default UI is learner-safe (no exception message or component stack).
 * Pass `showDiagnostics` for author/admin or local debugging surfaces.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import {
    LEARNER_SIMULATOR_ERROR_MESSAGE,
    LEARNER_SIMULATOR_ERROR_TITLE,
} from './constants.js';
import { simSpacing, simStatus } from './simulatorStyles.js';
import { SimulatorButton } from './ui/primitives.js';
import {
    joinClasses,
    SIM_MONO,
    SIM_MUTED,
    SIM_OVERFLOW_AUTO,
    SIM_TEXT_DANGER,
    SIM_TEXT_MEDIUM,
    SIM_TEXT_SM,
} from './ui/simulatorClasses.js';

export interface SimulatorErrorBoundaryProps {
    children: ReactNode;
    /**
     * Fallback title. Defaults to {@link LEARNER_SIMULATOR_ERROR_TITLE}.
     * When `showDiagnostics` is true, a generic dev title is used if omitted.
     */
    fallbackTitle?: string;
    /** When set, appended to the fallback (e.g. "Return to list"). */
    onRetry?: () => void;
    /**
     * When true, render `error.message` and React component stack (author/admin only).
     * Default false — learner-safe generic copy only.
     */
    showDiagnostics?: boolean;
}

interface State {
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export default class SimulatorErrorBoundary extends Component<SimulatorErrorBoundaryProps, State> {
    state: State = { error: null, errorInfo: null };

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ errorInfo });
        if (typeof console !== 'undefined' && console.error) {
            console.error('[Simulator] Render error:', error, errorInfo.componentStack);
        }
    }

    render(): ReactNode {
        const { error, errorInfo } = this.state;
        const {
            children,
            fallbackTitle,
            onRetry,
            showDiagnostics = false,
        } = this.props;

        if (error != null) {
            const title =
                fallbackTitle ??
                (showDiagnostics ? 'Simulator error' : LEARNER_SIMULATOR_ERROR_TITLE);
            const body = showDiagnostics
                ? error.message
                : LEARNER_SIMULATOR_ERROR_MESSAGE;

            return (
                <div
                    className={`${simSpacing.blockPadding} ${simStatus.errorBox}`}
                    role="alert"
                    data-testid="simulator-error-fallback"
                    data-show-diagnostics={showDiagnostics ? 'true' : 'false'}
                >
                    <p className={joinClasses(SIM_TEXT_MEDIUM, SIM_TEXT_DANGER, simSpacing.mb1)}>{title}</p>
                    <p className={joinClasses(simSpacing.mb1, 'simulator-text--break')}>{body}</p>
                    {showDiagnostics && errorInfo?.componentStack ? (
                        <pre
                            className={joinClasses(SIM_TEXT_SM, SIM_MUTED, simSpacing.mb2, SIM_MONO, SIM_OVERFLOW_AUTO)}
                            style={{ whiteSpace: 'pre-wrap', maxHeight: 120 }}
                            data-testid="simulator-error-diagnostics-stack"
                        >
                            {errorInfo.componentStack}
                        </pre>
                    ) : null}
                    {onRetry != null && (
                        <SimulatorButton tone="outline-secondary" className="simulator-btn--sm" onClick={onRetry}>
                            Dismiss
                        </SimulatorButton>
                    )}
                </div>
            );
        }

        return children;
    }
}
