/**
 * Lightweight validation for simulator template shape.
 * Throws with a clear, author-facing message so callers can show an error without crashing the page.
 * Full validation (entry_point, refs, secondary_defaults) runs at API/import; see backend and docs.
 *
 * **App usage:** not imported by current `frontend/workspace/src` or `frontend/administration/src` (subpath export is for tests/tooling and internal callers).
 */

import type { SimulatorChannel } from '../types/session';

const VALID_CHANNELS: SimulatorChannel[] = ['contacts', 'email', 'sms', 'browser', 'phone', 'home'];

const HINT = ' See docs/simulator/simulator-authoring.md for schema and allowed values.';

/**
 * Ensures payload has the minimal simulator template shape (channel required). Throws if not.
 * Use before getInitialSessionState so invalid template data fails gracefully.
 *
 * Return type is `void` (not `asserts`) to keep callers ergonomic.
 * This helper intentionally stays on its documented subpath rather than the main barrel because
 * workspace Vitest/Vite SSR has dropped that barrel binding in practice.
 */
export function validateSimulatorPayload(payload: unknown): void {
    if (payload == null || typeof payload !== 'object') {
        throw new Error('Invalid simulator payload: payload is missing or not an object.' + HINT);
    }
    const p = payload as Record<string, unknown>;
    if (typeof p.channel !== 'string' || !VALID_CHANNELS.includes(p.channel as SimulatorChannel)) {
        throw new Error(
            `Invalid simulator payload: channel must be one of ${VALID_CHANNELS.join(', ')}. Got: ${String(p.channel)}.` +
                HINT
        );
    }
}
