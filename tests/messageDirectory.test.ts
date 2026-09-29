import { expect, it } from 'vitest';
import { mapMessages } from '../src/adapters/fullDeviceToSession.js';

it('preserves directory rows without fabricating selected message content', () => {
    const payload = mapMessages({
        threads: [{ id: 'thread', contact_name: 'Person', snippet: 'Preview' }],
    });
    expect(payload?.threads).toEqual([
        expect.objectContaining({ id: 'thread', senderName: 'Person', preview: 'Preview' }),
    ]);
    expect(payload?.thread.messages).toEqual([]);
    expect(payload?.visibleMessageCount).toBe(0);
});
