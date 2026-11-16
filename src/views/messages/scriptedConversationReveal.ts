import type { SimulatorSmsPayload } from '../../types/session.js';

/** Deterministic authored-order prefix at an inclusive cumulative-delay boundary. */
export function scriptedConversationVisibleCount(
    messages: readonly SimulatorSmsPayload['thread']['messages'][number][],
    elapsedMs: number,
): number {
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return 0;
    let cumulativeMs = 0;
    let count = 0;
    for (const message of messages) {
        cumulativeMs += Math.max(0, message.delay_seconds ?? 0) * 1000;
        if (cumulativeMs > elapsedMs) break;
        count += 1;
    }
    return count;
}

/** Local runtime messages do not consume or wait behind the authored reveal schedule. */
export function scriptedConversationVisibleMessages(
    messages: readonly SimulatorSmsPayload['thread']['messages'][number][],
    elapsedMs: number,
    immediateMessageIds: readonly string[] = [],
): readonly SimulatorSmsPayload['thread']['messages'][number][] {
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return [];
    const immediate = new Set(immediateMessageIds);
    const isImmediate = (message: SimulatorSmsPayload['thread']['messages'][number]) =>
        message.id !== undefined && immediate.has(message.id);
    const scripted = messages.filter((message) => !isImmediate(message));
    let remaining = scriptedConversationVisibleCount(scripted, elapsedMs);
    return messages.filter((message) => {
        if (isImmediate(message)) return true;
        const visible = remaining > 0;
        remaining -= 1;
        return visible;
    });
}
