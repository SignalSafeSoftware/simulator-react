// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { downloadJsonFile } from '../src/utils/browser/browserEnvironment.js';

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
});
it('downloads JSON and releases the temporary URL even if clicking fails', () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:test-backup');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
        this: HTMLAnchorElement,
    ) {
        expect(this.download).toBe('simulator-backup.json');
        expect(this.href).toBe('blob:test-backup');
    });
    downloadJsonFile('{}', 'simulator-backup.json');
    expect(createObjectURL.mock.calls[0]?.[0]).toBeInstanceOf(Blob);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-backup');
    click.mockImplementation(() => {
        throw new Error('blocked');
    });
    expect(() => downloadJsonFile('{}', 'simulator-backup.json')).toThrow('blocked');
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
});
