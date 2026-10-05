import type { SimulatorTemplatePayload } from '../../types/session.js';
import type { SimulatorLintCode, SimulatorLintWarning } from './lintSimulatorPayload.js';
/**
 * Advisory linting for simulator template payloads.
 * Runs after validation; does not throw. Catches quality/authoring issues that
 * are technically valid but likely mistakes (empty entry content, unreachable
 * targets, missing sender identity, duplicate keys, etc.).
 * Kept separate from validateSimulatorPayload (hard validation).
 */

export function getEntryScreen(ep: SimulatorTemplatePayload['entryPoint']): string | null {
    if (ep?.screen == null) {
        return null;
    }
    return String(ep.screen).toLowerCase();
}

export function add(
    warnings: SimulatorLintWarning[],
    code: SimulatorLintCode,
    message: string,
    path?: string,
): void {
    warnings.push({ code, message, path });
}
