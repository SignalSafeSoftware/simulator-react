import { describe, expect, it } from 'vitest';
import { mapMessages } from '../src/adapters/device/messagesMapper';

describe('message thread previews', () => {
    it('infers the matching thread preview from the last message without shortening Unicode', () => {
        const result = mapMessages({
            threads: [
                { id: 'one', snippet: 'Outdated' },
                { id: 'two', snippet: 'Retained other conversation' },
            ],
            thread_detail: {
                id: 'one',
                messages: [
                    { from: 'them', text: 'Earlier' },
                    { from: 'me', text: 'Latest 👩🏽‍💻\n  message' },
                ],
            },
        });
        expect(result?.threads?.[0]?.preview).toBe('Latest 👩🏽‍💻 message');
        expect(result?.threads?.[1]?.preview).toBe('Retained other conversation');
    });
    it('keeps retained summary data when no source message exists', () => {
        expect(
            mapMessages({
                threads: [{ id: 'one', snippet: 'Retained' }],
                thread_detail: { id: 'one', messages: [] },
            })?.threads?.[0]?.preview,
        ).toBe('Retained');
    });
});
