/** Apply a keypad edit without discarding the user's selection or formatted text. */
export function editDialNumber(value: string, start: number, end: number, digit?: string): { value: string; caret: number } {
    const from = Math.max(0, Math.min(start, value.length));
    const to = Math.max(from, Math.min(end, value.length));
    const removeFrom = digit === undefined && from === to ? Math.max(0, from - 1) : from;
    const insertion = digit ?? '';
    return { value: value.slice(0, removeFrom) + insertion + value.slice(to), caret: removeFrom + insertion.length };
}
