/**
 * Optional host logical time for one scripted conversation. Runtime presentation only:
 * hosts retain the conversation-local origin and supply elapsed milliseconds directly.
 * Omit this option to retain the standalone wall-clock reveal behavior.
 */
export interface ScriptedConversationClock {
    readonly conversationId: string;
    readonly elapsedMs: number;
    /** Exact IDs of runtime-only local messages, visible immediately without consuming authored delays. */
    readonly immediateMessageIds?: readonly string[];
}
