/**
 * Error boundary scoped to simulator content. Catches render/lifecycle errors
 * in the simulator shell content so the rest of the page (chrome, nav) does not crash.
 * Renders a clear dev/admin-facing message; does not hide the error.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { simSpacing, simStatus } from './simulatorStyles';
import { SimulatorButton } from './ui/primitives';
import {
    joinClasses,
    SIM_MONO,
    SIM_MUTED,
    SIM_OVERFLOW_AUTO,
    SIM_TEXT_DANGER,
    SIM_TEXT_MEDIUM,
    SIM_TEXT_SM,
} from './ui/simulatorClasses';

export interface SimulatorErrorBoundaryProps {
    children: ReactNode;
    /** Optional fallback title (default: "Simulator error"). */
    fallbackTitle?: string;
    /** When set, appended to the fallback (e.g. "Return to list"). */
    onRetry?: () => void;
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
        const { children, fallbackTitle = 'Simulator error', onRetry } = this.props;

        if (error != null) {
            return (
                <div
                    className={`${simSpacing.blockPadding} ${simStatus.errorBox}`}
                    role="alert"
                    data-testid="simulator-error-fallback"
                >
                    <p className={joinClasses(SIM_TEXT_MEDIUM, SIM_TEXT_DANGER, simSpacing.mb1)}>{fallbackTitle}</p>
                    <p className={joinClasses(simSpacing.mb1, 'simulator-text--break')}>{error.message}</p>
                    {errorInfo?.componentStack && (
                        <pre
                            className={joinClasses(SIM_TEXT_SM, SIM_MUTED, simSpacing.mb2, SIM_MONO, SIM_OVERFLOW_AUTO)}
                            style={{ whiteSpace: 'pre-wrap', maxHeight: 120 }}
                        >
                            {errorInfo.componentStack}
                        </pre>
                    )}
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
