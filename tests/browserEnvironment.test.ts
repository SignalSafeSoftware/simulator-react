// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    currentIsoTime,
    currentTimeMs,
    dispatchDocumentEvent,
    focusDocumentElement,
    listenForDocumentKeydown,
} from '../src/utils/browser/browserEnvironment.js';

describe('browserEnvironment clock and document adapters', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        document.body.innerHTML = '';
    });

    it('reads the current time from the system clock', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2030-01-02T03:04:05.000Z'));
        expect(currentIsoTime()).toBe('2030-01-02T03:04:05.000Z');
        expect(currentTimeMs()).toBe(Date.parse('2030-01-02T03:04:05.000Z'));
    });

    it('listens for capture-phase keydown until the cleanup runs', () => {
        const handler = vi.fn();
        const stop = listenForDocumentKeydown(handler);
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
        stop();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('dispatches events on the document and tolerates a missing document', () => {
        const handler = vi.fn();
        document.addEventListener('probe', handler);
        dispatchDocumentEvent(new Event('probe'));
        document.removeEventListener('probe', handler);
        expect(handler).toHaveBeenCalledTimes(1);
        vi.stubGlobal('document', undefined);
        expect(() => dispatchDocumentEvent(new Event('probe'))).not.toThrow();
    });

    it('focuses a matching element and ignores a missing one', () => {
        document.body.innerHTML = '<input data-probe />';
        focusDocumentElement('[data-probe]');
        expect(document.activeElement?.hasAttribute('data-probe')).toBe(true);
        expect(() => focusDocumentElement('[data-missing]')).not.toThrow();
    });
});
