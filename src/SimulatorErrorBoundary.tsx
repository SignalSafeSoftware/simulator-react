/**
 * Error boundary scoped to simulator content. Catches render/lifecycle errors
 * in the simulator shell content so the rest of the page (chrome, nav) does not crash.
 * Renders a clear dev/admin-facing message; does not hide the error.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { simSpacing, simStatus } from './simulatorStyles';

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
                    <p className="fw-medium text-danger mb-1">{fallbackTitle}</p>
                    <p className="mb-1 text-break">{error.message}</p>
                    {errorInfo?.componentStack && (
                        <pre className="small text-muted mb-2 font-monospace" style={{ whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto' }}>
                            {errorInfo.componentStack}
                        </pre>
                    )}
                    {onRetry != null && (
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onRetry}>
                            Dismiss
                        </button>
                    )}
                </div>
            );
        }

        return children;
    }
}
