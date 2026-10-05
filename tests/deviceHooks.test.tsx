// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DeviceStore } from '@signalsafe/simulator-core/apps/store';
import { useDevicePage } from '../src/hooks/device/useDevicePage';
import { useDeviceRecord } from '../src/hooks/device/useDeviceRecord';
import { SIMULATOR_PAGE_SIZE, useVisiblePage } from '../src/hooks/device/useVisiblePage';

const store = (overrides: Record<string, unknown> = {}) =>
    ({ data: { revision: 1 }, ...overrides }) as unknown as DeviceStore;

describe('useVisiblePage', () => {
    it('grows by one page and resets when the scope changes', () => {
        const { result, rerender } = renderHook(({ scope }) => useVisiblePage(scope), {
            initialProps: { scope: 'a' },
        });
        expect(result.current.count).toBe(SIMULATOR_PAGE_SIZE);
        act(() => result.current.loadMore());
        expect(result.current.count).toBe(SIMULATOR_PAGE_SIZE * 2);
        rerender({ scope: 'b' });
        expect(result.current.count).toBe(SIMULATOR_PAGE_SIZE);
    });
});

describe('useDeviceRecord', () => {
    it('stays idle without an id or store data', () => {
        const get = vi.fn();
        const { result } = renderHook(() => useDeviceRecord(store({ get }), 'photos', null));
        expect(result.current).toMatchObject({ record: null, error: '', loading: false });
        const noData = renderHook(() =>
            useDeviceRecord({ get, data: undefined } as unknown as DeviceStore, 'photos', 'p1'),
        );
        expect(noData.result.current.loading).toBe(true);
        expect(get).not.toHaveBeenCalled();
    });

    it('loads a record, reports a missing one and retries', async () => {
        const get = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'p1' });
        const { result } = renderHook(() => useDeviceRecord(store({ get }), 'photos', 'p1'));
        await waitFor(() => expect(result.current.error).not.toBe(''));
        expect(result.current.record).toBeNull();
        act(() => result.current.retry());
        await waitFor(() => expect(result.current.record).toEqual({ id: 'p1' }));
        expect(result.current.error).toBe('');
    });

    it('reports failures with their own message or a fallback', async () => {
        const failing = vi
            .fn()
            .mockRejectedValueOnce(new Error('boom'))
            .mockRejectedValueOnce('nope');
        const { result } = renderHook(() =>
            useDeviceRecord(store({ get: failing }), 'photos', 'p1'),
        );
        await waitFor(() => expect(result.current.error).toBe('boom'));
        act(() => result.current.retry());
        await waitFor(() => expect(result.current.error).not.toBe('boom'));
        expect(result.current.error).not.toBe('');
    });

    it('ignores results that arrive after unmount', async () => {
        let resolve: (value: unknown) => void = () => {};
        let reject: (reason: unknown) => void = () => {};
        const pending = new Promise((done) => (resolve = done));
        const failing = new Promise((_done, fail) => (reject = fail));
        const first = renderHook(() =>
            useDeviceRecord(store({ get: () => pending }), 'photos', 'p1'),
        );
        const second = renderHook(() =>
            useDeviceRecord(store({ get: () => failing }), 'photos', 'p2'),
        );
        first.unmount();
        second.unmount();
        resolve({ id: 'p1' });
        reject(new Error('late'));
        await Promise.resolve();
        expect(first.result.current.record).toBeNull();
        expect(second.result.current.error).toBe('');
    });
});

const pageOf = (start: number, size: number, total: number, revision = 1) => ({
    records: Array.from({ length: size }, (_, index) => ({ id: `r${start + index}` })),
    total,
    revision,
});

describe('useDevicePage', () => {
    it('does nothing when disabled or without store data', () => {
        const page = vi.fn();
        const disabled = renderHook(() => useDevicePage(store({ page }), 'mail', {}, 20, false));
        expect(disabled.result.current).toMatchObject({ loading: false, error: '', records: [] });
        const noData = renderHook(() =>
            useDevicePage({ page, data: undefined } as unknown as DeviceStore, 'mail', {}, 20),
        );
        expect(noData.result.current.records).toEqual([]);
        expect(page).not.toHaveBeenCalled();
    });

    it('loads consecutive pages, reuses cached ones and stops at the total', async () => {
        const page = vi.fn(async (_collection: string, query: { offset?: number }) =>
            pageOf(query.offset ?? 0, query.offset === 20 ? 5 : 20, 25),
        );
        const { result, rerender } = renderHook(
            ({ count }) => useDevicePage(store({ page }), 'mail', { folder: 'inbox' }, count),
            { initialProps: { count: 20 } },
        );
        await waitFor(() => expect(result.current.records).toHaveLength(20));
        rerender({ count: 40 });
        await waitFor(() => expect(result.current.records).toHaveLength(25));
        expect(result.current.total).toBe(25);
        expect(page).toHaveBeenCalledTimes(2);
    });

    it('rejects pages from another revision', async () => {
        const page = vi.fn(async () => pageOf(0, 1, 1, 2));
        const { result } = renderHook(() => useDevicePage(store({ page }), 'mail', {}, 20));
        await waitFor(() => expect(result.current.error).not.toBe(''));
        expect(result.current.records).toEqual([]);
    });

    it('reports failures and retries', async () => {
        const page = vi
            .fn()
            .mockRejectedValueOnce(new Error('down'))
            .mockRejectedValueOnce('odd')
            .mockResolvedValue(pageOf(0, 1, 1));
        const { result } = renderHook(() => useDevicePage(store({ page }), 'mail', {}, 20));
        await waitFor(() => expect(result.current.error).toBe('down'));
        expect(page).toHaveBeenCalledTimes(1);
        act(() => result.current.retry());
        await waitFor(() => expect(page).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(result.current.error).toBe('Could not load saved records.'));
        act(() => result.current.retry());
        await waitFor(() => expect(result.current.records).toHaveLength(1));
        expect(page).toHaveBeenCalledTimes(3);
        expect(result.current.error).toBe('');
    });

    it('drops responses that arrive after unmount', async () => {
        let resolve: (value: unknown) => void = () => {};
        let reject: (reason: unknown) => void = () => {};
        const slow = vi.fn(() => new Promise((done) => (resolve = done)));
        const failing = vi.fn(() => new Promise((_done, fail) => (reject = fail)));
        const first = renderHook(() => useDevicePage(store({ page: slow }), 'mail', {}, 20));
        const second = renderHook(() => useDevicePage(store({ page: failing }), 'mail', {}, 20));
        first.unmount();
        second.unmount();
        resolve(pageOf(0, 1, 1));
        reject(new Error('late'));
        await Promise.resolve();
        expect(first.result.current.records).toEqual([]);
        expect(second.result.current.error).toBe('');
    });
});
