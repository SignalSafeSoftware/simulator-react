/**
 * Advisory template lint warnings for authors/admins.
 * Shown above the simulator when lintSimulatorPayload returns warnings.
 * Non-blocking; does not affect runtime.
 */
import { useId, useState } from 'react';
import { Alert, Collapse } from 'react-bootstrap';
import type { SimulatorLintWarning } from '../utils/lintSimulatorPayload';

export interface SimulatorLintBannerProps {
    warnings: SimulatorLintWarning[];
    /** Optional class for the container. */
    className?: string;
}

export default function SimulatorLintBanner({ warnings, className }: Readonly<SimulatorLintBannerProps>) {
    const listId = useId();
    const [open, setOpen] = useState(true);
    if (warnings.length === 0) return null;
    return (
        <Alert
            variant="warning"
            className={`mb-2 small ${className ?? ''}`.trim()}
            data-testid="simulator-lint-banner"
        >
            <button
                type="button"
                className="btn btn-link p-0 text-decoration-none text-dark fw-medium align-baseline"
                onClick={() => setOpen((prev: boolean) => !prev)}
                aria-expanded={open}
                aria-controls={listId}
            >
                Template suggestions ({warnings.length})
            </button>
            <span className="text-muted ms-1">— advisory; scenario still runs.</span>
            <Collapse in={open}>
                <ul id={listId} className="mb-0 mt-1 ps-3">
                    {warnings.map((w, i) => (
                        <li key={`${w.code}-${i}`}>
                            {w.path != null && (
                                <span className="text-muted">{w.path}: </span>
                            )}
                            {w.message}
                        </li>
                    ))}
                </ul>
            </Collapse>
        </Alert>
    );
}
