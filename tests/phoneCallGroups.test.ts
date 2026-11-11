import { expect, it } from 'vitest';
import { phoneCallGroups, newestPhoneCalls } from '../src/utils/payload/phoneCallGroups';
it('groups full normalized numbers using the latest call and descending timestamps', () => {
    const calls = [
        {
            id: 'old',
            name: 'James',
            number: '+1 (303) 333-3333',
            timestamp: '2026-11-01T09:00:00Z',
        },
        { id: 'new', name: 'James', number: '+13033333333', timestamp: '2026-11-01T11:00:00Z' },
        { id: 'mom', name: 'Mom', number: '+13032649086', timestamp: '2026-11-22T01:00:00Z' },
    ];
    expect(phoneCallGroups(calls).map((group) => group.map((call) => call.id))).toEqual([
        ['mom'],
        ['new', 'old'],
    ]);
    expect(calls.map((call) => call.id)).toEqual(['old', 'new', 'mom']);
});
it('keeps unknown numbers, distinct full numbers and tied timestamps stable', () => {
    const calls = [
        { id: 'a', number: '', name: 'Same' },
        { id: 'b', name: 'Same' },
        { id: 'c', number: '+12025550111' },
        { id: 'd', number: '+442025550111' },
    ];
    expect(phoneCallGroups(calls)).toHaveLength(4);
    expect(newestPhoneCalls(calls)).toEqual(calls);
    expect(
        newestPhoneCalls([
            { id: 'invalid', timestamp: 'Today' },
            { id: 'dated', timestamp: '2026-11-01T12:00:00Z' },
        ]).map((call) => call.id),
    ).toEqual(['dated', 'invalid']);
});
