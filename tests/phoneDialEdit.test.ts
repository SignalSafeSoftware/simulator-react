import { expect, it } from 'vitest';
import { editDialNumber } from '../src/views/phoneDialEdit.js';
it('inserts or replaces at the selected position', () => {
    expect(editDialNumber('+1 (202)', 4, 7, '5')).toEqual({ value: '+1 (5)', caret: 5 });
    expect(editDialNumber('123', 0, 0, '4')).toEqual({ value: '4123', caret: 1 });
    expect(editDialNumber('123', 3, 3, '4')).toEqual({ value: '1234', caret: 4 });
});
it('deletes a selection or previous character, never the last digit at the start', () => {
    expect(editDialNumber('1234', 1, 3)).toEqual({ value: '14', caret: 1 });
    expect(editDialNumber('1234', 2, 2)).toEqual({ value: '134', caret: 1 });
    expect(editDialNumber('1234', 0, 0)).toEqual({ value: '1234', caret: 0 });
});
